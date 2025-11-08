import React from "react";
import { Box, Typography, Button } from "@mui/material";

interface UserLocketsListProps {
  onNavigate: (page: string) => void;
}

const UserLocketsList: React.FC<UserLocketsListProps> = ({ onNavigate }) => {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
        Groups Lockets
      </Typography>

      <Typography paragraph sx={{ color: '#666' }}>
        Ici s'affichera la gestion des "lockets" ou des accès spécifiques 
        liés aux utilisateurs.
      </Typography>

      {/* Tu peux ajouter un bouton ici aussi */}
      <Button
        variant="contained"
        onClick={() => onNavigate("register-locket")} // Exemple de navigation
        sx={{
          backgroundColor: "#3B5CFF",
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": { backgroundColor: "#2A4AE5" },
        }}
      >
        ADD LOCKET
      </Button>
    </Box>
  );
};

export default UserLocketsList;