import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

import CreateReservationDialog from "./CreateReservationDialog";
import getCookie from "../../context/getCookie"; 

// --- Interfaces (mises à jour pour correspondre à l'API) ---
interface Lock {
  id_lock: number;
  name: string;
}

interface CurrentUser {
  id: number;
  username: string;
  is_staff: boolean;
}

interface Reservation {
  id: number;
  lock: Lock; 
  date: string;
  start_time: string; 
  end_time: string;   
  status: 'pending' | 'approved' | 'rejected';
}

interface UserDashboardPageProps {
  user: CurrentUser;
  onNavigate: (page: string) => void;
}

// Helpers (mis en anglais pour la cohérence)
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formatTime = (time: string) => time.slice(0, 5); // "14:00:00" -> "14:00"

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ user, onNavigate }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false); 

  const fetchReservations = async () => {
    setLoading(true);
    setError(""); 
    try {
      const csrfToken = getCookie("csrftoken");
      const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

      const response = await fetch("http://localhost:8000/reservations/", {
        method: "GET",
        credentials: "include",
        headers: headers,
      });

      if (!response.ok) {
        throw new Error("Failed to load reservations.");
      }
      
      const data: Reservation[] = await response.json();
      setReservations(data); 

    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReservations();
  }, []);

  const getStatusColor = (status: Reservation['status']) => {
    if (status === 'approved') return 'success.main';
    if (status === 'pending') return 'warning.main';
    if (status === 'rejected') return 'error.main';
    return 'text.secondary';
  };

  // --- NOUVEAU: On utilise useMemo pour séparer les listes ---
  // (C'est plus efficace que de filtrer dans le JSX)
  
  // 1. Liste des demandes "En attente"
  const pendingReservations = useMemo(
    () => reservations.filter(r => r.status === 'pending'),
    [reservations]
  );

  // 2. Liste de l'historique (Approuvé + Rejeté)
  const processedReservations = useMemo(
    () => reservations.filter(r => r.status === 'approved' || r.status === 'rejected')
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), // Trie du plus récent au plus ancien
    [reservations]
  );

  // Composant interne pour la liste (pour éviter la duplication)
  const ReservationItem: React.FC<{res: Reservation}> = ({ res }) => (
    <React.Fragment>
      <ListItem disablePadding sx={{ py: 1.5 }}>
        <ListItemText
          primary={
            <Typography sx={{ fontWeight: 500, color: '#111' }}>
              {res.lock.name}
            </Typography>
          }
          secondary={
            `On ${res.date} from ${formatTime(res.start_time)} to ${formatTime(res.end_time)}`
          }
        />
        <Typography 
          sx={{ 
            fontWeight: 600, 
            color: getStatusColor(res.status),
            flexShrink: 0,
            ml: 2,
          }}
        >
          {capitalize(res.status)}
        </Typography>
      </ListItem>
      <Divider component="li" />
    </React.Fragment>
  );


  return (
    <Box sx={{ p: 4 }}>
      
      {/* --- NOUVEL EN-TÊTE DE PAGE --- */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', // Pour les petits écrans
          gap: 2, // Espace entre le texte et le bouton
          mb: 4 
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#333" }}>
            Hello, {user.username}!
          </Typography>
          <Typography variant="h6" sx={{ color: "#555", fontWeight: 400 }}>
            Welcome to your reservation space.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setIsCreateOpen(true)}
          startIcon={<AddIcon />}
          sx={{
            backgroundColor: "#3B5CFF",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            py: 1.5,
            px: 3,
            fontSize: '1rem',
            "&:hover": {
              backgroundColor: "#2A4AE5",
            },
          }}
        >
          Request a reservation
        </Button>
      </Box>
      
      {/* --- NOUVEAU LAYOUT À DEUX COLONNES --- */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: 'center' }}>
          {error}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            flexDirection: { xs: 'column', md: 'row' } // Colonne sur mobile, ligne sur PC
          }}
        >
          {/* --- COLONNE 1: DEMANDES EN ATTENTE --- */}
          <Paper
            elevation={0}
            sx={{
              p: 3, borderRadius: 2, border: "1px solid #E0E0E0",
              width: { xs: '100%', md: '50%' } // Prend 50% de la largeur
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
              Your Pending Requests
            </Typography>
            <List disablePadding>
              {pendingReservations.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: '#666', p: 2 }}>
                  You have no pending requests.
                </Typography>
              ) : (
                pendingReservations.map((res) => (
                  <ReservationItem key={res.id} res={res} />
                ))
              )}
            </List>
          </Paper>

          {/* --- COLONNE 2: HISTORIQUE --- */}
          <Paper
            elevation={0}
            sx={{
              p: 3, borderRadius: 2, border: "1px solid #E0E0E0",
              width: { xs: '100%', md: '50%' } // Prend 50% de la largeur
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
              Your Reservation History
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}> {/* Ajoute un scroll si l'historique est long */}
              <List disablePadding>
                {processedReservations.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', color: '#666', p: 2 }}>
                    No approved or rejected reservations found.
                  </Typography>
                ) : (
                  processedReservations.map((res) => (
                    <ReservationItem key={res.id} res={res} />
                  ))
                )}
              </List>
            </Box>
          </Paper>
        </Box>
      )}

      {/* La pop-up (inchangée) */}
      <CreateReservationDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onReservationCreated={() => {
          // On rafraîchit la liste complète
          fetchReservations(); 
        }}
      />
    </Box>
  );
};

export default UserDashboardPage;