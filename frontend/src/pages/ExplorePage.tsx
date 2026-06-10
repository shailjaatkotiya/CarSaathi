import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import MessageRoundedIcon from "@mui/icons-material/MessageRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

const bookSteps = [
  "Open Passenger and search by city, date, time, price, car category, and pickup area like Bopal, Gota, or Iscon.",
  "Check pickup points, final drop points, and in-between stops such as Limbdi or Chotila before booking.",
  "Choose seats, pickup, and drop-off. After confirmation, WhatsApp details are shared with passenger and driver.",
  "Cancel from Passenger Profile when plans change. A WhatsApp cancellation message is logged for both sides."
];

const publishSteps = [
  "Open Driver and publish a ride without login in MVP demo mode.",
  "Choose source, destination, date, time, seats, price, vehicle, in-between stops, and passenger instructions.",
  "Publish only between 3 hours and 10 days before departure.",
  "For the same route, one driver can publish maximum 2 rides per day and 5 rides per week.",
  "Cancel a ride from My Rides. Passengers get a WhatsApp cancellation message."
];

const features = [
  "Driver and passenger views only, focused on booking and publishing rides.",
  "Car category support for Mini, Sedan, SUV, and 7 Seater with fuel type.",
  "Safety instructions: no pets, no extra children, no music, no smoking, no alcohol, no tobacco.",
  "Masked contact details before booking and WhatsApp notification logs after booking or cancellation.",
  "Passenger Profile shows active booked rides. Driver Profile shows passenger details."
];

function BulletList({ title, items, icon: Icon }: { title: string; items: string[]; icon: SvgIconComponent }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "rgba(67,196,99,0.12)", color: "primary.main" }}>
            <Icon />
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Stack>
        <Stack spacing={1.5} sx={{ mt: 2.5 }}>
          {items.map((item) => (
            <Stack key={item} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
              <CheckCircleRoundedIcon color="primary" fontSize="small" sx={{ mt: 0.15 }} />
              <Typography variant="body2" color="text.secondary">
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ExplorePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Stack spacing={3}>
        <Card sx={{ borderRadius: 4, bgcolor: "rgba(67,196,99,0.1)" }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 900 }}>
              RideSaathi guide
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.5, fontSize: { xs: 30, md: 42 } }}>
              Explore how to use the app easily
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 820 }}>
              Book comfortable carpool seats, publish your own intercity ride, manage cancellations, and compare stops before choosing a driver.
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
          <BulletList title="How to book a ride" items={bookSteps} icon={SearchRoundedIcon} />
          <BulletList title="How to publish a ride" items={publishSteps} icon={DirectionsCarRoundedIcon} />
          <BulletList title="Other functionality" items={features} icon={ExploreRoundedIcon} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
          <Card>
            <CardContent>
              <SecurityRoundedIcon color="primary" />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Safety-first ride rules
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Drivers can publish clear ride instructions before passengers book, so expectations are set early.
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <MessageRoundedIcon color="primary" />
              <Typography variant="h6" sx={{ mt: 1 }}>
                WhatsApp-ready updates
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Booking, passenger cancellation, and driver ride cancellation all create WhatsApp notification logs in the MVP.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
