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
} from '@mui/material';
import getCookie from '../context/getCookie';
import { Lock } from '../types/index';


interface ManageLockProps {
  isDialogOpen: boolean;
  onClose: (shouldUpdate: boolean) => void;
  selectedLock: Lock | null;
}

const ManageLock: React.FC<ManageLockProps> = ({ isDialogOpen, onClose, selectedLock }) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const isEditMode = selectedLock !== null;

  useEffect(() => {
    if (isDialogOpen) {
      if (isEditMode && selectedLock) {
        setName(selectedLock.name);
        setDescription(selectedLock.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setError('');
    }
  }, [selectedLock, isEditMode, isDialogOpen]);

  const handleClose = (shouldUpdate: boolean = false) => {
    onClose(shouldUpdate);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    const csrfToken = getCookie("csrftoken");
    const method = isEditMode ? 'PUT' : 'POST';
    const url = 'http://localhost:8000/locks/';
      
    let bodyData: any = { name, description };
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
        setError(data.error || 'Error saving lock'); 
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
      const response = await fetch('http://localhost:8000/locks/', {
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
    <Dialog open={isDialogOpen} onClose={() => handleClose(false)} fullWidth maxWidth="xs">
      <DialogTitle>{isEditMode ? 'Manage Lock' : 'Add Lock'}</DialogTitle> 
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
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
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
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save'} 
          </Button>
        </Box>
        
      </DialogActions>
    </Dialog>
  );
};

export default ManageLock;