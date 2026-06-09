import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { Alert, Button, Container, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";

export default function MyRides() {
  const [message, setMessage] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["my-rides"],
    queryFn: async () => (await api.get<Ride[]>("/driver/rides")).data
  });

  async function cancelRide(rideId: number) {
    await api.post(`/driver/rides/${rideId}/cancel`, { reason: "Driver cancelled from app" });
    setMessage("Ride cancelled. WhatsApp cancellation messages have been logged for booked passengers.");
    refetch();
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Stack spacing={2.5}>
        <Typography variant="h4">Driver - My rides</Typography>
        {message && <Alert severity="success">{message}</Alert>}
        {data?.map((ride) => (
          <Stack key={ride.id} spacing={1.25}>
            <RideCard ride={ride} />
            {ride.status !== "cancelled" && (
              <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={() => cancelRide(ride.id)}>
                Cancel ride and notify passengers on WhatsApp
              </Button>
            )}
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}
