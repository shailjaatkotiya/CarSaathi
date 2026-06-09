import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function DriverOnboarding() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Typography variant="h4">Driver onboarding</Typography>
          <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {["Verify Aadhaar", "Add driving license", "Add verified vehicle"].map((item, index) => (
              <Card key={item} variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="primary" sx={{ fontWeight: 900 }}>
                      Step {index + 1}
                    </Typography>
                    <Typography variant="h6">{item}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Required before listing intercity journeys.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
