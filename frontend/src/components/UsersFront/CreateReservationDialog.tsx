import React, { useState, ChangeEvent, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import getCookie from "../../context/getCookie"; 

// --- MODIFICATION : Listes séparées pour les heures et les minutes ---
const hours: string[] = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes: string[] = ["00", "15", "30", "45"];
// --- L'ancienne liste timeSlots a été supprimée ---

// Interface pour les "Locks" (Salles)
interface Lock {
  id_lock: number;
  name: string;
}

// Interface pour les données du formulaire
export interface ReservationFormData {
  lockId: string;
  date: string;
  startTime: string;
  endTime: string;
}

type CreateReservationDialogProps = {
  open: boolean;
  onClose: () => void;
  onReservationCreated: (formData: ReservationFormData, selectedLock: Lock) => void; 
};

const CreateReservationDialog: React.FC<CreateReservationDialogProps> = ({ open, onClose, onReservationCreated }) => {
  // State pour le formulaire
  const [selectedLockId, setSelectedLockId] = useState(""); 
  const [date, setDate] = useState("");
  
  // --- MODIFICATION : États séparés pour les heures/minutes ---
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  
  // State pour charger la liste des salles
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loadingLocks, setLoadingLocks] = useState(false);
  const [error, setError] = useState("");

  const getHeaders = () => {
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = { "X-CSRFToken": csrfToken || "" };
    return headers;
  };

  // Récupérer les "locks" (salles) à l'ouverture de la pop-up
  useEffect(() => {
    if (!open) {
      setSelectedLockId("");
      setDate("");
      setError("");
      // --- MODIFICATION : Réinitialiser les nouveaux états ---
      setStartHour("");
      setStartMinute("");
      setEndHour("");
      setEndMinute("");
      return;
    }

    const fetchLocks = async () => {
      setLoadingLocks(true);
      setError("");
      try {
        const response = await fetch("http://localhost:8000/locks/", {
          method: "GET",
          credentials: "include",
          headers: getHeaders(),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch locks");
        }
        
        const data = await response.json();
        setLocks(data.locks || []); 

      } catch (err) {
        setError("Failed to load rooms. Please try again.");
      } finally {
        setLoadingLocks(false);
      }
    };

    fetchLocks();
  }, [open]); 

  // Gère la soumission (inchangé)
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // --- MODIFICATION : Valider les nouveaux champs ---
    if (!selectedLockId || !date || !startHour || !startMinute || !endHour || !endMinute) {
      setError("Please fill out all fields.");
      return;
    }
    
    const selectedLock = locks.find(lock => lock.id_lock === parseInt(selectedLockId, 10));
    
    if (!selectedLock) {
      setError("An error occurred. Please select the room again.");
      return;
    }

    // --- MODIFICATION : Reconstruire les temps ---
    const finalStartTime = `${startHour}:${startMinute}`;
    const finalEndTime = `${endHour}:${endMinute}`;

    const formData: ReservationFormData = {
      lockId: selectedLockId,
      date,
      startTime: finalStartTime,
      endTime: finalEndTime
    };
    
    onReservationCreated(formData, selectedLock);
    onClose(); 
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={true}
      maxWidth="sm" 
    >
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Request a new reservation
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Please select a room and the desired time slot. Your request will be sent for approval.
          </Typography>

          {/* ... (Le code pour le chargement et le Select "Room" est inchangé) ... */}
          {loadingLocks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
              <InputLabel id="lock-select-label">Room</InputLabel>
              <Select
                labelId="lock-select-label"
                value={selectedLockId}
                label="Room"
                onChange={(e) => setSelectedLockId(e.target.value)}
                required
              >
                {locks.map((lock) => {
                  if (!lock || lock.id_lock == null) {
                    return null; 
                  }
                  return (
                    <MenuItem 
                      key={lock.id_lock} 
                      value={lock.id_lock.toString()}
                    >
                      {lock.name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}

          {/* ... (Le code pour le "Date" picker est inchangé) ... */}
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          
          {/* --- MODIFICATION ICI: Heures et Minutes séparées --- */}
          <Typography sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
            Start Time*
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="start-hour-label">Hour</InputLabel>
              <Select
                labelId="start-hour-label"
                value={startHour}
                label="Hour"
                onChange={(e) => setStartHour(e.target.value)}
              >
                {hours.map((hour) => (
                  <MenuItem key={hour} value={hour}>
                    {hour}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="start-minute-label">Minute</InputLabel>
              <Select
                labelId="start-minute-label"
                value={startMinute}
                label="Minute"
                onChange={(e) => setStartMinute(e.target.value)}
              >
                {minutes.map((min) => (
                  <MenuItem key={min} value={min}>
                    {min}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Typography sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
            End Time*
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="end-hour-label">Hour</InputLabel>
              <Select
                labelId="end-hour-label"
                value={endHour}
                label="Hour"
                onChange={(e) => setEndHour(e.target.value)}
              >
                {hours.map((hour) => (
                  <MenuItem key={hour} value={hour}>
                    {hour}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="end-minute-label">Minute</InputLabel>
              <Select
                labelId="end-minute-label"
                value={endMinute}
                label="Minute"
                onChange={(e) => setEndMinute(e.target.value)}
              >
                {minutes.map((min) => (
                  <MenuItem key={min} value={min}>
                    {min}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {/* --- FIN DE LA MODIFICATION --- */}

          
          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: 'center', fontWeight: 500 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loadingLocks}
            sx={{ 
              backgroundColor: "#3B5CFF",
              '&:hover': { backgroundColor: "#2A4AE5" } 
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateReservationDialog;