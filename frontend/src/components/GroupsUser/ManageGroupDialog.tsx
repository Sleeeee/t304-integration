import React, { useState, ChangeEvent, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import getCookie from "../../context/getCookie"; 

// Couleur accessible
const ACCESSIBLE_BLUE = "#2A4AE5";

interface User {
  id: number;
  username: string;
  email: string;
}
interface Group {
  id: number;
  name: string;
}

type ManageGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  group: Group | null; 
  onGroupUpdated: (updatedGroup: Group) => void; 
};

const ManageGroupDialog: React.FC<ManageGroupDialogProps> = ({ open, onClose, group, onGroupUpdated }) => {
  const [groupName, setGroupName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  const [allUsers, setAllUsers] =useState<User[]>([]);
  const [initialMemberIds, setInitialMemberIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
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
    if (!open || !group) {
      setGroupName("");
      setAllUsers([]);
      setInitialMemberIds([]);
      setSelectedUserIds([]);
      setUserSearchQuery("");
      setError("");
      setNameError("");
      setUsersError("");
      return;
    }

    setGroupName(group.name);
    setUsersLoading(true);

    const fetchAllUsers = fetch("http://localhost:8000/users/", { 
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });

    const fetchGroupMembers = fetch(`http://localhost:8000/users/groups/${group.id}/users/`, {
      method: "GET",
      credentials: "include",
      headers: getHeaders(),
    });

    Promise.all([fetchAllUsers, fetchGroupMembers])
      .then(async ([usersRes, membersRes]) => {
        if (!usersRes.ok) throw new Error("Failed to load user list");
        if (!membersRes.ok) throw new Error("Failed to load group members");

        const usersData = await usersRes.json();
        const membersData = await membersRes.json();
        
        const memberIds = membersData.members.map((user: User) => user.id);
        
        setAllUsers(usersData.users || []);
        setInitialMemberIds(memberIds); 
        setSelectedUserIds(memberIds); 
      })
      .catch(err => {
        setUsersError(err.message || "Failed to load data");
      })
      .finally(() => {
        setUsersLoading(false);
      });

  }, [open, group]); 

  const handleUpdateName = async () => {
    if (!group || !groupName.trim()) {
      setNameError("Name cannot be empty");
      return;
    }
    
    setNameLoading(true);
    setNameError("");
    
    try {
      const response = await fetch(`http://localhost:8000/users/groups/${group.id}/update/`, {
        method: 'PATCH', 
        credentials: 'include',
        headers: getHeaders(true),
        body: JSON.stringify({ name: groupName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.name?.[0] || "Failed to update name");
      }

      const data = await response.json();
      onGroupUpdated(data.group); 
      setNameError(""); 
      
    } catch (err: any) {
      setNameError(err.message);
    } finally {
      setNameLoading(false);
    }
  };

  const handleSubmitMembers = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!group) return; 

    setLoading(true);
    setError("");

    const usersToAdd = selectedUserIds.filter(id => !initialMemberIds.includes(id));
    const usersToRemove = initialMemberIds.filter(id => !selectedUserIds.includes(id));

    try {
      const requests = [];

      if (usersToAdd.length > 0) {
        requests.push(
          fetch(`http://localhost:8000/users/groups/${group.id}/add_user/`, {
            method: "POST",
            credentials: "include",
            headers: getHeaders(true),
            body: JSON.stringify({ user_ids: usersToAdd }), 
          })
        );
      }

      if (usersToRemove.length > 0) {
        requests.push(
          fetch(`http://localhost:8000/users/groups/${group.id}/remove_user/`, {
            method: "DELETE", 
            credentials: "include",
            headers: getHeaders(true),
            body: JSON.stringify({ user_ids: usersToRemove }), 
          })
        );
      }

      const responses = await Promise.all(requests);
      
      for (const res of responses) {
        if (!res.ok) {
          throw new Error("Failed to update one or more member lists.");
        }
      }
      
      onGroupUpdated(group); 

    } catch (err: any) {
      setError(err.message || "An error occurred while updating members.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>, userId: number) => {
    if (event.target.checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth={true} 
      maxWidth="sm"
      // ACCESSIBILITÉ: Liens
      aria-labelledby="manage-group-dialog-title"
    >
      <DialogTitle 
        id="manage-group-dialog-title"
        sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        Manage Group: {group?.name}
        <IconButton onClick={onClose} aria-label="Close dialog">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmitMembers}>
        <DialogContent>
          
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Rename Group
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              id="group-name-input" // ID pour le label
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              variant="outlined"
              fullWidth
              required
              size="small"
              error={!!nameError}
              helperText={nameError}
              sx={{ mt: 1 }}
              // ACCESSIBILITÉ
              inputProps={{ "aria-required": "true" }}
            />
            <Tooltip title="Save name">
              <span>
                <IconButton 
                  onClick={handleUpdateName} 
                  disabled={nameLoading}
                  // ACCESSIBILITÉ: Label explicite
                  aria-label="Save group name"
                >
                  {nameLoading ? <CircularProgress size={24} aria-label="Saving..." /> : <SaveIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          
          <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Manage Members
          </Typography>
          
          <TextField
            // ACCESSIBILITÉ: Label explicite (car visuellement caché)
            inputProps={{ "aria-label": "Search for a user to add" }}
            placeholder="Search for a user..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 1, backgroundColor: '#FAFAFA' }}
          />
          
          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress aria-label="Loading users..." />
            </Box>
          ) : usersError ? (
            <Typography color="error" sx={{ textAlign: 'center' }} role="alert">
              {usersError}
            </Typography>
          ) : (
            <Box 
              sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #E0E0E0', borderRadius: 1, p: 1 }}
              role="group" 
              aria-label="Select group members"
            >
              <FormGroup>
                {filteredUsers.length === 0 ? (
                  <Typography sx={{ p: 2, textAlign: 'center', color: '#666' }}>
                    {allUsers.length === 0 ? "No users found." : "No user matches the search."}
                  </Typography>
                ) : (
                  filteredUsers.map((user) => (
                    <FormControlLabel
                      key={user.id}
                      control={
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => handleCheckboxChange(e, user.id)}
                          // ACCESSIBILITÉ: Label explicite sur la checkbox
                          inputProps={{ 'aria-label': `Select user ${user.username}` }}
                          sx={{
                            '&.Mui-checked': { color: ACCESSIBLE_BLUE },
                          }}
                        />
                      }
                      label={`${user.username} (${user.email})`}
                    />
                  ))
                )}
              </FormGroup>
            </Box>
          )}
          
          {error && (
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
            disabled={loading} 
            sx={{ 
              backgroundColor: ACCESSIBLE_BLUE,
              '&:hover': { backgroundColor: "#1A3AC0" } 
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" aria-label="Saving members..." /> : "Save Member Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ManageGroupDialog;