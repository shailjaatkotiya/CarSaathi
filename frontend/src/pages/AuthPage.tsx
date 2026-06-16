import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { apiErrorMessage } from "../lib/apiError";
import { queryKeys } from "../lib/queryKeys";
import { useSessionStore } from "../store/session";
import type { UserRole } from "../types";

function homeForRole(role: UserRole) {
  if (role === "driver") return "/driver/create-ride";
  if (role === "admin") return "/admin";
  return "/search";
}

function roleFromQuery(value: string | null): UserRole {
  return value === "driver" || value === "admin" || value === "passenger" ? value : "passenger";
}

function defaultsForRole(role: UserRole) {
  if (role === "driver") {
    return { email: "shubham@gmail.com", password: "driver@123", fullName: "Shubham" };
  }
  return { email: "shailja@gmail.com", password: "passenger@123", fullName: "Shailja" };
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const requiredRole = roleFromQuery(searchParams.get("role"));
  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>(requiredRole);
  const defaults = defaultsForRole(selectedRole);
  const [email, setEmail] = useState(defaults.email);
  const [password, setPassword] = useState(defaults.password);
  const [fullName, setFullName] = useState(defaults.fullName);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = useSessionStore((state) => state.token);
  const setToken = useSessionStore((state) => state.setToken);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const from = (location.state as { from?: string } | null)?.from || null;
  const hasRequiredRole = Boolean(searchParams.get("role"));

  useEffect(() => {
    const nextDefaults = defaultsForRole(selectedRole);
    setEmail(nextDefaults.email);
    setPassword(nextDefaults.password);
    setFullName(nextDefaults.fullName);
  }, [selectedRole]);

  useEffect(() => {
    if (!token) return;
    authApi
      .me()
      .then((user) => {
        if (user.role === requiredRole || !hasRequiredRole) {
          navigate(from || homeForRole(user.role), { replace: true });
        }
      })
      .catch(() => {
        /* invalid token handled by interceptor */
      });
  }, [from, hasRequiredRole, navigate, requiredRole, token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const data =
        mode === "login"
          ? await authApi.login({ email: normalizedEmail, password: password.trim() })
          : await authApi.register({
              full_name: fullName.trim(),
              email: normalizedEmail,
              password: password.trim(),
              whatsapp_number: whatsappNumber.trim() || null,
              role: selectedRole,
            });
      setToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      const me = await authApi.me();
      setMessage("Logged in successfully.");
      const canReturnToRequestedPage = from && (!hasRequiredRole || me.role === requiredRole);
      navigate(canReturnToRequestedPage ? from : homeForRole(me.role), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="card rounded-3xl p-6 md:p-10">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "login" ? "Login to your account" : `Create ${selectedRole} account`}
            </h1>
            <p className="mt-2 text-muted">
              {mode === "login"
                ? "Use your email and password. We will open the right profile based on your account role."
                : selectedRole === "driver"
                  ? "Driver accounts publish rides, manage passengers, and maintain car details."
                  : "Passenger accounts search, book, and manage booked rides."}
            </p>
          </div>

          <div className="flex rounded-full bg-sand-light p-1">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                  mode === value ? "bg-primary text-white" : "text-muted hover:text-ink"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <>
              <label>
                <span className="field-label">Register as</span>
                <select
                  className="input"
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as UserRole)}
                >
                  <option value="passenger">Passenger</option>
                  <option value="driver">Driver</option>
                </select>
              </label>
              <label>
                <span className="field-label">Full name</span>
                <input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
              <label>
                <span className="field-label">WhatsApp contact</span>
                <input
                  className="input"
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                  placeholder="9876509876"
                />
              </label>
            </>
          )}

          <label>
            <span className="field-label">Email</span>
            <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            <span className="field-label">Password</span>
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          <button className="btn-primary py-3 text-base" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : "Continue"}
          </button>
          {/* <Link to="/admin" className="btn-outline justify-center py-3 text-base">
            Login as Admin
          </Link> */}
          {message && <p className="alert-success">{message}</p>}
          {error && <p className="alert-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
