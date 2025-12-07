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
import EditIcon from '@mui/icons-material/Edit'; 
import getCookie from "../../context/getCookie";

// --- Importer les QUATRE composants ---
import AddGroupDialog from "./AddGroupDialog"; 
import ManageGroupDialog from "./ManageGroupDialog"; 
import ConfirmDeleteDialog from "./ConfirmDeleteDialog"; 
import CustomSnackbar from "../CustomSnackbar"; 

// Couleur accessible
const ACCESSIBLE_BLUE = "#2A4AE5";

interface Group {
  id: number;
  name: string;
  members_count: number; 
}

interface SnackbarInfo {
  text: string;
  isError: boolean;
}

interface UserGroupsListProps {
  onNavigate: (page: string) => void;
}

const UserGroupsList: React.FC<UserGroupsListProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [snackbarInfo, setSnackbarInfo] = useState<SnackbarInfo>({ text: "", isError: false });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

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
      } else {
        const errData = await response.json().catch(() => ({}));
        setSnackbarInfo({ text: errData.error || "Error fetching groups", isError: true });
      }
    } catch (err) {
      setSnackbarInfo({ text: "Connection error", isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenDeleteDialog = (group: Group) => {
    setGroupToDelete(group);
    setIsDeleteDialogOpen(true);
  };
  const handleCloseDeleteDialog = () => {
    setGroupToDelete(null);
    setIsDeleteDialogOpen(false);
  };
  const handleConfirmDelete = async () => {
    if (!groupToDelete) return; 
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};
    try {
      const response = await fetch(`http://localhost:8000/users/groups/${groupToDelete.id}/delete/`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      if (response.ok) {
        setGroups(groups.filter(group => group.id !== groupToDelete.id));
        handleCloseDeleteDialog();
        setSnackbarInfo({ text: "Group deleted successfully", isError: false });
      } else {
        setSnackbarInfo({ text: "Failed to delete group.", isError: true });
        handleCloseDeleteDialog();
      }
    } catch (err) {
      setSnackbarInfo({ text: "Connection error during deletion.", isError: true });
      handleCloseDeleteDialog();
    }
  };

  const handleOpenManageDialog = (group: Group) => {
    setSelectedGroup(group);
    setIsManageDialogOpen(true);
  };
  const handleCloseManageDialog = () => {
    setIsManageDialogOpen(false);
    setSelectedGroup(null);
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <CustomSnackbar
        text={snackbarInfo.text}
        isError={snackbarInfo.isError}
        onClose={() => setSnackbarInfo({ text: "", isError: false })}
      />
    
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
        User Groups
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          placeholder="Filter groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          // ACCESSIBILITÉ: Label explicite
          inputProps={{ "aria-label": "Filter groups by name" }}
          sx={{ 
                maxWidth: 300, 
                backgroundColor: "white" 
          }}
        />
        <Button
          variant="contained"
          onClick={() => setIsAddDialogOpen(true)} 
          sx={{
            backgroundColor: ACCESSIBLE_BLUE, // Bleu contrasté
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            flexShrink: 0, 
            ml: "auto", 
            "&:hover": { backgroundColor: "#1A3AC0" },
          }}
        >
          ADD GROUP
        </Button>
      </Box>
      
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress aria-label="Loading groups" />
        </Box>
      )}

      {!loading && (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader aria-label="User groups list">
            <TableHead>
              <TableRow>
                {/* ACCESSIBILITÉ: scope="col" */}
                <TableCell scope="col" sx={{ fontWeight: 600, color: "#666" }}>
                  Group Name
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 600, color: "#666", textAlign: 'center', width: '100px' }}>
                  Members
                </TableCell>
                <TableCell scope="col" sx={{ fontWeight: 600, color: "#666", textAlign: 'right', pr: 2 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: "center", py: 4 }}>
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
                    {/* ACCESSIBILITÉ: Cellule d'en-tête de ligne */}
                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                        {group.name}
                    </TableCell>
                    
                    <TableCell sx={{ textAlign: 'center' }}>
                      {group.members_count}
                    </TableCell>
                    
                    <TableCell sx={{ textAlign: 'right', p: 0 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenManageDialog(group)}
                        // ACCESSIBILITÉ: Label précis
                        aria-label={`Manage group ${group.name}`}
                        sx={{
                          color: ACCESSIBLE_BLUE,
                          textTransform: "none",
                          fontWeight: 500,
                          mr: 0.5,
                        }}
                      >
                        Manage
                      </Button>
                      
                      <IconButton 
                        onClick={() => handleOpenDeleteDialog(group)} 
                        color="error"
                        size="small"
                        // ACCESSIBILITÉ: Label précis
                        aria-label={`Delete group ${group.name}`}
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
      
      <AddGroupDialog 
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onGroupAdded={(newGroup) => {
          fetchGroups(); 
          setSnackbarInfo({ text: "Group created successfully", isError: false });
        }}
      />
      
      <ManageGroupDialog
        open={isManageDialogOpen}
        onClose={handleCloseManageDialog}
        group={selectedGroup}
        onGroupUpdated={(updatedGroup) => {
          fetchGroups(); 
          setSnackbarInfo({ text: "Group updated successfully", isError: false });
          handleCloseManageDialog();
        }}
      />
      
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${groupToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default UserGroupsList;