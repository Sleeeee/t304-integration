import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  FormControlLabel,
  Checkbox,
  List,
  ListItem
} from '@mui/material';
import getCookie from '../../context/getCookie';
import { Lock, LockGroup } from '../../types/index';

// Couleur accessible
const ACCESSIBLE_BLUE = "#2A4AE5";

interface AddLocksToGroupModalProps {
  isDialogOpen: boolean;
  onClose: (shouldUpdate: boolean) => void;
  group: LockGroup;
  allLocks: Lock[];
}

const AddLocksToGroupModal: React.FC<AddLocksToGroupModalProps> = ({ 
  isDialogOpen, 
  onClose, 
  group, 
  allLocks 
}) => {
  const [selectedLockIds, setSelectedLockIds] = useState<Set<number>>(new Set());
  const [existingLockIds, setExistingLockIds] = useState<Set<number>>(new Set());

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isDialogOpen) {
      const existingIds = new Set(group.locks.map(lock => lock.id_lock));
      setExistingLockIds(existingIds);
      setSelectedLockIds(new Set(existingIds)); 
      setError('');
    }
  }, [isDialogOpen, group]);

  const handleToggleLock = (lockId: number) => {
    if (existingLockIds.has(lockId)) {
      return; 
    }
    
    setSelectedLockIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lockId)) {
        newSet.delete(lockId);
      } else {
        newSet.add(lockId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    const newLockIds = Array.from(selectedLockIds).filter(
      id => !existingLockIds.has(id)
    );
    
    if (newLockIds.length === 0) {
      onClose(false);
      return;
    }

    const csrfToken = getCookie("csrftoken");
    
    try {
      const response = await fetch(
        `http://localhost:8000/locks/groups/${group.id_group}/add_lock/`, 
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken || '',
          },
          body: JSON.stringify({ lock_ids: newLockIds }), 
        }
      );

      if (response.ok) {
        onClose(true); 
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

  return (
    <Dialog 
      open={isDialogOpen} 
      onClose={() => onClose(false)} 
      fullWidth 
      maxWidth="xs"
      // ACCESSIBILITÉ: Liaison du titre
      aria-labelledby="add-locks-title"
    >
      <DialogTitle id="add-locks-title">
        Add Locks to "{group.name}"
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select the locks to add to this group.
        </Typography>
        
        <List 
          dense 
          sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 0 }}
          // ACCESSIBILITÉ: Groupe de contrôles
          role="group"
          aria-label={`Select locks for group ${group.name}`}
        >
          {allLocks.length === 0 ? (
            <ListItem>
              <Typography sx={{ p: 2, color: '#666' }}>No locks available.</Typography>
            </ListItem>
          ) : (
            allLocks.map((lock) => {
              const isExisting = existingLockIds.has(lock.id_lock);
              return (
                <ListItem key={lock.id_lock} sx={{ p: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedLockIds.has(lock.id_lock)}
                        onChange={() => handleToggleLock(lock.id_lock)}
                        disabled={isExisting || isLoading}
                        // ACCESSIBILITÉ: Label explicite
                        inputProps={{ 
                          'aria-label': isExisting 
                            ? `${lock.name} is already in the group` 
                            : `Select ${lock.name}` 
                        }}
                        sx={{
                          '&.Mui-checked': { color: ACCESSIBLE_BLUE },
                        }}
                      />
                    }
                    label={`${lock.name} ${isExisting ? '(Already in group)' : ''}`}
                    sx={{ width: '100%', m: 0, p: '4px 16px' }}
                  />
                </ListItem>
              );
            })
          )}
        </List>
          
        {error && (
          // ACCESSIBILITÉ: Alerte vocale
          <Typography color="error" variant="body2" sx={{ mt: 2 }} role="alert">
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => onClose(false)} disabled={isLoading} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={isLoading}
          aria-busy={isLoading}
          sx={{ 
            backgroundColor: ACCESSIBLE_BLUE,
            '&:hover': { backgroundColor: "#1A3AC0" } 
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" aria-label="Saving..." /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLocksToGroupModal;