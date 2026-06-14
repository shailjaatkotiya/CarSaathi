import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";

type AuthRole = "driver" | "passenger";

function authErrorMessage(err: unknown) {
  if (!axios.isAxiosError(err)) {
    return "Could not continue. Please check your details and try again.";
  }

  const detail = err.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(". ") || "Please check your details and try again.";
  }
  if (err.code === "ERR_NETWORK") {
    return "Could not reach the backend. Please make sure the API server is running on port 8000.";
  }
  return "Could not continue. Please check your details and try again.";
}

// Where to land after auth, based on the detected account role.
function homeForRole(role: string) {
  if (role === "driver") return "/driver/create-ride";
  if (role === "admin") return "/admin";
  return "/search";
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  // ?switch=driver lets a logged-in passenger sign into a driver account instead.
  const switchRole = searchParams.get("switch") === "driver" ? "driver" : null;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerRole, setRegisterRole] = useState<AuthRole>(switchRole ?? "passenger");
  const [email, setEmail] = useState(switchRole === "driver" ? "shubham@gmail.com" : "shailja@gmail.com");
  const [password, setPassword] = useState(switchRole === "driver" ? "driver@123" : "passenger@123");
  const [fullName, setFullName] = useState("Shailja");
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

  // Already signed in? Send them to their role home — unless they came here to
  // switch accounts (e.g. a passenger choosing to publish a ride as a driver).
  useEffect(() => {
    if (!token || switchRole) return;
    api
      .get<User>("/auth/me")
      .then(({ data }) => navigate(from || homeForRole(data.role), { replace: true }))
      .catch(() => {
        /* invalid token handled by interceptor */
      });
  }, [from, navigate, token, switchRole]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const payload =
      mode === "login"
        ? { email: normalizedEmail, password: password.trim() }
        : {
            full_name: fullName.trim(),
            email: normalizedEmail,
            password: password.trim(),
            whatsapp_number: whatsappNumber.trim() || null,
            role: registerRole
          };

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, payload);
      setToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      // Detect the role from the account and route accordingly.
      const me = (await api.get<User>("/auth/me")).data;
      setMessage("Logged in successfully.");
      navigate(from || homeForRole(me.role), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
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
              {switchRole ? "Login as a driver to publish" : mode === "login" ? "Login" : "Create your account"}
            </h1>
            <p className="mt-2 text-muted">
              {switchRole
                ? "Publishing a ride needs a driver account. Login as a driver, or register a new driver account, to continue."
                : mode === "login"
                ? "Enter your email and password. We detect your driver or passenger account automatically."
                : "Passenger accounts book rides. Driver accounts publish rides and manage car details."}
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
              <div className="grid gap-2 rounded-2xl bg-sand-light p-1 sm:grid-cols-2">
                {(["passenger", "driver"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRegisterRole(value)}
                    className={`rounded-xl px-4 py-3 text-sm font-bold capitalize transition ${
                      registerRole === value ? "bg-primary text-white" : "text-muted hover:text-ink"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
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
          <Link to="/admin" className="btn-outline justify-center py-3 text-base">
            Login as Admin
          </Link>
          {message && <p className="alert-success">{message}</p>}
          {error && <p className="alert-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
