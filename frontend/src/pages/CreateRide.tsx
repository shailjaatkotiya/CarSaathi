import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import axios from "axios";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { api } from "../api/client";

const rideRules = [
  { value: "no_pets", label: "No pets" },
  { value: "no_extra_children", label: "No extra children" },
  { value: "no_music", label: "No music" },
  { value: "no_smoking", label: "No smoking" },
  { value: "no_alcohol", label: "No alcohol" },
  { value: "no_tobacco", label: "No tobacco" }
];

const defaultRuleValues = ["no_pets", "no_smoking", "no_alcohol", "no_tobacco"];

function formatRuleLabel(value: string) {
  return rideRules.find((rule) => rule.value === value)?.label ?? value.replace(/_/g, " ");
}

function FormSection({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "rgba(15,118,110,0.08)", color: "primary.main" }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ mt: 2.5 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

export default function CreateRide() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedRules, setSelectedRules] = useState(defaultRuleValues);
  const [extraInstructions, setExtraInstructions] = useState("Please be on time. Call before reaching pickup point.");
  const defaultRideDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const instructionText = [
    ...selectedRules.map((rule) => `- ${formatRuleLabel(rule)}`),
    ...extraInstructions
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `- ${line.replace(/^-+\s*/, "")}`)
  ].join("\n");

  function toggleRule(value: string, checked: boolean) {
    setSelectedRules((current) => {
      if (checked) return current.includes(value) ? current : [...current, value];
      return current.filter((rule) => rule !== value);
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const pickupPoints = String(payload.pickup_points).split(",").map((item) => item.trim()).filter(Boolean);
    const dropPoints = String(payload.drop_points).split(",").map((item) => item.trim()).filter(Boolean);

    if (pickupPoints.length < 5 || dropPoints.length < 5) {
      setError("Please add minimum 5 pickup points and 5 drop points before publishing.");
      return;
    }

    try {
      const { data } = await api.post("/driver/rides", {
        vehicle_id: 1,
        car_brand: payload.car_brand,
        car_model: payload.car_model,
        vehicle_number: payload.vehicle_number,
        fuel_type: payload.fuel_type,
        car_type: payload.car_type,
        source_city: payload.source_city,
        destination_city: payload.destination_city,
        distance_km: Number(payload.distance_km),
        journey_date: payload.journey_date,
        departure_time: payload.departure_time,
        available_seats: Number(payload.available_seats),
        price_per_seat: Number(payload.price_per_seat),
        pickup_points: pickupPoints,
        drop_points: dropPoints,
        route_stops: String(payload.route_stops).split(",").map((item) => item.trim()).filter(Boolean),
        ride_rules: selectedRules,
        driver_instructions: instructionText,
        route_notes: payload.route_notes,
        luggage_allowance: payload.luggage_allowance,
        smoking_allowed: !selectedRules.includes("no_smoking"),
        ac_available: true,
        women_only_preference: false
      });
      setMessage(`Ride published successfully as demo listing #${data.id}.`);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not publish the ride. Please check the backend is running and try again.");
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: 30, md: 42 } }}>
              Driver - Publish New Ride
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 780 }}>
              Fill the labelled fields below. The demo uses your default vehicle internally, so no vehicle ID is needed on this screen.
            </Typography>
          </Box>
          <Alert severity="info">
            Conditions: publish only 3 hours to 10 days before departure. Minimum 5 pickup points and 5 drop points are required.
          </Alert>

          <FormSection title="Car details" subtitle="Add the exact car passengers will see before booking." icon={<DirectionsCarRoundedIcon />}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              <TextField name="car_brand" label="Car brand" defaultValue="Maruti Suzuki" helperText="Example: Maruti Suzuki, Hyundai" />
              <TextField name="car_model" label="Car model" defaultValue="Swift Dzire" helperText="Example: Swift Dzire, Creta" />
              <TextField name="vehicle_number" label="Vehicle number" defaultValue="GJ01AB1234" helperText="Shown after confirmed booking" />
              <TextField name="fuel_type" label="Fuel type" select defaultValue="Petrol" helperText="Petrol, CNG, EV, or Diesel">
                <MenuItem value="Petrol">Petrol</MenuItem>
                <MenuItem value="CNG">CNG</MenuItem>
                <MenuItem value="EV">EV</MenuItem>
                <MenuItem value="Diesel">Diesel</MenuItem>
              </TextField>
              <TextField name="car_type" label="Car category" select defaultValue="Sedan" helperText="Choose SUV, Sedan, or 7 Seater">
                <MenuItem value="SUV">SUV</MenuItem>
                <MenuItem value="Sedan">Sedan</MenuItem>
                <MenuItem value="7 Seater">7 Seater</MenuItem>
              </TextField>
              <TextField name="available_seats" label="Available seats" defaultValue="3" helperText="Seats passengers can book" />
            </Box>
          </FormSection>

          <FormSection title="Ride route and timing" subtitle="Set the final route, date, time, and recoverable seat price." icon={<EventAvailableRoundedIcon />}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              <TextField name="source_city" label="Source city" defaultValue="Rajkot" helperText="Main city where ride starts" />
              <TextField name="destination_city" label="Destination city" defaultValue="Jamnagar" helperText="Final city where ride ends" />
              <TextField name="distance_km" label="Distance in km" defaultValue="96" helperText="Approx route distance" />
              <TextField name="journey_date" label="Journey date" type="date" defaultValue={defaultRideDate} slotProps={{ inputLabel: { shrink: true } }} helperText="Maximum 10 days ahead" />
              <TextField name="departure_time" label="Departure time" type="time" defaultValue="07:30" slotProps={{ inputLabel: { shrink: true } }} helperText="Minimum 3 hours from now" />
              <TextField name="price_per_seat" label="Price per seat" defaultValue="180" helperText="Passenger pays this amount per seat" />
            </Box>
          </FormSection>

          <FormSection title="Pickup, stops, and drop points" subtitle="Use comma-separated local points. Passengers can pick from these." icon={<RouteRoundedIcon />}>
            <Stack spacing={2}>
              <TextField
                name="pickup_points"
                label="Pickup points - minimum 5"
                multiline
                minRows={2}
                defaultValue="Rajkot Bus Stand, Kalawad Road, Gondal Road, University Road, Mavdi Circle"
                helperText="Example: Bopal, Gota, Iscon. Separate each point with comma."
              />
              <TextField
                name="route_stops"
                label="In-between stops"
                multiline
                minRows={2}
                defaultValue="Dhrol, Reliance Circle"
                helperText="Stops passengers can choose before final destination."
              />
              <TextField
                name="drop_points"
                label="Drop points - minimum 5"
                multiline
                minRows={2}
                defaultValue="Jamnagar Bus Stand, Patel Colony, Reliance Circle, Digjam Circle, Railway Station"
                helperText="Final city drop points. Separate each point with comma."
              />
            </Stack>
          </FormSection>

          <FormSection title="Passenger instructions" subtitle="Clear rules reduce friction before booking." icon={<RuleRoundedIcon />}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1 }}>
              {rideRules.map((rule) => (
                <FormControlLabel
                  key={rule.value}
                  control={<Checkbox checked={selectedRules.includes(rule.value)} onChange={(event) => toggleRule(rule.value, event.target.checked)} />}
                  label={rule.label}
                  sx={{ m: 0, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                />
              ))}
            </Box>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Extra driver instructions"
                multiline
                minRows={2}
                value={extraInstructions}
                onChange={(event) => setExtraInstructions(event.target.value)}
                helperText="Add any extra note passengers must read before booking."
              />
              <TextField
                name="driver_instructions_preview"
                label="Instructions field shown to passengers"
                multiline
                minRows={5}
                value={instructionText}
                slotProps={{ input: { readOnly: true } }}
                helperText="Selected passenger instruction pointers are added here as bullet points."
              />
            </Stack>
          </FormSection>

          <FormSection title="Other ride details" subtitle="Help passengers understand luggage and route expectations." icon={<RouteRoundedIcon />}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField name="luggage_allowance" label="Luggage allowance" defaultValue="One cabin bag" helperText="Example: One cabin bag per passenger" />
              <TextField name="route_notes" label="Route notes" multiline minRows={2} defaultValue="Short route with one optional water break." helperText="Example: halt, route preference, road condition" />
            </Box>
          </FormSection>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
            <Button variant="contained" size="large" type="submit">
              Publish New Ride
            </Button>
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
