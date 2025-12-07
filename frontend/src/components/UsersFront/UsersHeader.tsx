import React from "react";
import { useAuth } from '../../context/AuthContext'; 
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  useMediaQuery, 
  useTheme      
} from "@mui/material";

// Couleur accessible (Contrast > 4.5:1)
const ACCESSIBLE_BLUE = "#2A4AE5";

const UserHeader: React.FC = () => {
  const { logout } = useAuth(); 

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

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
            color: ACCESSIBLE_BLUE, // Couleur contrastée
            letterSpacing: "-0.5px", 
            mr: { xs: 1, sm: 2, md: 3, lg: 4 }, 
            flexShrink: 0,
          }}
        >
          Lares
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={logout}
          // ACCESSIBILITÉ: Label explicite
          aria-label="Log out"
          sx={{
            backgroundColor: ACCESSIBLE_BLUE, // Couleur contrastée
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
              backgroundColor: "#1A3AC0", // Version plus sombre pour le survol
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

export default UserHeader;