import React, { useState, useEffect, useCallback } from "react";
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
  Chip,
  CircularProgress,
} from "@mui/material";
import getCookie from "../context/getCookie";
import ManageLock from "./ManageLock"; // On importe le modal

// Interface pour correspondre à models.py
interface Lock {
  id_lock: number;
  name: string;
  description: string | null;
  status: 'connected' | 'disconnected' | 'error' | string;
  last_connexion: string | null;
}

// Interface pour les props du composant
interface LockPageProps {
  onNavigate: (page: string) => void;
}

// Style partagé pour les boutons d'action
const actionButtonStyle = {
  color: "#3B5CFF",
  textTransform: "none",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#F5F7FF",
  },
};

// Déclaration du composant avec React.FC (Fonctional Component)
const LockPage: React.FC<LockPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedLock, setSelectedLock] = useState<Lock | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // --- Fonctions Helper pour le statut ---
  const getLockStatusText = (status: string): string => {
    switch (status) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
      case "error":
        return "Error";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): "success" | "default" | "error" => {
    switch (status) {
      case "connected":
        return "success";
      case "error":
        return "error";
      case "disconnected":
      default:
        return "default";
    }
  };
  
  // --- Formatage de la date ---
  const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString('en-US', { // Format anglais
        dateStyle: 'short',
        timeStyle: 'short'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // --- Récupération des données ---
  const fetchLocks = useCallback(async () => {
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

    try {
      const response = await fetch("http://localhost:8000/locks/", {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setLocks(data.locks || []); 
        setError("");
      } else {
        setError("Error fetching locks");
      }
    } catch (err) {
      setError("Server connection error");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocks();
  }, [fetchLocks]);

  // Filtrer les serrures
  const filteredLocks: Lock[] = locks.filter((lock) => {
    return (
      lock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lock.description && 
        lock.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Ouvre le modal en mode "Édition"
  const handleDialogOpen = (lock: Lock) => {
    setSelectedLock(lock);
    setIsDialogOpen(true);
  };

  // Ouvre le modal en mode "Création"
  const handleAddClick = () => {
    setSelectedLock(null); // null indique la création
    setIsDialogOpen(true);
  };
  
  // Callback pour fermer le modal et rafraîchir
  const handleModalClose = (shouldUpdate: boolean) => {
    setIsDialogOpen(false);
    setSelectedLock(null);
    if (shouldUpdate) {
      fetchLocks(); // Rafraîchit la liste
    }
  }
  
  // Gère le clic sur "View" (historique)
  const handleViewLogs = (lockId: number) => {
    console.log("View history for lock:", lockId);
    // onNavigate(`locks/${lockId}/logs`);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: "#F5F5F5", minHeight: "calc(100vh - 64px)" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: "#333" }}>
        Locks
      </Typography>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        
        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
          <TextField
            placeholder="Name or description"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              flexGrow: 1,
              maxWidth: 300, 
              backgroundColor: "white",
            }}
          />

          <Button
            variant="contained"
            onClick={handleAddClick}
            sx={{
              backgroundColor: "#3B5CFF", textTransform: "none", fontWeight: 600,
              boxShadow: "none", ml: "auto", "&:hover": { backgroundColor: "#2A4AE5" },
            }}
          >
            ADD LOCK
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ textAlign: "center", py: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>Last Connection</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>History</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                      No locks found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocks.map((lock, index) => {
                    const statusText = getLockStatusText(lock.status);
                    return (
                      <TableRow
                        key={lock.id_lock}
                        sx={{
                          // ----- ICI EST LA CORRECTION -----
                          backgroundColor: index % 2 === 0 ? "white" : "#F5F5F5",
                          "&:hover": { backgroundColor: "#F0F0F0" },
                        }}
                      >
                        <TableCell>{lock.name}</TableCell>
                        <TableCell>{lock.description || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusText}
                            color={getStatusColor(lock.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          {formatDateTime(lock.last_connexion)}
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => handleViewLogs(lock.id_lock)}
                            sx={actionButtonStyle}
                          >
                            View
                          </Button>
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => handleDialogOpen(lock)}
                            sx={actionButtonStyle}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <ManageLock
        isDialogOpen={isDialogOpen}
        onClose={handleModalClose}
        selectedLock={selectedLock}
      />
    </Box>
  );
};

export default LockPage;