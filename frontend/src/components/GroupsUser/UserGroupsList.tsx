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
import CustomSnackbar from "../CustomSnackbar"; // <-- 1. IMPORTER LA SNACKBAR

// --- MODIFICATION 1: Mettre à jour l'interface ---
interface Group {
  id: number;
  name: string;
  members_count: number; // <-- AJOUTER ÇA
}

// --- INTERFACE POUR L'ÉTAT DE LA SNACKBAR ---
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
  
  // State pour les pop-ups
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  // Fonction pour récupérer les groupes
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
        // Le `setGroups` fonctionnera directement car `data.groups`
        // inclut maintenant `members_count`
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

  // ... (Toutes les autres fonctions : handleConfirmDelete, handleOpenManageDialog, etc. sont inchangées) ...
  // Logique de suppression
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
  // Logique de modification
  const handleOpenManageDialog = (group: Group) => {
    setSelectedGroup(group);
    setIsManageDialogOpen(true);
  };
  const handleCloseManageDialog = () => {
    setIsManageDialogOpen(false);
    setSelectedGroup(null);
  };
  const handleGroupUpdated = (updatedGroup: Group) => {
    setGroups(currentGroups => 
      currentGroups.map(g => (g.id === updatedGroup.id ? updatedGroup : g))
    );
    setSelectedGroup(updatedGroup);
    setSnackbarInfo({ text: "Group updated successfully", isError: false });
  };


  // Filtrer les groupes (inchangée)
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
    
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
        User Groups
      </Typography>

      {/* Barre de recherche et bouton ADD (inchangés) */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          placeholder="Filter groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ 
                maxWidth: 300, 
                backgroundColor: "white" 
          }}
        />
        <Button
          variant="contained"
          onClick={() => setIsAddDialogOpen(true)} 
          sx={{
            backgroundColor: "#3B5CFF",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            flexShrink: 0, 
            ml: "auto", 
            "&:hover": { backgroundColor: "#2A4AE5" },
          }}
        >
          ADD GROUP
        </Button>
      </Box>
      
      {/* Loading (inchangé) */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tableau des groupes */}
      {!loading && (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* --- MODIFICATION 2: AJOUTER L'EN-TÊTE DE COLONNE --- */}
                <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                  Group Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#666", textAlign: 'center', width: '100px' }}>
                  Members
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#666", textAlign: 'right', pr: 2 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  {/* --- MODIFICATION 3: METTRE À JOUR LE COLSPAN --- */}
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
                    <TableCell>{group.name}</TableCell>
                    
                    {/* --- MODIFICATION 4: AFFICHER LE COMPTE --- */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      {group.members_count}
                    </TableCell>
                    
                    <TableCell sx={{ textAlign: 'right', p: 0 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenManageDialog(group)}
                        sx={{
                          color: "#3B5CFF",
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
      
      {/* ... (Tous les Dialogs restent inchangés) ... */}
      <AddGroupDialog 
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onGroupAdded={(newGroup) => {
          // On met à jour l'état (on rafraîchit tout pour avoir le compte 0)
          fetchGroups(); // On re-fetch pour être sûr d'avoir le compte
          setSnackbarInfo({ text: "Group created successfully", isError: false });
        }}
      />
      
      <ManageGroupDialog
        open={isManageDialogOpen}
        onClose={handleCloseManageDialog}
        group={selectedGroup}
        onGroupUpdated={(updatedGroup) => {
          // On rafraîchit tout pour mettre à jour le compte des membres
          fetchGroups(); 
          setSnackbarInfo({ text: "Group updated successfully", isError: false });
          // On ferme la pop-up
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