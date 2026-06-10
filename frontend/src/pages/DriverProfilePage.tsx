import MessageRoundedIcon from "@mui/icons-material/MessageRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { Alert, Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

type DriverBooking = {
  id: number;
  booking_code: string;
  status: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  passenger_name: string;
  passenger_whatsapp?: string;
  route: string;
  journey_date: string;
  departure_time: string;
};

export default function DriverProfilePage() {
  const { data: driverBookings } = useQuery({
    queryKey: ["driver-profile-bookings"],
    queryFn: async () => (await api.get<DriverBooking[]>("/driver/bookings/active")).data
  });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Stack spacing={2.5}>
        <Card sx={{ borderRadius: 4, bgcolor: "rgba(67,196,99,0.1)" }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4">Driver Profile</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Passenger details for all non-completed bookings on your rides.
            </Typography>
          </CardContent>
        </Card>

        {driverBookings?.map((booking) => (
          <Card key={booking.id}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h6">{booking.passenger_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {booking.route} · {booking.journey_date} at {booking.departure_time.slice(0, 5)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {booking.seats_booked} seats · {booking.pickup_point} to {booking.drop_point}
                  </Typography>
                </Box>
                <Chip label={booking.status} />
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: "wrap" }}>
                <Chip icon={<PersonRoundedIcon />} label={booking.booking_code} variant="outlined" />
                <Chip icon={<MessageRoundedIcon />} label={booking.passenger_whatsapp || "No WhatsApp"} variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        ))}

        {driverBookings?.length === 0 && <Alert severity="info">No passenger details yet.</Alert>}
      </Stack>
    </Container>
  );
}
