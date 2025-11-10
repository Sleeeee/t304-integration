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
import { LockGroup } from '../../types'; // Importer le type

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

  // Logique de création (déplacée depuis LockGroupManager)
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
      const response = await fetch("http://localhost:8000/locks/groups/", {
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
        onGroupAdded(newGroup.lock_group); // Renvoie le nouveau groupe
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create New Lock Group
        <IconButton onClick={onClose}>
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
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            sx={{
              backgroundColor: "#3B5CFF",
              '&:hover': { backgroundColor: "#2A4AE5" }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AddGroupModal;