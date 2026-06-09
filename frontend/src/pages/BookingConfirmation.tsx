import MessageRoundedIcon from "@mui/icons-material/MessageRounded";
import { Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function BookingConfirmation() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 }, pb: 11 }}>
      <Card sx={{ borderRadius: 4, textAlign: "center" }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <MessageRoundedIcon color="primary" sx={{ fontSize: 52 }} />
            <Typography variant="h3" sx={{ fontSize: { xs: 30, md: 40 } }}>
              Booking request sent
            </Typography>
            <Typography color="text.secondary">
              Once the driver confirms, RideSaathi sends both passenger and driver details through WhatsApp with pickup, drop, seat count, and booking ID.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
