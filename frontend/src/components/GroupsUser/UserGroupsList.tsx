import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
// Assure-toi que le chemin vers getCookie est correct
import getCookie from "../../context/getCookie"; 

// Interface pour un groupe
interface Group {
  id: number;
  name: string;
}

interface UserGroupsListProps {
  onNavigate: (page: string) => void;
}

const UserGroupsList: React.FC<UserGroupsListProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Récupérer les groupes depuis le backend
  useEffect(() => {
    const fetchGroups = async () => {
      const csrfToken = getCookie("csrftoken");
      const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

      try {
        const response = await fetch("http://localhost:8000/groups/", {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          setGroups(data.groups || []);
        } else {
          setError("Erreur lors de la récupération des groupes");
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Filtrer les groupes
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // Ce Box est le conteneur pour le contenu de la carte
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
        User Groups
      </Typography>

      {/* Barre de recherche et bouton d'ajout */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          placeholder="Search group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 300, backgroundColor: "white" }}
        />
        <Button
          variant="contained"
          onClick={() => onNavigate("register-group")}
          sx={{
            backgroundColor: "#3B5CFF",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            ml: "auto",
            "&:hover": { backgroundColor: "#2A4AE5" },
          }}
        >
          ADD GROUP
        </Button>
      </Box>

      {/* État de chargement */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* État d'erreur */}
      {error && (
        <Typography color="error" sx={{ textAlign: "center", py: 2 }}>
          {error}
        </Typography>
      )}

      {/* Tableau des groupes */}
      {!loading && !error && (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                  Group Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#666", textAlign: 'right' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: "center", py: 4 }}>
                    Aucun groupe trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group, index) => (
                  <TableRow
                    key={group.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "white" : "#F5F5F5",
                      "&:hover": { backgroundColor: "#F0F0F0" },
                    }}
                  >
                    <TableCell>{group.name}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        sx={{
                          color: "#3B5CFF",
                          textTransform: "none",
                          fontWeight: 500,
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default UserGroupsList;