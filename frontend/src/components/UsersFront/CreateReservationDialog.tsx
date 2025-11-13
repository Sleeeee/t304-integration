import React, { useState, useEffect } from "react";
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
  Divider,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import getCookie from "../../context/getCookie"; 

// ... (Listes 'hours' et 'minutes' inchangées) ...
const hours: string[] = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes: string[] = ["00", "15", "30", "45"];

// Interface pour les "Locks" (Salles)
interface Lock {
  id_lock: number;
  name: string;
}

// L'interface pour le formulaire (n'a pas besoin d'être exportée)
interface ReservationFormData {
  lockId: string;
  date: string;
  startTime: string;
  endTime: string;
}

type CreateReservationDialogProps = {
  open: boolean;
  onClose: () => void;
  // onReservationCreated n'a plus besoin d'envoyer de données
  onReservationCreated: () => void; 
};

const CreateReservationDialog: React.FC<CreateReservationDialogProps> = ({ open, onClose, onReservationCreated }) => {
  // --- Étape 1: Heure ---
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  
  // --- Étape 2: Salle ---
  const [selectedLockId, setSelectedLockId] = useState(""); 
  const [locks, setLocks] = useState<Lock[]>([]); 
  const [loadingLocks, setLoadingLocks] = useState(false); 
  const [hasSearched, setHasSearched] = useState(false); 

  // --- État global ---
  // 1. RÉ-AJOUTER L'ÉTAT DE SOUMISSION
  const [loadingSubmit, setLoadingSubmit] = useState(false); 
  const [error, setError] = useState("");

  const getHeaders = (withContentType = false) => {
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = { "X-CSRFToken": csrfToken || "" };
    if (withContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  // Réinitialiser le formulaire à la fermeture (inchangé)
  useEffect(() => {
    if (!open) {
      setDate("");
      setStartHour("");
      setStartMinute("");
      setEndHour("");
      setEndMinute("");
      setSelectedLockId("");
      setLocks([]);
      setHasSearched(false);
      setError("");
    }
  }, [open]);

  // Fonction "Find Rooms" (inchangée)
  const handleFindAvailableLocks = async () => {
    if (!date || !startHour || !startMinute || !endHour || !endMinute) {
      setError("Please select a date and time slot first.");
      return;
    }
    
    setLoadingLocks(true);
    setError("");
    setHasSearched(false);
    setSelectedLockId(""); 

    const finalStartTime = `${startHour}:${startMinute}`;
    const finalEndTime = `${endHour}:${endMinute}`;

    try {
      const response = await fetch(
        `http://localhost:8000/reservations/available/?date=${date}&start_time=${finalStartTime}&end_time=${finalEndTime}`, 
        {
          method: "GET",
          credentials: "include",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check availability.");
      }
      
      const data = await response.json();
      setLocks(data.locks || []); 
      setHasSearched(true); 

    } catch (err) {
      setError("Failed to load rooms. Please try again.");
    } finally {
      setLoadingLocks(false);
    }
  };

  // --- 2. METTRE À JOUR LA FONCTION DE SOUMISSION ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedLockId || !hasSearched) {
      setError("Please find and select an available room.");
      return;
    }
    
    // On ne vérifie plus 'selectedLock' car on n'en a pas besoin ici
    
    setLoadingSubmit(true); // Active le loader
    setError("");

    const finalStartTime = `${startHour}:${startMinute}`;
    const finalEndTime = `${endHour}:${endMinute}`;

    // Prépare le body pour le CreateReservationSerializer du backend
    const body = JSON.stringify({
      lock: parseInt(selectedLockId, 10), // Le backend attend un nombre
      date: date,
      start_time: finalStartTime,
      end_time: finalEndTime,
      notes: "" // (Tu peux ajouter un champ de texte pour ça si tu veux)
    });

    try {
      const response = await fetch("http://localhost:8000/reservations/", {
        method: "POST",
        credentials: "include",
        headers: getHeaders(true), // true = avec Content-Type
        body: body,
      });

      if (!response.ok) {
        if (response.status === 409) { // Gère les conflits
          const errData = await response.json();
          throw new Error(errData.error || "This time slot is already booked.");
        }
        throw new Error("Failed to create reservation request.");
      }

      // Si c'est OK (201 Created)
      onReservationCreated(); // Dit au parent de rafraîchir sa liste
      onClose(); // Ferme la pop-up

    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoadingSubmit(false); // Arrête le loader
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Request a new reservation
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* ... (Toute la partie "Step 1" et "Step 2" est inchangée) ... */}
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Step 1: Choose your time slot.
          </Typography>
          
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
          
          <Typography sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
            Start Time*
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="start-hour-label">Hour</InputLabel>
              <Select labelId="start-hour-label" value={startHour} label="Hour" onChange={(e) => setStartHour(e.target.value)}>
                {hours.map((hour) => (<MenuItem key={hour} value={hour}>{hour}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="start-minute-label">Minute</InputLabel>
              <Select labelId="start-minute-label" value={startMinute} label="Minute" onChange={(e) => setStartMinute(e.target.value)}>
                {minutes.map((min) => (<MenuItem key={min} value={min}>{min}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          
          <Typography sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
            End Time*
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="end-hour-label">Hour</InputLabel>
              <Select labelId="end-hour-label" value={endHour} label="Hour" onChange={(e) => setEndHour(e.target.value)}>
                {hours.map((hour) => (<MenuItem key={hour} value={hour}>{hour}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="end-minute-label">Minute</InputLabel>
              <Select labelId="end-minute-label" value={endMinute} label="Minute" onChange={(e) => setEndMinute(e.target.value)}>
                {minutes.map((min) => (<MenuItem key={min} value={min}>{min}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          
          <Button
            onClick={handleFindAvailableLocks}
            variant="contained"
            fullWidth
            disabled={loadingLocks}
            sx={{ my: 1, backgroundColor: "#555", '&:hover': { backgroundColor: "#333" } }}
          >
            {loadingLocks ? <CircularProgress size={24} color="inherit" /> : "Find Available Rooms"}
          </Button>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ minHeight: '100px' }}>
            <Typography sx={{ mb: 2, color: 'text.secondary' }}>
              Step 2: Select an available room.
            </Typography>
            
            {loadingLocks ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : !hasSearched ? (
               <Typography sx={{ textAlign: 'center', color: '#999', p: 2 }}>
                  Please find rooms to see the list.
               </Typography>
            ) : locks.length === 0 ? (
               <Typography sx={{ textAlign: 'center', color: 'orange', p: 2, fontWeight: 500 }}>
                  No rooms are available for this time slot.
               </Typography>
            ) : (
              <FormControl fullWidth required>
                <InputLabel id="lock-select-label">Available Rooms</InputLabel>
                <Select
                  labelId="lock-select-label"
                  value={selectedLockId}
                  label="Available Rooms"
                  onChange={(e) => setSelectedLockId(e.target.value)}
                >
                  {locks.map((lock) => (
                    <MenuItem 
                      key={lock.id_lock} 
                      value={lock.id_lock.toString()}
                    >
                      {lock.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
          
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
            // 3. METTRE À JOUR LE DISABLED
            disabled={!selectedLockId || loadingLocks || loadingSubmit}
            sx={{ 
              backgroundColor: "#3B5CFF",
              '&:hover': { backgroundColor: "#2A4AE5" } 
            }}
          >
            {/* 4. AFFICHER LE BON LOADER */}
            {loadingSubmit ? <CircularProgress size={24} color="inherit" /> : "Submit Request"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateReservationDialog;