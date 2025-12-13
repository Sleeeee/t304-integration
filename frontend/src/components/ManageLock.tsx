import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Typography,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText,
  SelectChangeEvent
} from '@mui/material';

// --- Self-contained Type Definition ---
interface Lock {
  id_lock: number;
  name: string;
  // Updated: Explicitly allow 'null' to match the parent type definition
  description?: string | null;
  status: string;
  is_reservable: boolean;
  // Optional to ensure compatibility if the parent type is missing this field
  auth_methods?: string[];
}

// --- Self-contained Cookie Helper ---
function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Define available authentication methods
const AUTH_OPTIONS = [
  { value: 'badge', label: 'Badge' },
  { value: 'keypad', label: 'Keypad' },
];

interface ManageLockProps {
  isDialogOpen: boolean;
  onClose: (shouldUpdate: boolean) => void;
  selectedLock: Lock | null;
}

const ManageLock: React.FC<ManageLockProps> = ({ isDialogOpen, onClose, selectedLock }) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isReservable, setIsReservable] = useState<boolean>(false);

  // --- New State for Auth Methods ---
  const [authMethods, setAuthMethods] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const isEditMode = selectedLock !== null;

  useEffect(() => {
    if (isDialogOpen) {
      if (isEditMode && selectedLock) {
        setName(selectedLock.name);
        // Handles both null and undefined safely
        setDescription(selectedLock.description || '');
        setIsReservable(selectedLock.is_reservable || false);
        // Populate auth methods, defaulting to empty array if undefined
        setAuthMethods(selectedLock.auth_methods || []);
      } else {
        // Reset for "Add" mode
        setName('');
        setDescription('');
        setIsReservable(false);
        setAuthMethods([]);
      }
      setError('');
    }
  }, [selectedLock, isEditMode, isDialogOpen]);

  const handleClose = (shouldUpdate: boolean = false) => {
    onClose(shouldUpdate);
  };

  // Handle changes for the Multi-Select
  const handleAuthMethodsChange = (event: SelectChangeEvent<typeof authMethods>) => {
    const {
      target: { value },
    } = event;
    // On autofill we get a stringified value.
    setAuthMethods(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    const csrfToken = getCookie("csrftoken");
    const method = isEditMode ? 'PUT' : 'POST';
    const url = `${process.env.REACT_APP_BACKEND_URL}/locks/`;

    // Construct payload
    let bodyData: any = {
      name,
      description,
      is_reservable: isReservable,
      auth_methods: authMethods // Add the array to the payload
    };

    if (isEditMode && selectedLock) {
      bodyData.id_lock = selectedLock.id_lock;
    }

    try {
      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        handleClose(true);
      } else {
        const data = await response.json();
        // Handle specific field errors or general errors
        const errorMessage = data.auth_methods
          ? `Auth Methods: ${data.auth_methods.join(', ')}`
          : (data.error || 'Error saving lock');
        setError(errorMessage);
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !selectedLock) return;
    if (!window.confirm(`Are you sure you want to delete the lock "${selectedLock.name}"?`)) {
      return;
    }
    setIsLoading(true);
    setError('');
    const csrfToken = getCookie("csrftoken");
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({ id_lock: selectedLock.id_lock }),
      });
      if (response.ok) {
        handleClose(true);
      } else {
        const data = await response.json();
        setError(data.error || "Error deleting lock.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onClose={() => handleClose(false)}
      fullWidth
      maxWidth="xs"
      // Accessibility
      aria-labelledby="manage-lock-title"
    >
      <DialogTitle id="manage-lock-title">
        {isEditMode ? 'Manage Lock' : 'Add Lock'}
      </DialogTitle>

      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Lock Name"
            name="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            disabled={isLoading}
            inputProps={{ "aria-required": "true" }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Description (optional)"
            name="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            disabled={isLoading}
          />

          {/* --- Auth Methods Multi-Select --- */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="auth-methods-label">Auth Methods</InputLabel>
            <Select
              labelId="auth-methods-label"
              id="auth-methods"
              multiple
              value={authMethods}
              onChange={handleAuthMethodsChange}
              input={<OutlinedInput label="Auth Methods" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              disabled={isLoading}
            >
              {AUTH_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={authMethods.indexOf(option.value) > -1} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={isReservable}
                onChange={(e) => setIsReservable(e.target.checked)}
                color="primary"
                disabled={isLoading}
                inputProps={{ 'aria-label': 'Enable reservation for this lock' }}
              />
            }
            label="Reservable (Can be booked)"
            sx={{ mt: 1 }}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }} role="alert">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>

        {isEditMode ? (
          <Button
            onClick={handleDelete}
            color="error"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        ) : <Box />}

        <Box>
          <Button onClick={() => handleClose(false)} sx={{ mr: 1 }}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isLoading}
            sx={{ backgroundColor: "#2A4AE5", '&:hover': { backgroundColor: "#1A3AC0" } }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </Box>

      </DialogActions>
    </Dialog>
  );
};

export default ManageLock;
