import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
      dark: "#115e59",
      light: "#5eead4",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#111827",
      contrastText: "#ffffff"
    },
    background: {
      default: "#f5f7f6",
      paper: "#ffffff"
    },
    text: {
      primary: "#101828",
      secondary: "#667085"
    },
    divider: "#e5e7eb"
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: 'Inter, "SF Pro Display", "Segoe UI", Roboto, Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: { textTransform: "none", fontWeight: 700 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          boxShadow: "none",
          paddingInline: 18
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e5e7eb",
          boxShadow: "0 18px 50px rgba(16, 24, 40, 0.06)"
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: "small"
      }
    },
    MuiSelect: {
      defaultProps: {
        size: "small"
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700
        }
      }
    }
  }
});
