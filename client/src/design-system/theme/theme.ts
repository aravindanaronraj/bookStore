import { createTheme } from "@mui/material/styles";

import { colors } from "./colors";
import { typography } from "./typography";
import { radius } from "./radius";
import { breakpoints } from "./breakpoints";

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },

    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrastText,
    },

    success: {
      main: colors.success.main,
      light: colors.success.light,
      dark: colors.success.dark,
    },

    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
      dark: colors.warning.dark,
    },

    error: {
      main: colors.error.main,
      light: colors.error.light,
      dark: colors.error.dark,
    },

    info: {
      main: colors.info.main,
      light: colors.info.light,
      dark: colors.info.dark,
    },

    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },

    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
  },

  typography,

  breakpoints: {
    values: {
      xs: breakpoints.mobile,
      sm: breakpoints.tablet,
      md: breakpoints.laptop,
      lg: breakpoints.desktop,
      xl: breakpoints.large,
    },
  },

  shape: {
    borderRadius: radius.md,
  },

  spacing: 8,

  components: {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },

    styleOverrides: {
      root: {
        borderRadius: radius.md,
        textTransform: "none",
        fontWeight: 700,
        padding: "10px 20px",
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": {
          transform: "translateY(-1px)",
        },
      },
    },
  },

  MuiTextField: {
    defaultProps: {
      fullWidth: true,
    },

    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: radius.md,
        },
      },
    },
  },

  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: radius.lg,
        boxShadow: "0 14px 40px rgba(30, 64, 175, 0.08)",
      },
    },
  },
},
});
