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

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role") === "driver" ? "driver" : "passenger";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<AuthRole>(requestedRole);
  const [email, setEmail] = useState(requestedRole === "driver" ? "shubham@gmail.com" : "shailja@gmail.com");
  const [password, setPassword] = useState(requestedRole === "driver" ? "driver@123" : "passenger@123");
  const [fullName, setFullName] = useState(requestedRole === "driver" ? "Shubham" : "Shailja");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = useSessionStore((state) => state.token);
  const setToken = useSessionStore((state) => state.setToken);
  const logout = useSessionStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const from = (location.state as { from?: string } | null)?.from || (authRole === "driver" ? "/driver/create-ride" : "/search");

  useEffect(() => {
    setAuthRole(requestedRole);
    setEmail(requestedRole === "driver" ? "shubham@gmail.com" : "shailja@gmail.com");
    setPassword(requestedRole === "driver" ? "driver@123" : "passenger@123");
    setFullName(requestedRole === "driver" ? "Shubham" : "Shailja");
  }, [requestedRole]);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    api
      .get<User>("/auth/me")
      .then(({ data }) => {
        setCurrentUser(data);
        if (data.role === authRole) {
          navigate(from, { replace: true });
        }
      })
      .catch(() => setCurrentUser(null));
  }, [authRole, from, navigate, token]);

  async function switchAccount() {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      queryClient.clear();
      setCurrentUser(null);
      setMessage(`Logged out. Please login as ${authRole}.`);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const normalizedEmail = email.trim().toLowerCase();
    const payload =
      mode === "login"
        ? { email: normalizedEmail, password: password.trim(), role: authRole }
        : {
            full_name: fullName.trim(),
            email: normalizedEmail,
            password: password.trim(),
            whatsapp_number: whatsappNumber.trim() || null,
            role: authRole
          };

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post(endpoint, payload);
      setToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setMessage("Logged in successfully.");
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-4 pb-4 md:py-4">
      <div className="card rounded-3xl p-6 md:p-10">
        {token && currentUser && currentUser.role !== authRole ? (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">Login as {authRole}</h1>
              <p className="mt-2 text-muted">
                You are currently logged in as {currentUser.role}. Switch accounts to continue as {authRole}.
              </p>
            </div>
            <button type="button" className="btn-primary self-start" onClick={switchAccount}>
              Logout and login as {authRole}
            </button>
          </div>
        ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "login" ? "Login" : "Register"} as {authRole === "driver" ? "Driver" : "Passenger"}
            </h1>
            <p className="mt-2 text-muted">
              Passenger accounts book rides. Driver accounts publish rides and manage car details.
            </p>
          </div>

          <div className="grid gap-2 rounded-2xl bg-sand-light p-1 sm:grid-cols-2">
            {(["passenger", "driver"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => navigate(`/auth?role=${value}`, { replace: true, state: location.state })}
                className={`rounded-xl px-4 py-3 text-sm font-bold capitalize transition ${
                  authRole === value ? "bg-primary text-white" : "text-muted hover:text-ink"
                }`}
              >
                {value}
              </button>
            ))}
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
        )}
      </div>
    </div>
  );
}
