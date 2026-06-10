import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useSessionStore } from "../store/session";

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
  const from = (location.state as { from?: string } | null)?.from || "/profile";

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [from, navigate, token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const normalizedEmail = email.trim().toLowerCase();
    const payload =
      mode === "login"
        ? { email: normalizedEmail, password: password.trim() }
        : {
            full_name: fullName.trim(),
            email: normalizedEmail,
            password: password.trim(),
            whatsapp_number: whatsappNumber.trim() || null
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
    <div className="mx-auto w-full max-w-xl px-4 py-10 pb-24 md:py-16">
      <div className="card rounded-3xl p-6 md:p-10">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold">{mode === "login" ? "Login" : "Register"} to RideSaathi</h1>
            <p className="mt-2 text-muted">Use demo credentials or create one account that can publish and book rides.</p>
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
          {message && <p className="alert-success">{message}</p>}
          {error && <p className="alert-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
