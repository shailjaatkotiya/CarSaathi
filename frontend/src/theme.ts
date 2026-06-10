import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3d251e",
      dark: "#5b3e31",
      light: "#b8f5c7",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#7c4a21",
      dark: "#5b3418",
      light: "#c58a55",
      contrastText: "#ffffff"
    },
    background: {
      default: "#fbf7ed",
      paper: "#fffdf7"
    },
    text: {
      primary: "#2b1b10",
      secondary: "#755f4c"
    },
    divider: "#e8dcc9"
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: '"Poppins", Inter, "Segoe UI", Roboto, Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: 0 },
    h2: { fontWeight: 800, letterSpacing: 0 },
    h3: { fontWeight: 800, letterSpacing: 0 },
    h4: { fontWeight: 800, letterSpacing: 0 },
    h5: { fontWeight: 800, letterSpacing: 0 },
    h6: { fontWeight: 800, letterSpacing: 0 },
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
          border: "1px solid #e8dcc9",
          boxShadow: "0 18px 50px rgba(91, 52, 24, 0.08)"
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
