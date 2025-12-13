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

  const [userSearchQuery, setUserSearchQuery] = useState("");

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
      setGroupName("");
      setSelectedUserIds([]);
      setAllUsers([]);
      setError("");
      setUsersError("");
      setLoading(false);
      setUserSearchQuery("");
      return;
    }

    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError("");
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/`, {
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

  const handleClose = () => {
    onClose();
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>, userId: number) => {
    if (event.target.checked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const groupResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/groups/`, {
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

      if (selectedUserIds.length > 0) {
        const addUserResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/groups/${newGroup.id}/add_user/`, {
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
      // ACCESSIBILITÉ
      aria-labelledby="add-group-title"
    >
      <DialogTitle
        id="add-group-title"
        sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        Create a new group
        <IconButton onClick={handleClose} aria-label="Close dialog">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            id="group-name"
            autoFocus
            label="Group Name"
            name="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            variant="outlined"
            fullWidth
            required
            sx={{ mt: 1 }}
            // ACCESSIBILITÉ
            inputProps={{ "aria-required": "true" }}
          />

          <Typography
            variant="h6"
            component="h2" // Structure
            sx={{ mt: 3, mb: 1, fontWeight: 600 }}
          >
            Add members (optional)
          </Typography>

          <TextField
            // ACCESSIBILITÉ: Label invisible
            inputProps={{ "aria-label": "Search users to add" }}
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
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid #E0E0E0',
                borderRadius: 1,
                p: 1
              }}
              // ACCESSIBILITÉ: Groupe de contrôles
              role="group"
              aria-label="Select members to add"
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
                          // ACCESSIBILITÉ
                          inputProps={{ 'aria-label': `Select ${user.username}` }}
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
          <Button onClick={handleClose} color="inherit">
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
            {loading ? <CircularProgress size={24} color="inherit" aria-label="Creating group..." /> : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AddGroupDialog;
