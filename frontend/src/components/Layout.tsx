import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";

const navItems = [
  { to: "/driver/create-ride", label: "Driver", icon: <DirectionsCarRoundedIcon /> },
  { to: "/search", label: "Passenger", icon: <SearchRoundedIcon /> },
  { to: "/explore", label: "Explore", icon: <ExploreRoundedIcon /> }
];

export default function Layout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);
  const logout = useSessionStore((state) => state.logout);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    enabled: Boolean(token),
    retry: false
  });

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      queryClient.clear();
      navigate("/auth", { replace: true });
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", pb: { xs: 8, md: 0 } }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(18px)"
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 72, justifyContent: "space-between", gap: 2 }}>
            <Stack component={Link} to="/" direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  boxShadow: "0 12px 30px rgba(67, 196, 99, 0.28)"
                }}
              >
                <DirectionsCarRoundedIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  RideSaathi
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gujarat intercity carpooling
                </Typography>
              </Box>
            </Stack>

            {!isMobile && (
              <Stack direction="row" spacing={0.5}>
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    component={NavLink}
                    to={item.to}
                    startIcon={item.icon}
                    sx={{
                      color: "text.secondary",
                      "&.active": { bgcolor: "primary.main", color: "primary.contrastText" }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            )}

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button component={Link} to={token ? "/profile" : "/auth"} variant="outlined" startIcon={<PersonRoundedIcon />} sx={{ borderColor: "divider", color: "text.primary" }}>
                {token ? user?.full_name?.split(" ")[0] || "Profile" : "Login"}
              </Button>
              {token && (
                <Button variant="contained" color="secondary" startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main">{children}</Box>

      {isMobile && (
        <BottomNavigation
          value={navItems.some((item) => item.to === location.pathname) ? location.pathname : "/search"}
          onChange={(_, value) => navigate(value)}
          showLabels
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: "1px solid",
            borderColor: "divider"
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction key={item.to} label={item.label} value={item.to} icon={item.icon} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
