import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete'; 
import getCookie from "../../context/getCookie";

// --- 1. IMPORT THE NEW DIALOG COMPONENT ---
import AddGroupDialog from "./AddGroupDialog"; // Adjust the path if needed

// Interface for a group
interface Group {
  id: number;
  name: string;
}

interface UserGroupsListProps {
  onNavigate: (page: string) => void;
}

const UserGroupsList: React.FC<UserGroupsListProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // --- 2. ADD STATE TO CONTROL THE POPUP ---
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Function to fetch groups (unchanged)
  const fetchGroups = async () => {
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

    try {
      const response = await fetch("http://localhost:8000/users/groups/", {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
        setError(""); 
      } else {
        // Improved error handling
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || "Error fetching groups");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // --- 3. REMOVE THE OLD 'handleCreateGroup' FUNCTION ---
  // It is now in AddGroupDialog.tsx

  // Function to delete a group (unchanged)
  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm("Are you sure you want to delete this group?")) {
      return;
    }
    
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

    try {
      const response = await fetch(`http://localhost:8000/users/groups/${groupId}/delete/`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        setGroups(groups.filter(group => group.id !== groupId));
        setError("");
      } else {
        setError("Failed to delete group.");
      }
    } catch (err) {
      setError("Connection error during deletion.");
    }
  };

  // Filter groups (unchanged)
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
        User Groups
      </Typography>

      {/* --- 4. MODIFY THE SEARCH BAR AND BUTTON --- */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          placeholder="Filter groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          // fullWidth and flexGrow have been removed
          sx={{ 
                maxWidth: 300, // Just keep the max width
                backgroundColor: "white" 
          }}
        />
        <Button
          variant="contained"
          // Opens the popup instead of creating directly
          onClick={() => setIsAddDialogOpen(true)} 
          sx={{
            backgroundColor: "#3B5CFF",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            flexShrink: 0, 
            ml: "auto", // <-- THIS IS THE MAGIC MODIFICATION
            "&:hover": { backgroundColor: "#2A4AE5" },
          }}
        >
          ADD GROUP
        </Button>
      </Box>
      
      {/* The old search bar is gone, merged above */}

      {/* Loading state (unchanged) */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state (unchanged) */}
      {error && (
        <Typography color="error" sx={{ textAlign: "center", py: 2, mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Groups table (unchanged) */}
      {!loading && !error && (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              {/* ... (TableHead content unchanged) ... */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                  Group Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#666", textAlign: 'right', pr: 2 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: "center", py: 4 }}>
                    {groups.length === 0 ? "No groups created" : "No group matches the filter"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group, index) => (
                  <TableRow
                    key={group.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "white" : "#F5F5F5",
                      "&:hover": { backgroundColor: "#F0F0F0" },
                    }}
                  >
                    <TableCell>{group.name}</TableCell>
                    <TableCell sx={{ textAlign: 'right', p: 0 }}>
                      <IconButton 
                        onClick={() => handleDeleteGroup(group.id)}
                        color="error"
                        size="small"
                        aria-label="delete group"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* --- 5. ADD THE DIALOG COMPONENT AT THE END --- */}
      <AddGroupDialog 
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onGroupAdded={(newGroup) => {
          // Updates the group list locally
          setGroups([...groups, newGroup]); 
        }}
      />
    </Box>
  );
};

export default UserGroupsList;