import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const heroImage = "https://commons.wikimedia.org/wiki/Special:FilePath/2019_Honda_City_E_(Indonesia)_front_view.jpg?width=1400";

const routes = [
  { route: "Ahmedabad to Rajkot", price: "Rs. 300-350", distance: "220-250 km", points: "Iscon, SG Highway, Bopal" },
  { route: "Rajkot to Jamnagar", price: "Rs. 150-250", distance: "90-100 km", points: "Bus Stand, Kalawad Road" }
];

const features = [
  [ShieldRoundedIcon, "Verified profiles", "Aadhaar mock verification keeps trust visible before rides start."],
  [DirectionsCarRoundedIcon, "Homely car comfort", "Choose drivers, cars, AC, pickup points, and flexible halt notes."],
  [GroupsRoundedIcon, "Friendly travel", "Skip the lonely bus and share intercity routes with verified people."],
  [MapRoundedIcon, "Gujarat-first routes", "Ahmedabad, Rajkot, Jamnagar, Surat, and nearby city corridors."]
] as const;

export default function LandingPage() {
  return (
    <>
      <Box sx={{ pt: { xs: 4, md: 8 }, pb: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
            <Stack spacing={3}>
              <Chip icon={<VerifiedRoundedIcon />} label="Verified Gujarat intercity carpooling" color="primary" sx={{ alignSelf: "flex-start" }} />
              <Box>
                <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 68 }, lineHeight: 0.96 }}>
                  RideSaathi
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mt: 2, maxWidth: 680, lineHeight: 1.45 }}>
                  Bored going alone in a bus? Choose a friendly car ride, flexible halts, and a homely intercity travel experience.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button component={Link} to="/search" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />}>
                  Find a ride
                </Button>
                <Button component={Link} to="/driver/create-ride" variant="outlined" size="large">
                  Publish your journey
                </Button>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                {[
                  ["10", "fresh seeded rides"],
                  ["5+", "pickup and drop points"],
                  ["3-10 days", "publish window"]
                ].map(([value, label]) => (
                  <Card key={label} variant="outlined">
                    <CardContent>
                      <Typography variant="h5">{value}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Stack>

            <Card sx={{ borderRadius: 5, overflow: "hidden" }}>
              <Box
                sx={{
                  minHeight: { xs: 260, md: 390 },
                  backgroundImage: `linear-gradient(180deg, rgba(16,24,40,0.02), rgba(16,24,40,0.26)), url("${heroImage}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative"
                }}
              >
                <Chip
                  label="Honda City style sedan"
                  sx={{ position: "absolute", left: 18, top: 18, bgcolor: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}
                />
              </Box>
              <CardContent>
                <Stack spacing={1.5}>
                  {routes.map((item) => (
                    <Box key={item.route} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: 800 }}>{item.route}</Typography>
                        <Typography color="primary.main" sx={{ fontWeight: 800 }}>
                          {item.price}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.distance} · {item.points}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
          {features.map(([Icon, title, copy]) => (
            <Card key={title} variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ width: 42, height: 42, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "rgba(15,118,110,0.08)", color: "primary.main" }}>
                  <Icon />
                </Box>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {copy}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
}
