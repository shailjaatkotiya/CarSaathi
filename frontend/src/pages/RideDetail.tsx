import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import LocalGasStationRoundedIcon from "@mui/icons-material/LocalGasStationRounded";
import MessageRoundedIcon from "@mui/icons-material/MessageRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, Ride } from "../api/client";
import VerifiedBadge from "../components/VerifiedBadge";

const ruleLabels: Record<string, string> = {
  no_pets: "No pets",
  no_extra_children: "No extra children",
  no_music: "No music",
  no_smoking: "No smoking",
  no_alcohol: "No alcohol",
  no_tobacco: "No tobacco"
};

export default function RideDetail() {
  const { rideId } = useParams();
  const [seats, setSeats] = useState(1);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [message, setMessage] = useState("");
  const { data: ride } = useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => (await api.get<Ride>(`/passenger/rides/${rideId}`)).data
  });

  const paymentAmount = useMemo(() => (ride ? seats * ride.price_per_seat : 0), [ride, seats]);
  const instructionLines = useMemo(() => {
    if (!ride) return [];
    const fromRules = ride.ride_rules.map((rule) => ruleLabels[rule] ?? rule.replace(/_/g, " "));
    const fromText = (ride.driver_instructions ?? "")
      .split("\n")
      .map((line) => line.trim().replace(/^-+\s*/, ""))
      .filter(Boolean);
    return Array.from(new Set([...fromRules, ...fromText]));
  }, [ride]);

  async function book() {
    if (!ride) return;
    const { data } = await api.post(`/passenger/rides/${ride.id}/book`, {
      seats_booked: seats,
      pickup_point: pickup || ride.pickup_points[0],
      drop_point: drop || ride.drop_points[0]
    });
    setMessage(`Booking ${data.booking_code} created with ${data.status} status.`);
  }

  if (!ride) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="info">Loading ride details...</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.25, md: 3.5 } }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="h3" sx={{ fontSize: { xs: 30, md: 42 } }}>
                    {ride.source_city} to {ride.destination_city}
                  </Typography>
                  <VerifiedBadge verified={ride.driver_verified} />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {ride.distance_km} km · {ride.journey_date} · {ride.departure_time.slice(0, 5)}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(67, 196, 99, 0.12)", minWidth: 170 }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800 }}>
                  Price per seat
                </Typography>
                <Typography variant="h4" color="primary.dark">
                  Rs. {ride.price_per_seat}
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 380px" }, gap: 3 }}>
              <Stack spacing={2.25}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">Driver</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {ride.driver_name} · {ride.driver_rating} rating
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">Car details</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {ride.vehicle.brand} {ride.vehicle.model}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.25, flexWrap: "wrap" }}>
                        <Chip icon={<DirectionsCarRoundedIcon />} label={ride.vehicle.car_type} />
                        <Chip icon={<LocalGasStationRoundedIcon />} label={ride.vehicle.fuel_type} variant="outlined" />
                        <Chip label={ride.ac_available ? "AC" : "Non-AC"} variant="outlined" />
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">Pickup, stops, and drop points</Typography>
                    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                      {[
                        ["Pickup", ride.pickup_points.join(", ")],
                        ["In-between stops", ride.route_stops.length ? ride.route_stops.join(", ") : "No stops added"],
                        ["Drop", ride.drop_points.join(", ")]
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ p: 2, borderRadius: 3, bgcolor: "grey.50" }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                            {label}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.75 }}>
                            {value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">Driver instructions</Typography>
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {instructionLines.map((instruction) => (
                        <Stack key={instruction} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: 99, bgcolor: "primary.main" }} />
                          <Typography variant="body2">{instruction}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    {ride.route_notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Route note: {ride.route_notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip icon={<SecurityRoundedIcon />} label="Verified badge" color="primary" />
                  <Chip icon={<WarningAmberRoundedIcon />} label="Report user option" />
                  <Chip icon={<ShareRoundedIcon />} label="Ride sharing link" />
                </Stack>
              </Stack>

              <Card variant="outlined" sx={{ alignSelf: "start", position: { lg: "sticky" }, top: { lg: 96 } }}>
                <CardContent>
                  <Typography variant="h5">Book this ride</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    Choose seats, pickup, and a final drop or in-between stop.
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2.5 }}>
                    <TextField label="Seats" type="number" value={seats} onChange={(event) => setSeats(Number(event.target.value))} slotProps={{ htmlInput: { min: 1, max: ride.available_seats } }} />
                    <TextField label="Pickup" select value={pickup} onChange={(event) => setPickup(event.target.value)}>
                      <MenuItem value="">Select pickup</MenuItem>
                      {ride.pickup_points.map((point) => (
                        <MenuItem key={point} value={point}>
                          {point}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField label="Drop-off or stop" select value={drop} onChange={(event) => setDrop(event.target.value)}>
                      <MenuItem value="">Select drop</MenuItem>
                      {ride.route_stops.map((point) => (
                        <MenuItem key={point} value={point}>
                          {point} (in-between stop)
                        </MenuItem>
                      ))}
                      {ride.drop_points.map((point) => (
                        <MenuItem key={point} value={point}>
                          {point}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button variant="contained" size="large" startIcon={<MessageRoundedIcon />} onClick={book}>
                      Book ride · Rs. {paymentAmount}
                    </Button>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      {ride.available_seats} seats available. WhatsApp details are shared after confirmation.
                    </Typography>
                    {message && <Alert severity="success">{message}</Alert>}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
