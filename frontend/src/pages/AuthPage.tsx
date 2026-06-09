import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";
import { api } from "../api/client";
import { useSessionStore } from "../store/session";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [email, setEmail] = useState("passenger@ridesaathi.in");
  const [password, setPassword] = useState("Passenger@123");
  const [fullName, setFullName] = useState("Demo Passenger");
  const [message, setMessage] = useState("");
  const setToken = useSessionStore((state) => state.setToken);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const payload = mode === "login" ? { email, password } : { full_name: fullName, email, password, role };
    const { data } = await api.post(endpoint, payload);
    setToken(data.access_token);
    setMessage("Logged in successfully. Continue to verification, search, or list a ride.");
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
                </>
              )}
              <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button variant="contained" size="large" type="submit">
                Continue
              </Button>
              {message && <Alert severity="success">{message}</Alert>}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
