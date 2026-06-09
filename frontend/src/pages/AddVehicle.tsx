import LocalGasStationRoundedIcon from "@mui/icons-material/LocalGasStationRounded";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { api } from "../api/client";

const categories = [
  { value: "Mini", icon: "M", hint: "Small city-friendly car" },
  { value: "Sedan", icon: "S", hint: "Comfortable intercity car" },
  { value: "7 Seater", icon: "7", hint: "Large family/group car" }
];

export default function AddVehicle() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Sedan");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    await api.post("/driver/vehicles", { ...payload, car_type: category, seats: Number(payload.seats), photo_urls: [] });
    setMessage("Vehicle added. Verification can be completed later.");
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4">Add vehicle</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Add car details passengers can compare before requesting seats.
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
                <TextField name="brand" label="Brand" defaultValue="Maruti Suzuki" />
                <TextField name="model" label="Model" defaultValue="Swift Dzire" />
                <TextField name="vehicle_number" label="Vehicle number" defaultValue="GJ01AB1234" />
                <TextField name="fuel_type" label="Fuel type" select defaultValue="Petrol">
                  <MenuItem value="Petrol">Petrol</MenuItem>
                  <MenuItem value="Diesel">Diesel</MenuItem>
                  <MenuItem value="CNG">CNG</MenuItem>
                  <MenuItem value="EV">EV</MenuItem>
                </TextField>
                <TextField name="seats" label="Seats" defaultValue="4" />
              </Box>

              <Box>
                <Typography variant="h6">Car category</Typography>
                <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                  {categories.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={category === item.value ? "contained" : "outlined"}
                      onClick={() => setCategory(item.value)}
                      sx={{ justifyContent: "flex-start", p: 2, borderRadius: 3, textAlign: "left" }}
                    >
                      <Stack sx={{ alignItems: "flex-start" }}>
                        <Typography sx={{ fontWeight: 900 }}>
                          {item.icon} · {item.value}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                          <LocalGasStationRoundedIcon fontSize="inherit" /> Fuel type selected above
                        </Typography>
                        <Typography variant="caption">{item.hint}</Typography>
                      </Stack>
                    </Button>
                  ))}
                </Box>
              </Box>

              <Button variant="contained" type="submit" size="large" sx={{ alignSelf: "flex-start" }}>
                Save vehicle
              </Button>
              {message && <Alert severity="success">{message}</Alert>}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
