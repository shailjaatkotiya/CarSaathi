import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Alert, Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { api } from "../api/client";

export default function VerificationPage() {
  const [aadhaar, setAadhaar] = useState("444455556666");
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const { data } = await api.post("/profile/aadhaar", { aadhaar_number: aadhaar });
    setStatus(`Submitted ${data.masked_aadhaar}. Verification review is pending.`);
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 7 }, pb: 11 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack component="form" onSubmit={submit} spacing={2.5}>
            <ShieldRoundedIcon color="primary" sx={{ fontSize: 42 }} />
            <Typography variant="h4">Aadhaar verification</Typography>
            <Typography color="text.secondary">
              Aadhaar is masked after submission. The backend stores encrypted and tokenized values only, then verification can be reviewed manually in the MVP.
            </Typography>
            <TextField label="Aadhaar number" value={aadhaar} onChange={(event) => setAadhaar(event.target.value)} slotProps={{ htmlInput: { maxLength: 16 } }} />
            <Button variant="contained" type="submit" size="large">
              Submit securely
            </Button>
            {status && <Alert severity="success">{status}</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
