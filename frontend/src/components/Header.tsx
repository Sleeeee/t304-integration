import React, { useState } from "react";
import getCookie from "../context/getCookie";
import { AppBar, Toolbar, Button, Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import CustomSnackbar from "./CustomSnackbar";

interface HeaderProps {
  onNavigate: (page: string) => void;
  onOpenMonitoring: () => void; 
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenMonitoring }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const csrfToken = getCookie("csrftoken");
  const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

  const [snackbarText, setSnackbarText] = useState("");

  const logout = async () => {
    await fetch(`http://localhost:8000/auth/wlogout/`, {
      method: "POST",
      credentials: "include",
      headers,
    });

    setSnackbarText("Successfully logged out");
    setTimeout(() => { window.location.reload() }, 1000);
  };

  const navItems = [
    { label: "Monitoring", icon: "📊", page: "monitoring" },
    { label: "Users", icon: "👥", page: "users" },
    { label: "Lock", icon: "🔒", page: "lock" },
    { label: "Access", icon: "🔑", page: "access" },
    { label: "Access Control", icon: "🛡️", page: "access-control" },
    { label: "Settings", icon: "⚙️", page: "settings" },
  ];

  return (
    <AppBar
      position="static"
      elevation={0}
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
        <Typography
          variant={isSmall ? "h5" : "h4"}
          component="div"
          sx={{
            fontWeight: 700,
            color: "#3B5CFF",
            letterSpacing: "-0.5px",
            mr: { xs: 1, sm: 2, md: 3, lg: 4 },
            flexShrink: 0,
            cursor: "pointer",
          }}
          onClick={() => onNavigate("home")}
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
        >
          {navItems.map((item) => (
            <Button
              key={item.label}
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
                  color: "#3B5CFF",
                },
              }}
            >
              {!isSmall && <span style={{ marginRight: 8 }}>{item.icon}</span>}
              {isSmall ? item.icon : item.label}
            </Button>
          ))}
        </Box>

        <Button
          variant="contained"
          onClick={logout}
          sx={{
            backgroundColor: "#3B5CFF",
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
              backgroundColor: "#2A4AE5",
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