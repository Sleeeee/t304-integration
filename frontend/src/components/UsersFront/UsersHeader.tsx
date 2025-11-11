import React from "react";
import { useAuth } from '../../context/AuthContext'; // Pour la déconnexion
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  useMediaQuery, // <-- 1. Importer
  useTheme      // <-- 2. Importer
} from "@mui/material";

// Ce header est UNIQUEMENT pour les utilisateurs normaux
const UserHeader: React.FC = () => {
  const { logout } = useAuth(); // Récupère la fonction logout

  // --- 3. Ajouter la logique responsive ---
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "white",
        borderBottom: "1px solid #E0E0E0"
      }}
    >
      {/* --- 4. Copier les styles du Toolbar de Header.tsx --- */}
      <Toolbar 
        sx={{ 
          justifyContent: "space-between", 
          px: { xs: 2, sm: 3, md: 4, lg: 6 }, // Style copié
          minHeight: { xs: 56, sm: 64 },      // Style copié (la clé de la hauteur)
        }}
      >
        {/* --- 5. Copier les styles du Titre de Header.tsx --- */}
        <Typography
          variant={isSmall ? "h5" : "h4"} // Style copié
          component="div"
          sx={{
            fontWeight: 700,
            color: "#3B5CFF",
            letterSpacing: "-0.5px", // Style copié
            mr: { xs: 1, sm: 2, md: 3, lg: 4 }, // Style copié
            flexShrink: 0,
          }}
        >
          Lares
        </Typography>
        
        {/* --- 6. Copier les styles du Bouton de Header.tsx --- */}
        <Button 
          variant="contained" 
          onClick={logout}
          sx={{
            backgroundColor: "#3B5CFF",
            textTransform: "none",
            fontWeight: 600,
            px: { xs: 2, sm: 3, md: 4 }, // Style copié
            py: 1, // Style copié
            borderRadius: 2, // Style copié
            boxShadow: "none",
            ml: { xs: 1, sm: 2, md: 3, lg: 4 }, // Style copié
            fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" }, // Style copié
            flexShrink: 0,
            "&:hover": { 
              backgroundColor: "#2A4AE5",
              boxShadow: "0px 4px 12px rgba(59, 92, 255, 0.3)", // Style copié
            },
          }}
        >
          {/* Style copié */}
          {isSmall ? "OUT" : "LOG OUT"}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default UserHeader;