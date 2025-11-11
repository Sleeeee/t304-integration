import React, { useState, useEffect } from "react";
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

import CreateReservationDialog, { ReservationFormData } from "./CreateReservationDialog";

// --- MODIFICATION ICI ---
// L'interface "Lock" doit correspondre à celle de l'API
interface Lock {
  id_lock: number;
  name: string;
}

// ... (Interfaces CurrentUser et Reservation) ...
interface CurrentUser {
  id: number;
  username: string;
  is_staff: boolean;
}
interface Reservation {
  id: number;
  room_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface UserDashboardPageProps {
  user: CurrentUser;
  onNavigate: (page: string) => void;
}

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ user, onNavigate }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false); 

  // ... (useEffect et getStatusColor sont inchangés) ...
    useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData: Reservation[] = [
          { id: 1, room_name: "Meeting Room A", date: "2023-11-12", start_time: "14:00", end_time: "15:00", status: "Pending" },
          { id: 2, room_name: "Brainstorming Room", date: "2023-11-14", start_time: "10:00", end_time: "11:30", status: "Approved" },
        ];
        setReservations(mockData);
        setError("");
      } catch (err) {
        setError("Failed to load reservations.");
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  const getStatusColor = (status: Reservation['status']) => {
    if (status === 'Approved') return 'success.main';
    if (status === 'Pending') return 'warning.main';
    if (status === 'Rejected') return 'error.main';
    return 'text.secondary';
  };


  return (
    <Box sx={{ p: 4 }}>
      
      {/* ... (Titre "Hello" et bouton "Request" inchangés) ... */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 1,
          color: "#333",
        }}
      >
        Hello, {user.username}!
      </Typography>
      <Typography variant="h6" sx={{ mb: 4, color: "#555", fontWeight: 400 }}>
        Welcome to your reservation space.
      </Typography>
      <Button
        variant="contained"
        onClick={() => setIsCreateOpen(true)} // <-- Connecté
        startIcon={<AddIcon />}
        sx={{
          backgroundColor: "#3B5CFF",
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "none",
          mb: 4,
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
      
      {/* ... (Affichage de la liste de réservations inchangé) ... */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid #E0E0E0",
          width: '100%',
          maxWidth: '800px', 
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
          Your current requests
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center' }}>
            {error}
          </Typography>
        ) : (
          <List disablePadding>
            {reservations.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#666', p: 2 }}>
                You have no pending reservation requests.
              </Typography>
            ) : (
              reservations.map((res, index) => (
                <React.Fragment key={res.id}>
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 500, color: '#111' }}>
                          {res.room_name}
                        </Typography>
                      }
                      secondary={
                        `On ${res.date} from ${res.start_time} to ${res.end_time}`
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
                      {res.status}
                    </Typography>
                  </ListItem>
                  {index < reservations.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Paper>

      {/* Le Dialog (le onReservationCreated est mis à jour pour utiliser la bonne interface Lock) */}
      <CreateReservationDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onReservationCreated={(formData: ReservationFormData, selectedLock: Lock) => {
          const newReservation: Reservation = {
            id: Math.random(), 
            room_name: selectedLock.name, 
            date: formData.date,
            start_time: formData.startTime,
            end_time: formData.endTime,
            status: 'Pending',
          };
          setReservations([newReservation, ...reservations]);
        }}
      />
    </Box>
  );
};

export default UserDashboardPage;