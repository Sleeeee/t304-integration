import React, { useState } from "react";
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
  InputAdornment,
} from "@mui/material";

interface User {
  username: string;
  group: string;
  lastDoorOpen: string;
}

interface UsersPageProps {
  onNavigate: (page: string) => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Données exemple - à remplacer par vos vraies données
  const users: User[] = [
    { username: "Yolinox", group: "Trou", lastDoorOpen: "9m ago" },
    { username: "Showcase", group: "Baile", lastDoorOpen: "10m ago" },
    { username: "Sleee", group: "Baile, Trou", lastDoorOpen: "5s ago" },
  ];

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholder="Name or group"
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

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                  Username
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                  Group
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                  Last door open
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#666" }}>
                  View
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor: index % 2 === 0 ? "white" : "#F5F5F5",
                    "&:hover": {
                      backgroundColor: "#F0F0F0",
                    },
                  }}
                >
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.group}</TableCell>
                  <TableCell>{user.lastDoorOpen}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default UsersPage;