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

// Interfaces (tu peux les mettre dans un fichier partagé)
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
  group: Group | null; // Le groupe à modifier
  onGroupUpdated: (updatedGroup: Group) => void; // Pour rafraîchir la liste
};

const ManageGroupDialog: React.FC<ManageGroupDialogProps> = ({ open, onClose, group, onGroupUpdated }) => {
  // --- State pour le nom ---
  const [groupName, setGroupName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  // --- State pour les membres ---
  const [allUsers, setAllUsers] =useState<User[]>([]);
  const [initialMemberIds, setInitialMemberIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  // --- State global ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // Helper pour les headers
  const getHeaders = (withContentType = false) => {
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = { "X-CSRFToken": csrfToken || "" };
    if (withContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  // --- Chargement des données à l'ouverture ---
  useEffect(() => {
    if (!open || !group) {
      // Réinitialiser si fermé ou pas de groupe
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

    // Pré-remplir le nom
    setGroupName(group.name);
    setUsersLoading(true);

    // On lance 2 requêtes en parallèle
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
        setInitialMemberIds(memberIds); // Sauvegarde l'état initial
        setSelectedUserIds(memberIds); // L'état qui va changer
      })
      .catch(err => {
        setUsersError(err.message || "Failed to load data");
      })
      .finally(() => {
        setUsersLoading(false);
      });

  }, [open, group]); // Se relance si le groupe change ou si on ouvre

  // --- Gère la mise à jour du NOM ---
  const handleUpdateName = async () => {
    if (!group || !groupName.trim()) {
      setNameError("Name cannot be empty");
      return;
    }
    
    setNameLoading(true);
    setNameError("");
    
    try {
      const response = await fetch(`http://localhost:8000/users/groups/${group.id}/update/`, {
        method: 'PATCH', // Utilise PATCH
        credentials: 'include',
        headers: getHeaders(true),
        body: JSON.stringify({ name: groupName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.name?.[0] || "Failed to update name");
      }

      const data = await response.json();
      onGroupUpdated(data.group); // Renvoie le groupe mis à jour au parent
      setNameError(""); // Succès ! (on pourrait afficher un snackbar)
      
    } catch (err: any) {
      setNameError(err.message);
    } finally {
      setNameLoading(false);
    }
  };

  // --- Gère la mise à jour des MEMBRES ---
  const handleSubmitMembers = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!group) return; // Sécurité, s'assure que 'group' n'est pas null

    setLoading(true);
    setError("");

    // Calculer la différence
    const usersToAdd = selectedUserIds.filter(id => !initialMemberIds.includes(id));
    const usersToRemove = initialMemberIds.filter(id => !selectedUserIds.includes(id));

    try {
      const requests = [];

      // 1. Requête pour ajouter
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

      // 2. Requête pour retirer
      if (usersToRemove.length > 0) {
        requests.push(
          fetch(`http://localhost:8000/users/groups/${group.id}/remove_user/`, {
            method: "DELETE", // Ton backend attend DELETE avec un body
            credentials: "include",
            headers: getHeaders(true),
            body: JSON.stringify({ user_ids: usersToRemove }), 
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Vérifier si une des requêtes a échoué
      for (const res of responses) {
        if (!res.ok) {
          throw new Error("Failed to update one or more member lists.");
        }
      }
      
      // --- MODIFICATION ICI ---
      // Au lieu de juste fermer, on appelle 'onGroupUpdated'.
      // Le composant parent (UserGroupsList) va maintenant
      // rafraîchir la liste et fermer la pop-up.
      onGroupUpdated(group); 

    } catch (err: any) {
      setError(err.message || "An error occurred while updating members.");
    } finally {
      setLoading(false);
    }
  };


  // Gère le cochage/décochage
  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>, userId: number) => {
    if (event.target.checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Manage Group: {group?.name}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {/* Le formulaire ne gère que les membres */}
      <form onSubmit={handleSubmitMembers}>
        <DialogContent>
          
          {/* --- Section 1: Renommer --- */}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Rename Group
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
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
            />
            <Tooltip title="Save name">
              <span>
                <IconButton onClick={handleUpdateName} disabled={nameLoading}>
                  {nameLoading ? <CircularProgress size={24} /> : <SaveIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          
          {/* --- Section 2: Membres --- */}
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Manage Members
          </Typography>
          
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
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #E0E0E0', borderRadius: 1, p: 1 }}>
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
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading} // Désactivé si on sauvegarde les membres
            sx={{ 
              backgroundColor: "#3B5CFF",
              '&:hover': { backgroundColor: "#2A4AE5" } 
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Save Member Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default ManageGroupDialog;