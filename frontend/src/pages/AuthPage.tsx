import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { apiErrorMessage } from "../lib/apiError";
import { queryKeys } from "../lib/queryKeys";
import { useSessionStore } from "../store/session";

const AUTH_HOME = "/search";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("shailja@gmail.com");
  const [password, setPassword] = useState("passenger@123");
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
  const from = (location.state as { from?: string } | null)?.from || next || null;

  useEffect(() => {
    if (!token) return;
    authApi
      .me()
      .then(() => navigate(from || AUTH_HOME, { replace: true }))
      .catch(() => {
        /* invalid token handled by interceptor */
      });
  }, [from, navigate, token]);

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
            });
      setToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await authApi.me();
      setMessage("Logged in successfully.");
      navigate(from || AUTH_HOME, { replace: true });
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
            <h1 className="text-3xl font-bold">{mode === "login" ? "Login" : "Create your account"}</h1>
            <p className="mt-2 text-muted">
              {mode === "login"
                ? "Enter your email and password to book, publish, and manage rides from one account."
                : "Create one account for your profile, bookings, vehicles, and published rides."}
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
