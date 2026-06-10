import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
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
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
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
            role,
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
    <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 }, pb: 11 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4">{mode === "login" ? "Login" : "Register"} to RideSaathi</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Use demo credentials or create a driver/passenger profile.
                </Typography>
              </Box>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={mode}
                onChange={(_, value) => value && setMode(value)}
                sx={{ bgcolor: "grey.100", borderRadius: 999, p: 0.5 }}
              >
                <ToggleButton value="login" sx={{ borderRadius: 999 }}>
                  Login
                </ToggleButton>
                <ToggleButton value="register" sx={{ borderRadius: 999 }}>
                  Register
                </ToggleButton>
              </ToggleButtonGroup>
              {mode === "register" && (
                <>
                  <TextField label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  <TextField label="Role" select value={role} onChange={(event) => setRole(event.target.value as "passenger" | "driver")}>
                    <MenuItem value="passenger">Passenger</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                  </TextField>
                  <TextField label="WhatsApp contact" value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="9876509876" />
                </>
              )}
              <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button variant="contained" size="large" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : "Continue"}
              </Button>
              {message && <Alert severity="success">{message}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
