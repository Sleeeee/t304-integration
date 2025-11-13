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
  // Grid, // On n'utilise plus Grid
  IconButton,
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import getCookie from "../context/getCookie"; // Ajuste le chemin
import CustomSnackbar from "./CustomSnackbar"; // Ajuste le chemin

// ... (Les interfaces User, Lock, Reservation, etc. sont inchangées) ...
interface User {
  id: number;
  username: string;
}
interface Lock {
  id_lock: number;
  name: string;
}
interface Reservation {
  id: number;
  user: User;
  lock: Lock;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected';
}
interface SnackbarInfo {
  text: string;
  isError: boolean;
}

interface ReservationAdminPageProps {
  onNavigate: (page: string) => void;
}

// Helper pour formater l'heure
const formatTime = (time: string) => time.slice(0, 5);
// Helper pour capitaliser
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ReservationAdminPage: React.FC<ReservationAdminPageProps> = ({ onNavigate }) => {
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarInfo, setSnackbarInfo] = useState<SnackbarInfo>({ text: "", isError: false });
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // ... (Les fonctions fetchAllReservations, handleUpdateStatus, useMemo, etc. sont inchangées) ...
  const fetchAllReservations = async () => {
    setLoading(true);
    try {
      const csrfToken = getCookie("csrftoken");
      const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};
      const response = await fetch("http://localhost:8000/reservations/all/", {
        method: "GET",
        credentials: "include",
        headers: headers,
      });
      if (!response.ok) {
        throw new Error("Failed to load reservations.");
      }
      const data: Reservation[] = await response.json();
      setAllReservations(data); 
    } catch (err: any) {
      setSnackbarInfo({ text: err.message || "An unknown error occurred.", isError: true });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllReservations();
  }, []);

  const handleUpdateStatus = async (reservationId: number, newStatus: 'approved' | 'rejected') => {
    setSubmittingId(reservationId); 
    try {
      const csrfToken = getCookie("csrftoken");
      const headers: HeadersInit = {
        "X-CSRFToken": csrfToken || "",
        "Content-Type": "application/json"
      };
      const response = await fetch(`http://localhost:8000/reservations/${reservationId}/status/`, {
        method: "PATCH",
        credentials: "include",
        headers: headers,
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update status.");
      }
      setAllReservations(currentReservations =>
        currentReservations.map(r => 
          (r.id === reservationId ? data : r) 
        )
      );
      setSnackbarInfo({ text: `Reservation ${newStatus}`, isError: false });
    } catch (err: any) {
      setSnackbarInfo({ text: err.message, isError: true });
    } finally {
      setSubmittingId(null); 
    }
  };

  const pendingReservations = useMemo(
    () => allReservations.filter(r => r.status === 'pending'),
    [allReservations]
  );
  const processedReservations = useMemo(
    () => allReservations.filter(r => r.status !== 'pending').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allReservations]
  );

  const getStatusColor = (status: Reservation['status']) => {
    if (status === 'approved') return 'success.main';
    if (status === 'rejected') return 'error.main';
    return 'text.secondary';
  };
  
  const ReservationItem: React.FC<{res: Reservation}> = ({ res }) => (
    <ListItem divider>
      <ListItemText
        primary={
          <Typography sx={{ fontWeight: 500 }}>
            {res.user.username} - {res.lock.name}
          </Typography>
        }
        secondary={
          `On ${res.date} from ${formatTime(res.start_time)} to ${formatTime(res.end_time)}`
        }
      />
      {res.status !== 'pending' && (
        <Typography 
          sx={{ fontWeight: 600, color: getStatusColor(res.status), ml: 2 }}
        >
          {capitalize(res.status)}
        </Typography>
      )}
    </ListItem>
  );

  return (
    <Box sx={{ p: 4, backgroundColor: "#F5F5F5", minHeight: "calc(100vh - 64px)" }}>
      <CustomSnackbar
        text={snackbarInfo.text}
        isError={snackbarInfo.isError}
        onClose={() => setSnackbarInfo({ text: "", isError: false })}
      />
      
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: "#333" }}>
        Reservations Management
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : (
        // --- MODIFICATION ICI: On remplace <Grid container> par <Box> ---
        <Box
          sx={{
            display: 'flex',
            gap: 4, // L'espacement entre les boîtes
            flexDirection: { xs: 'column', md: 'row' } // Colonne sur mobile, ligne sur PC
          }}
        >
          {/* --- COLONNE DE DROITE (Pending) --- */}
          {/* On remplace <Grid item> par <Box> avec une largeur de 50% */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
                Pending Requests
              </Typography>
              <List disablePadding>
                {pendingReservations.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', color: '#666', p: 2 }}>
                    No pending requests.
                  </Typography>
                ) : (
                  pendingReservations.map((res) => (
                    <ListItem key={res.id} divider sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 500 }}>
                            {res.user.username} - {res.lock.name}
                          </Typography>
                        }
                        secondary={
                          `On ${res.date} from ${formatTime(res.start_time)} to ${formatTime(res.end_time)}`
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, width: '100%' }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          disabled={submittingId === res.id}
                          onClick={() => handleUpdateStatus(res.id, 'approved')}
                          sx={{ textTransform: 'none', flexGrow: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          disabled={submittingId === res.id}
                          onClick={() => handleUpdateStatus(res.id, 'rejected')}
                          sx={{ textTransform: 'none', flexGrow: 1 }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </Box>
          
          {/* --- COLONNE DE GAUCHE (History) --- */}
          {/* On remplace <Grid item> par <Box> avec une largeur de 50% */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
                Processed History
              </Typography>
              <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                <List disablePadding>
                  {processedReservations.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', color: '#666', p: 2 }}>
                      No processed reservations.
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
        </Box>
        // --- FIN DE LA MODIFICATION ---
      )}
    </Box>
  );
};

export default ReservationAdminPage;