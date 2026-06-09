import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AirlineSeatReclineNormalRoundedIcon from "@mui/icons-material/AirlineSeatReclineNormalRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import LocalGasStationRoundedIcon from "@mui/icons-material/LocalGasStationRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import type { Ride } from "../api/client";
import VerifiedBadge from "./VerifiedBadge";

function categoryIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("7")) return "7";
  if (normalized.includes("mini")) return "M";
  if (normalized.includes("suv")) return "SUV";
  return "SED";
}

export default function RideCard({ ride }: { ride: Ride }) {
  return (
    <Card sx={{ overflow: "hidden" }}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Stack spacing={2.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Box>
              <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="h6">
                  {ride.source_city} to {ride.destination_city}
                </Typography>
                <VerifiedBadge verified={ride.driver_verified} />
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {ride.vehicle.brand} {ride.vehicle.model} · {ride.ac_available ? "AC" : "Non-AC"}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="h5">Rs. {ride.price_per_seat}</Typography>
              <Typography variant="caption" color="text.secondary">
                per seat
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip icon={<DirectionsCarRoundedIcon />} label={`${categoryIcon(ride.vehicle.car_type)} · ${ride.vehicle.car_type}`} />
            <Chip icon={<LocalGasStationRoundedIcon />} label={ride.vehicle.fuel_type} variant="outlined" />
            <Chip icon={<AirlineSeatReclineNormalRoundedIcon />} label={`${ride.available_seats} seats left`} variant="outlined" />
            <Chip icon={<StarRoundedIcon />} label={`${ride.driver_rating || 4.5} rating`} variant="outlined" />
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} color="text.secondary">
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <AccessTimeRoundedIcon fontSize="small" />
              <Typography variant="body2">
                {ride.journey_date} at {ride.departure_time.slice(0, 5)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <LocationOnRoundedIcon fontSize="small" />
              <Typography variant="body2">{ride.distance_km} km</Typography>
            </Stack>
            {ride.route_stops.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <RouteRoundedIcon fontSize="small" />
                <Typography variant="body2">{ride.route_stops.join(" → ")}</Typography>
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {ride.pickup_points.slice(0, 4).map((point) => (
              <Chip key={point} size="small" label={point} sx={{ bgcolor: "grey.100" }} />
            ))}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Hosted by {ride.driver_name}
            </Typography>
            <Button component={Link} to={`/rides/${ride.id}`} variant="contained">
              View ride
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
