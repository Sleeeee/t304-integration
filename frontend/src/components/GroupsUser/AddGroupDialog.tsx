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
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import getCookie from "../../context/getCookie"; 

interface User {
  id: number;
  username: string;
  email: string;
}

interface Group {
  id: number;
  name: string;
}

type AddGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  onGroupAdded: (newGroup: Group) => void; 
};

const AddGroupDialog: React.FC<AddGroupDialogProps> = ({ open, onClose, onGroupAdded }) => {
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // --- NOUVEAU: État pour le filtre de recherche des utilisateurs ---
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Fonction helper pour les headers
  const getHeaders = (withContentType = false) => {
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = { "X-CSRFToken": csrfToken || "" };
    if (withContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  // Récupérer les utilisateurs à l'ouverture
  useEffect(() => {
    if (!open) {
      setGroupName("");
      setSelectedUserIds([]);
      setAllUsers([]);
      setError("");
      setUsersError("");
      setLoading(false);
      setUserSearchQuery(""); // Réinitialiser la recherche
      return;
    }

    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError("");
      try {
        const response = await fetch("http://localhost:8000/users/", { 
          method: "GET",
          credentials: "include",
          headers: getHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setAllUsers(data.users || []);
        } else {
          setUsersError("Failed to load user list.");
        }
      } catch (err) {
        setUsersError("Connection error (users).");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [open]); 

  // Gère la fermeture
  const handleClose = () => {
    onClose(); 
  };

  // Gère le cochage/décochage
  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>, userId: number) => {
    if (event.target.checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Gère la création du groupe (inchangé)
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // --- APPEL 1: Créer le groupe ---
      const groupResponse = await fetch("http://localhost:8000/users/groups/", {
        method: "POST",
        credentials: "include",
        headers: getHeaders(true),
        body: JSON.stringify({ name: groupName }),
      });

      if (!groupResponse.ok) {
        const errData = await groupResponse.json();
        throw new Error(errData.name?.[0] || "Failed to create group.");
      }

      const newGroupData = await groupResponse.json();
      const newGroup: Group = newGroupData.group;

      // --- APPEL 2: Ajouter les utilisateurs (si cochés) ---
      if (selectedUserIds.length > 0) {
        const addUserResponse = await fetch(`http://localhost:8000/users/groups/${newGroup.id}/add_user/`, {
          method: "POST",
          credentials: "include",
          headers: getHeaders(true),
          body: JSON.stringify({ user_ids: selectedUserIds }), 
        });

        if (!addUserResponse.ok) {
          throw new Error("Group created, but failed to add users.");
        }
      }
      
      onGroupAdded(newGroup); 
      handleClose(); 

    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // --- NOUVEAU: Filtrer les utilisateurs pour l'affichage ---
  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={true}
      maxWidth="sm" 
    >
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create a new group
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus 
            label="Group Name"
            name="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            variant="outlined"
            fullWidth
            required
            sx={{ mt: 1 }}
          />
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Add members (optional)
          </Typography>

          {/* --- NOUVEAU: Champ de recherche --- */}
          <TextField
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
              <CircularProgress />
            </Box>
          ) : usersError ? (
            <Typography color="error" sx={{ textAlign: 'center' }}>
              {usersError}
            </Typography>
          ) : (
            <Box sx={{ 
              maxHeight: 300, 
              overflow: 'auto', 
              border: '1px solid #E0E0E0', 
              borderRadius: 1,
              p: 1
            }}>
              <FormGroup>
                {/* --- MODIFIÉ: Utilise filteredUsers --- */}
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
            <Typography color="error" sx={{ mt: 2, textAlign: 'center', fontWeight: 500 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleClose} color="inherit">
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
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AddGroupDialog;