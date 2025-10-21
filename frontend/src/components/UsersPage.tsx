import React, { useState, useEffect, ChangeEvent } from "react";
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
import ManageUser from "./ManageUser"

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface UsersPageProps {
  onNavigate: (page: string) => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState("none");
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fonction pour déterminer le rôle d'un utilisateur
  const getUserRole = (user: User): string => {
    if (user.is_superuser && user.is_staff) {
      return "Admin";
    } else if (user.is_staff) {
      return "Moderator";
    } else {
      return "User";
    }
  };

  // Fonction pour obtenir la couleur du chip selon le rôle
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

  // Récupérer les utilisateurs depuis le backend
  useEffect(() => {
    const fetchUsers = async () => {
      const csrfToken = getCookie("csrftoken");
      const headers: HeadersInit = csrfToken ? {
        "X-CSRFToken": csrfToken
      } : {};

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

    fetchUsers();
  }, []);

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter((user) => {
    const role = getUserRole(user);
    return (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Affiche le form en overlay et assigne l'id de l'utilisateur sélectionné
  const handleDialogOpen = (user: any) => {
	setIsDialogOpen(true);
	setSelectedUser(user);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: "#F5F5F5", minHeight: "calc(100vh - 64px)" }}>
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: "#333",
        }}
      >
        Users
      </Typography>

      {/* Content Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid #E0E0E0",
        }}
      >
        {/* Search Bar */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
          <TextField
            placeholder="Name or role"
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
            onClick={() => onNavigate("register")}
            sx={{
              backgroundColor: "#3B5CFF",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              ml: "auto",
              "&:hover": {
                backgroundColor: "#2A4AE5",
              },
            }}
          >
            ADD USER
          </Button>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Typography color="error" sx={{ textAlign: "center", py: 2 }}>
            {error}
          </Typography>
        )}

        {/* Table */}
        {!loading && !error && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                    Username
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                    Role
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                    Logs
                  </TableCell>
				  <TableCell>
				  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: "center", py: 4 }}>
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
                        <TableCell>{user.username}</TableCell>
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
                            sx={{
                              color: "#3B5CFF",
                              textTransform: "none",
                              fontWeight: 500,
                              "&:hover": {
                                backgroundColor: "#F5F7FF",
                              },
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
						<TableCell>
							<Button
								size="small"
								onClick={() => handleDialogOpen(user)}
								sx={{
									color: "#3B5CF",
									textTransform: "none",
									fontWeight: 500,
									"&:hover": {
										backgroundColor: "#F5F7FF",
									},
								}}
							>
							Manage
							</Button>
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
	  <ManageUser
	  	isDialogOpen={isDialogOpen}
		setIsDialogOpen={setIsDialogOpen}
		selectedUser={selectedUser}
		setSelectedUser={setSelectedUser}
		/>
    </Box>
  );
};

export default UsersPage;