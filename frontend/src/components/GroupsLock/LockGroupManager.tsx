import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,

} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import getCookie from '../../context/getCookie'; 
import AddLocksToGroupModal from './AddLocksToGroupModal'; 
import { Lock, LockGroup } from '../../types';
import AddGroupModal from './AddGroupModal'; 

interface LockGroupManagerProps {
  allLocks: Lock[]; 
}

const LockGroupManager: React.FC<LockGroupManagerProps> = ({ allLocks }) => {
  const [groups, setGroups] = useState<LockGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  
  const [searchQuery, setSearchQuery] = useState<string>("");


  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState<boolean>(false);


  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<LockGroup | null>(null);


  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    try {
      const response = await fetch("http://localhost:8000/locks/groups/", { 
        method: "GET",
        credentials: "include",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data.lock_groups || []);
        setError('');
      } else {
        setError("Error fetching groups.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);


  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }
    setError('');
    const csrfToken = getCookie("csrftoken");
    try {
      const response = await fetch(`http://localhost:8000/locks/groups/${groupId}/delete/`, { 
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
      });
      if (response.ok || response.status === 204) { 
        fetchGroups(); 
      } else {
        const data = await response.json();
        setError(data.error || "Error deleting group.");
      }
    } catch (err) {
      setError("Server connection error.");
    }
  };

  const handleOpenAddLocks = (group: LockGroup) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = (shouldRefresh: boolean) => {
    setIsModalOpen(false);
    setSelectedGroup(null);
    if (shouldRefresh) {
      fetchGroups(); 
    }
  }

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
      

      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flexGrow: 1, 
            maxWidth: 300, 
            backgroundColor: "white",
          }}
        />
        <Button
          variant="contained"
          onClick={() => setIsAddGroupModalOpen(true)} 
          sx={{
            backgroundColor: "#3B5CFF", textTransform: "none", fontWeight: 600,
            boxShadow: "none", ml: "auto", 
            "&:hover": { backgroundColor: "#2A4AE5" },
          }}
        >
          ADD GROUP 
        </Button>
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}


      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List dense sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {filteredGroups.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: '#666', py: 2 }}>
              {groups.length === 0 ? "No groups found." : "No group matches search."}
            </Typography>
          ) : (
            filteredGroups.map((group) => (
              <ListItem key={group.id_group} divider>
                <ListItemText
                  primary={group.name}
                  secondary={`${group.locks.length} lock(s)`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    title="Add locks"
                    onClick={() => handleOpenAddLocks(group)}
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    title="Delete group"
                    sx={{ ml: 1 }}
                    onClick={() => handleDeleteGroup(group.id_group, group.name)}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      )}
      

      {selectedGroup && (
        <AddLocksToGroupModal
          isDialogOpen={isModalOpen}
          onClose={handleCloseModal}
          group={selectedGroup}
          allLocks={allLocks}
        />
      )}


      <AddGroupModal
        open={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onGroupAdded={(newGroup) => {
          setIsAddGroupModalOpen(false); 
          fetchGroups(); 
        }}
      />
    </Paper>
  );
};

export default LockGroupManager;