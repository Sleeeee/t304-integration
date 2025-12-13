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
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import getCookie from '../../context/getCookie';
import { LockGroup } from '../../types';

// Couleur accessible
const ACCESSIBLE_BLUE = "#2A4AE5";

interface AddGroupModalProps {
  open: boolean;
  onClose: () => void;
  onGroupAdded: (newGroup: LockGroup) => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ open, onClose, onGroupAdded }) => {
  const [groupName, setGroupName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setGroupName('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  // Logique de création
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }

    setLoading(true);
    setError('');
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/groups/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({ name: groupName }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        onGroupAdded(newGroup.lock_group);
      } else {
        const data = await response.json();
        setError(data.error || "Error creating group.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      // ACCESSIBILITÉ: Liaison du titre
      aria-labelledby="add-group-modal-title"
    >
      <DialogTitle
        id="add-group-modal-title"
        sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        Create New Lock Group
        <IconButton
          onClick={onClose}
          // ACCESSIBILITÉ: Label explicite
          aria-label="Close dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Group Name"
            type="text"
            fullWidth
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={loading}
            required
            // ACCESSIBILITÉ: Indique que le champ est requis
            inputProps={{ "aria-required": "true" }}
          />
          {error && (
            // ACCESSIBILITÉ: Alerte vocale
            <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }} role="alert">
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            aria-busy={loading}
            sx={{
              backgroundColor: ACCESSIBLE_BLUE,
              '&:hover': { backgroundColor: "#1A3AC0" }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" aria-label="Creating group..." /> : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AddGroupModal;
