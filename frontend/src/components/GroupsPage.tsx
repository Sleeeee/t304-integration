import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import UserGroupsList from "./GroupsUser/UserGroupsList"; 
import UserLocketsList from "./GroupsLocket/UserLocketsList";

interface GroupsPageProps {
  onNavigate: (page: string) => void;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ onNavigate }) => {
  return (
    // Conteneur principal (fond gris)
    <Box sx={{ p: 4, backgroundColor: "#F5F5F5", minHeight: "calc(100vh - 64px)" }}>
      
      {/* Titre de la page */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: "#333",
        }}
      >
        Groups Dashboard
      </Typography>

      {/* Conteneur Flexbox pour les deux colonnes */}
      <Box
        sx={{
          display: 'flex',
          gap: 4, 
          flexDirection: { xs: 'column', md: 'row' } // Colonne sur mobile, Ligne sur PC
        }}
      >
        {/* COLONNE DE GAUCHE (User Groups) */}
        <Paper
          elevation={0}
          sx={{
            p: 3, // Padding à l'intérieur de la carte
            borderRadius: 2,
            border: "1px solid #E0E0E0",
            // --- MODIFICATION ICI ---
            width: { xs: '100%', md: '50%' } 
          }}
        >
          {/* On insère le composant de liste ici */}
          <UserGroupsList onNavigate={onNavigate} />
        </Paper>

        {/* COLONNE DE DROITE (User Lockets) */}
        <Paper
          elevation={0}
          sx={{
            p: 3, // Padding
            borderRadius: 2,
            border: "1px solid #E0E0E0",
            // --- MODIFICATION ICI ---
            width: { xs: '100%', md: '50%' }
          }}
        >
          {/* On insère l'autre composant ici */}
          <UserLocketsList onNavigate={onNavigate} />
        </Paper>
      </Box>
    </Box>
  );
};

export default GroupsPage;