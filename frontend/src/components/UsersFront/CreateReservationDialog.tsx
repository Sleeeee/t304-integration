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

const hours: string[] = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes: string[] = ["00", "15", "30", "45"];

// Couleur contrastée
const ACCESSIBLE_BLUE = "#2A4AE5";

interface Lock {
  id_lock: number;
  name: string;
}

interface ReservationFormData {
  lockId: string;
  date: string;
  startTime: string;
  endTime: string;
}

type CreateReservationDialogProps = {
  open: boolean;
  onClose: () => void;
  onReservationCreated: () => void; 
};

const CreateReservationDialog: React.FC<CreateReservationDialogProps> = ({ open, onClose, onReservationCreated }) => {
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  
  const [selectedLockId, setSelectedLockId] = useState(""); 
  const [locks, setLocks] = useState<Lock[]>([]); 
  const [loadingLocks, setLoadingLocks] = useState(false); 
  const [hasSearched, setHasSearched] = useState(false); 

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedLockId || !hasSearched) {
      setError("Please find and select an available room.");
      return;
    }
    
    setLoadingSubmit(true);
    setError("");

    const finalStartTime = `${startHour}:${startMinute}`;
    const finalEndTime = `${endHour}:${endMinute}`;

    const body = JSON.stringify({
      lock: parseInt(selectedLockId, 10),
      date: date,
      start_time: finalStartTime,
      end_time: finalEndTime,
      notes: ""
    });

    try {
      const response = await fetch("http://localhost:8000/reservations/", {
        method: "POST",
        credentials: "include",
        headers: getHeaders(true),
        body: body,
      });

      if (!response.ok) {
        if (response.status === 409) {
          const errData = await response.json();
          throw new Error(errData.error || "This time slot is already booked.");
        }
        throw new Error("Failed to create reservation request.");
      }

      onReservationCreated();
      onClose(); 

    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth={true} 
      maxWidth="sm"
      // ACCESSIBILITÉ: Lie le titre à la modale
      aria-labelledby="reservation-dialog-title"
    >
      <DialogTitle 
        id="reservation-dialog-title" // Cible du aria-labelledby
        sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        Request a new reservation
        <IconButton 
          onClick={onClose} 
          // ACCESSIBILITÉ: Label explicite
          aria-label="Close reservation window"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Step 1: Choose your time slot.
          </Typography>
          
          <TextField
            id="reservation-date" // ID unique pour le label
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ "aria-required": "true" }}
          />
          
          <Typography sx={{ fontWeight: 500, color: 'text.secondary', mb: 1 }}>
            Start Time*
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="start-hour-label">Hour</InputLabel>
              <Select 
                labelId="start-hour-label" // Liaison label-select
                id="start-hour"
                value={startHour} 
                label="Hour" 
                onChange={(e) => setStartHour(e.target.value)}
              >
                {hours.map((hour) => (<MenuItem key={hour} value={hour}>{hour}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="start-minute-label">Minute</InputLabel>
              <Select 
                labelId="start-minute-label" 
                id="start-minute"
                value={startMinute} 
                label="Minute" 
                onChange={(e) => setStartMinute(e.target.value)}
              >
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
              <Select 
                labelId="end-hour-label" 
                id="end-hour"
                value={endHour} 
                label="Hour" 
                onChange={(e) => setEndHour(e.target.value)}
              >
                {hours.map((hour) => (<MenuItem key={hour} value={hour}>{hour}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="end-minute-label">Minute</InputLabel>
              <Select 
                labelId="end-minute-label" 
                id="end-minute"
                value={endMinute} 
                label="Minute" 
                onChange={(e) => setEndMinute(e.target.value)}
              >
                {minutes.map((min) => (<MenuItem key={min} value={min}>{min}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          
          <Button
            onClick={handleFindAvailableLocks}
            variant="contained"
            fullWidth
            disabled={loadingLocks}
            // ACCESSIBILITÉ: Indique le chargement
            aria-busy={loadingLocks}
            sx={{ 
              my: 1, 
              backgroundColor: "#555", 
              '&:hover': { backgroundColor: "#333" } 
            }}
          >
            {loadingLocks ? <CircularProgress size={24} color="inherit" aria-label="Searching for rooms" /> : "Find Available Rooms"}
          </Button>

          <Divider sx={{ my: 3 }} />

          {/* Zone live pour annoncer les changements dynamiquement si nécessaire */}
          <Box sx={{ minHeight: '100px' }} role="region" aria-label="Room selection area">
            <Typography sx={{ mb: 2, color: 'text.secondary' }}>
              Step 2: Select an available room.
            </Typography>
            
            {loadingLocks ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress aria-label="Loading rooms" />
              </Box>
            ) : !hasSearched ? (
               <Typography sx={{ textAlign: 'center', color: '#999', p: 2 }}>
                  Please find rooms to see the list.
               </Typography>
            ) : locks.length === 0 ? (
               <Typography sx={{ textAlign: 'center', color: 'orange', p: 2, fontWeight: 500 }} role="status">
                  No rooms are available for this time slot.
               </Typography>
            ) : (
              <FormControl fullWidth required>
                <InputLabel id="lock-select-label">Available Rooms</InputLabel>
                <Select
                  labelId="lock-select-label"
                  id="lock-select"
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
            // ACCESSIBILITÉ: role="alert" pour lecture immédiate
            <Typography color="error" sx={{ mt: 2, textAlign: 'center', fontWeight: 500 }} role="alert">
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
            disabled={!selectedLockId || loadingLocks || loadingSubmit}
            aria-busy={loadingSubmit}
            sx={{ 
              backgroundColor: ACCESSIBLE_BLUE,
              '&:hover': { backgroundColor: "#1A3AC0" } 
            }}
          >
            {loadingSubmit ? <CircularProgress size={24} color="inherit" aria-label="Submitting request" /> : "Submit Request"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateReservationDialog;