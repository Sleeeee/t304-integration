import React, { useState } from "react";
import getCookie from "../context/getCookie";
import { AppBar, Toolbar, Button, Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import CustomSnackbar from "./CustomSnackbar";

interface HeaderProps {
  onNavigate: (page: string) => void;
  onOpenMonitoring: () => void;
}

// Couleur contrastée pour l'accessibilité
const ACCESSIBLE_BLUE = "#2A4AE5";

const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenMonitoring }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const csrfToken = getCookie("csrftoken");
  const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

  const [snackbarText, setSnackbarText] = useState("");

  const logout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/wlogout/`, {
        method: "POST",
        credentials: "include",
        headers,
      });
      setSnackbarText("Successfully logged out");
      setTimeout(() => { window.location.reload() }, 1000);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { label: "Reservations", icon: "📅", page: "dashboard" },
    { label: "Monitoring", icon: "📊", page: "monitoring" },
    { label: "Users", icon: "👥", page: "users" },
    { label: "Lock", icon: "🔒", page: "lock" },
    { label: "Access Control", icon: "🛡️", page: "access-control" },
  ];

  return (
    <AppBar
      position="static"
      elevation={0}
      component="nav" // ACCESSIBILITÉ: Balise sémantique
      sx={{
        backgroundColor: "white",
        borderBottom: "1px solid #E0E0E0"
      }}
    >
      <CustomSnackbar
        isError={false}
        text={snackbarText}
        onClose={() => { setSnackbarText(""); }}
      />

      <Toolbar
        sx={{
          justifyContent: "space-between",
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        {/* Logo accessible au clavier */}
        <Typography
          variant={isSmall ? "h5" : "h4"}
          component="div"
          role="button" // Indique que c'est cliquable
          tabIndex={0}  // Rend l'élément focusable via Tab
          aria-label="Lares Home"
          sx={{
            fontWeight: 700,
            color: ACCESSIBLE_BLUE,
            letterSpacing: "-0.5px",
            mr: { xs: 1, sm: 2, md: 3, lg: 4 },
            flexShrink: 0,
            cursor: "pointer",
            outline: 'none',
            '&:focus': { textDecoration: 'underline' } // Feedback visuel du focus
          }}
          onClick={() => onNavigate("users")}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate("users");
            }
          }}
        >
          Lares
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 1, md: 2, lg: 3 },
            alignItems: "center",
            overflow: "hidden",
          }}
          role="menubar" // Indique une barre de menu
        >
          {navItems.map((item) => (
            <Button
              key={item.label}
              role="menuitem"
              // ACCESSIBILITÉ: Label explicite surtout quand le texte est caché sur mobile
              aria-label={item.label}
              onClick={() => {
                if (item.page === "monitoring") {
                  onOpenMonitoring();
                } else {
                  onNavigate(item.page);
                }
              }}
              sx={{
                color: "#666",
                textTransform: "none",
                fontWeight: 400,
                px: { xs: 1, sm: 1.5, md: 2, lg: 3 },
                py: 1,
                borderRadius: 1,
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                minWidth: "auto",
                "&:hover": {
                  backgroundColor: "#F5F7FF",
                  color: ACCESSIBLE_BLUE,
                },
                "&:focus": { // Focus visible
                  outline: `2px solid ${ACCESSIBLE_BLUE}`,
                  outlineOffset: '2px'
                }
              }}
            >
              {/* Gestion des icônes pour les lecteurs d'écran */}
              {!isSmall && <span aria-hidden="true" style={{ marginRight: 8 }}>{item.icon}</span>}
              {isSmall ? <span aria-hidden="true">{item.icon}</span> : item.label}
            </Button>
          ))}
        </Box>

        <Button
          variant="contained"
          onClick={logout}
          aria-label="Log out"
          sx={{
            backgroundColor: ACCESSIBLE_BLUE,
            textTransform: "none",
            fontWeight: 600,
            px: { xs: 2, sm: 3, md: 4 },
            py: 1,
            borderRadius: 2,
            boxShadow: "none",
            ml: { xs: 1, sm: 2, md: 3, lg: 4 },
            fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
            flexShrink: 0,
            "&:hover": {
              backgroundColor: "#1A3AC0", // Version plus foncée
              boxShadow: "0px 4px 12px rgba(59, 92, 255, 0.3)",
            },
          }}
        >
          {isSmall ? "OUT" : "LOG OUT"}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
