import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import getCookie from "../context/getCookie";
import ManageUser from "./ManageUser";
import DeleteUser from "./DeleteUser";
import CustomSnackbar from "./CustomSnackbar";
import UserGroupsList from "./GroupsUser/UserGroupsList";
import LogsDrawer from "./LogsDrawer";

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface UsersPageProps {
  onNavigate: (page: string) => void;
  onEditSchematic: (schematicId: number) => void;
}

// Couleur accessible (Ratio > 4.5:1 sur blanc)
const ACCESSIBLE_BLUE = "#2A4AE5"; 
const actionButtonStyle = {
    color: "#3B5CFF",
    textTransform: "none" as const, 
    fontWeight: 500,
    "&:hover": {
      backgroundColor: "#F5F7FF",
    },
};

const UsersPage: React.FC<UsersPageProps> = ({ onNavigate, onEditSchematic }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>("none");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Nouveaux états pour le LogsDrawer
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState<boolean>(false);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<User | null>(null);

  const [snackbar, setSnackbar] = useState({
    isError: false,
    text: "",
  });

  const getUserRole = (user: User): string => {
    if (user.is_superuser && user.is_staff) {
      return "Admin";
    } else if (user.is_staff) {
      return "Moderator";
    } else {
      return "User";
    }
  };

  const getRoleColor = (role: string): "error" | "warning" | "default" => {
    switch (role) {
      case "Admin":
        return "error";
      case "Moderator":
        return "warning";
      default:
        return "default";
    }
  };

  const fetchUsers = async () => {
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

    try {
      const response = await fetch("http://localhost:8000/users/", {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError("Erreur lors de la récupération des utilisateurs");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const role = getUserRole(user);
    return (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const refreshList = (needRefresh: boolean) => {
    if (needRefresh) {
      fetchUsers();
    }
  }

  const handleDialogOpen = (user: any) => {
    setIsDialogOpen(true);
    setSelectedUser(user);
  };
  
  // Handlers pour le LogsDrawer
  const handleViewLogs = (user: User) => {
    setSelectedUserForLogs(user);
    setIsLogsDrawerOpen(true);
  };

  const handleLogsDrawerClose = () => {
    setIsLogsDrawerOpen(false);
    setSelectedUserForLogs(null);
  };


  return (
    // Balise parente unique
    <Box sx={{ p: 4, backgroundColor: "#F5F5F5", minHeight: "calc(100vh - 64px)" }}>
      <CustomSnackbar
        isError={snackbar?.isError}
        text={snackbar?.text}
        onClose={() => { setSnackbar({ isError: snackbar?.isError || false, text: "" }); }}
      />

      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: "#333",
        }}
      >
        User Management
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 4,
          flexDirection: { xs: 'column', md: 'row' }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid #E0E0E0",
            width: { xs: '100%', md: '50%' }
          }}
        >
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
            User List
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
            <TextField
              placeholder="Name or role"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              inputProps={{ "aria-label": "Search users by name or role" }}
              sx={{
                flexGrow: 1,
                maxWidth: 300,
                backgroundColor: "white",
              }}
            />
            <Button
              variant="contained"
              onClick={() => onNavigate("register")}
              sx={{
                backgroundColor: ACCESSIBLE_BLUE,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                ml: "auto",
                "&:hover": {
                  backgroundColor: "#1A3AC0",
                },
              }}
            >
              ADD USER
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress aria-label="Loading users..." />
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ textAlign: "center", py: 2 }} role="alert">
              {error}
            </Typography>
          )}

          {!loading && !error && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>
                      Username
                    </TableCell>
                    <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>
                      Role
                    </TableCell>
                    <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>
                      Logs
                    </TableCell>
                    <TableCell scope="col" aria-label="Actions"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: "center", py: 4 }}>
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const role = getUserRole(user);
                      return (
                        <TableRow
                          key={user.id}
                          sx={{
                            backgroundColor: index % 2 === 0 ? "white" : "#F5F5F5",
                            "&:hover": {
                              backgroundColor: "#F0F0F0",
                            },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {user.username}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={role}
                              color={getRoleColor(role)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            
                            <Button
                              size="small"
                              aria-label={`View logs for ${user.username}`}
                              onClick={() => handleViewLogs(user)}
                              sx={actionButtonStyle}
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleDialogOpen(user)}
                              aria-label={`Manage user ${user.username}`}
                              sx={{
                                color: ACCESSIBLE_BLUE,
                                textTransform: "none",
                                fontWeight: 600,
                                "&:hover": {
                                  backgroundColor: "#F5F7FF",
                                },
                              }}
                            >
                              Manage
                            </Button>
                            <DeleteUser
                              selectedUser={user}
                              onUserDeleted={() => {
                                setSelectedUser("null");
                              }}
                              refresh={refreshList}
                              snackbar={snackbar}
                              setSnackbar={setSnackbar}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid #E0E0E0",
            width: { xs: '100%', md: '50%' }
          }}
        >
          <UserGroupsList onNavigate={onNavigate} />
        </Paper>
      </Box>

      <ManageUser
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
        refresh={refreshList}
      />
      
      <LogsDrawer
        open={isLogsDrawerOpen}
        onClose={handleLogsDrawerClose}
        userId={selectedUserForLogs?.id} 
        userName={selectedUserForLogs?.username} 
      />
    </Box>
  );
};

export default UsersPage;