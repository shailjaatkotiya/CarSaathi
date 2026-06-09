import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";

type Booking = {
  id: number;
  booking_code: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
};

export default function PassengerProfilePage() {
  const [message, setMessage] = useState("");
  const { data: passengerBookings, refetch } = useQuery({
    queryKey: ["passenger-profile-bookings"],
    queryFn: async () => (await api.get<Booking[]>("/passenger/bookings")).data
  });

  async function cancelBooking(bookingId: number) {
    await api.post(`/passenger/bookings/${bookingId}/cancel`, { reason: "Passenger cancelled from profile" });
    setMessage("Booking cancelled. WhatsApp cancellation message has been logged.");
    refetch();
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Stack spacing={2.5}>
        <Card sx={{ borderRadius: 4, bgcolor: "rgba(15,118,110,0.06)" }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4">Passenger Profile</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Booked rides that are not completed yet.
            </Typography>
          </CardContent>
        </Card>
        {message && <Alert severity="success">{message}</Alert>}

        {passengerBookings?.map((booking) => (
          <Card key={booking.id}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <ConfirmationNumberRoundedIcon color="primary" fontSize="small" />
                    <Typography variant="h6">{booking.booking_code}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {booking.seats_booked} seats · {booking.pickup_point} to {booking.drop_point}
                  </Typography>
                  <Chip label={`${booking.status} · Rs. ${booking.total_amount}`} color="primary" variant="outlined" sx={{ mt: 1 }} />
                </Box>
                {["pending", "confirmed"].includes(booking.status) && (
                  <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={() => cancelBooking(booking.id)} sx={{ alignSelf: { xs: "stretch", sm: "center" } }}>
                    Cancel
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}

        {passengerBookings?.length === 0 && <Alert severity="info">No unfinished booked rides yet.</Alert>}
      </Stack>
    </Container>
  );
}
