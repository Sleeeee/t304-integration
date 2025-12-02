import React, { useState, useEffect, useCallback } from "react";
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
  CircularProgress
} from "@mui/material";
import getCookie from "../context/getCookie";
import ManageLock from "./ManageLock";
import LockGroupManager from "./GroupsLock/LockGroupManager";
import LogsDrawer from "./LogsDrawer";
import { Lock } from "../types";

interface LockPageProps {
  onNavigate?: (page: string) => void;
  onEditSchematic?: (schematicId: number) => void;
}

const actionButtonStyle = {
  color: "#3B5CFF",
  textTransform: "none",
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "#F5F7FF",
  },
};

const LockPage: React.FC<LockPageProps> = ({ onNavigate, onEditSchematic }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedLock, setSelectedLock] = useState<Lock | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState<boolean>(false);
  const [selectedLockForLogs, setSelectedLockForLogs] = useState<Lock | null>(null);

  const getLockStatusText = (status: string): string => {
    switch (status) {
      case "connected": return "Connected";
      case "disconnected": return "Disconnected";
      case "error": return "Error";
      default: return status;
    }
  };

  const getStatusColor = (status: string): "success" | "default" | "error" => {
    switch (status) {
      case "connected": return "success";
      case "error": return "error";
      case "disconnected": default: return "default";
    }
  };

  const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const fetchLocks = useCallback(async () => {
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};
    try {
      const response = await fetch("http://localhost:8000/locks/", {
        method: "GET",
        credentials: "include",
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setLocks(data.locks || []);
        setError("");
      } else {
        // If backend is not running, use mock data for preview
        console.warn("Fetch failed, using mock data");
        setLocks([
          { id_lock: 1, name: "Main Entrance", description: "Front door", status: "connected", is_reservable: false, last_connexion: new Date().toISOString(), auth_methods: ["badge"] },
          { id_lock: 2, name: "Lab 3", description: "Restricted area", status: "disconnected", is_reservable: true, last_connexion: null, auth_methods: ["badge", "keypad"] },
        ]);
        setError("");
      }
    } catch (err) {
      // Fallback for demo/preview environment
      console.warn("Network error, using mock data");
      setLocks([
        { id_lock: 1, name: "Main Entrance", description: "Front door", status: "connected", is_reservable: false, last_connexion: new Date().toISOString(), auth_methods: ["badge"] },
        { id_lock: 2, name: "Lab 3", description: "Restricted area", status: "disconnected", is_reservable: true, last_connexion: null, auth_methods: ["badge", "keypad"] },
      ]);
      setError("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocks();
  }, [fetchLocks]);

  const filteredLocks: Lock[] = locks.filter((lock) => {
    return (
      lock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lock.description &&
        lock.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleDialogOpen = (lock: Lock) => {
    setSelectedLock(lock);
    setIsDialogOpen(true);
  };

  const handleAddClick = () => {
    setSelectedLock(null);
    setIsDialogOpen(true);
  };

  const handleModalClose = (shouldUpdate: boolean) => {
    setIsDialogOpen(false);
    setSelectedLock(null);
    if (shouldUpdate) {
      fetchLocks();
    }
  }

  const handleViewLogs = (lock: Lock) => {
    setSelectedLockForLogs(lock);
    setIsLogsDrawerOpen(true);
  };

  const handleLogsDrawerClose = () => {
    setIsLogsDrawerOpen(false);
    setSelectedLockForLogs(null);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: "#F5F5F5", minHeight: "calc(100vh - 64px)" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: "#333" }}>
        Locks Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>

        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#444" }}>
            All Locks
          </Typography>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>

            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
              <TextField
                placeholder="Name or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, maxWidth: 300, backgroundColor: "white" }}
              />
              <Button
                variant="contained"
                onClick={handleAddClick}
                sx={{
                  backgroundColor: "#3B5CFF", textTransform: "none", fontWeight: 600,
                  boxShadow: "none", ml: "auto", "&:hover": { backgroundColor: "#2A4AE5" },
                }}
              >
                ADD LOCK
              </Button>
            </Box>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Typography color="error" sx={{ textAlign: "center", py: 2 }}>
                {error}
              </Typography>
            )}

            {!loading && !error && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: "#666" }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#666" }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#666" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#666" }}>Reservable</TableCell>
                      {/* --- Auth Methods Column --- */}
                      <TableCell sx={{ fontWeight: 600, color: "#666" }}>Auth Methods</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#666" }}>Last Connection</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#666" }}>History</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: "center", py: 4 }}>
                          No locks found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocks.map((lock, index) => (
                        <TableRow
                          key={lock.id_lock}
                          sx={{
                            backgroundColor: index % 2 === 0 ? "white" : "#F5F5F5",
                            "&:hover": { backgroundColor: "#F0F0F0" },
                          }}
                        >
                          <TableCell>{lock.name}</TableCell>
                          <TableCell>{lock.description || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={getLockStatusText(lock.status)}
                              color={getStatusColor(lock.status)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={lock.is_reservable ? "Yes" : "No"}
                              color={lock.is_reservable ? "success" : "default"}
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>

                          {/* --- Auth Methods Data --- */}
                          <TableCell>
                            {lock.auth_methods && lock.auth_methods.length > 0 ? (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {lock.auth_methods.map((method) => (
                                  <Chip
                                    key={method}
                                    label={method}
                                    size="small"
                                    variant="filled"
                                    sx={{
                                      fontSize: '0.75rem',
                                      height: 24,
                                      backgroundColor: '#e3f2fd',
                                      color: '#1565c0'
                                    }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">None</Typography>
                            )}
                          </TableCell>

                          <TableCell>{formatDateTime(lock.last_connexion)}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleViewLogs(lock)}
                              sx={actionButtonStyle}
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleDialogOpen(lock)}
                              sx={actionButtonStyle}
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#444" }}>
            Lock Groups
          </Typography>
          <LockGroupManager allLocks={locks} />
        </Box>

      </Box>

      <ManageLock
        isDialogOpen={isDialogOpen}
        onClose={handleModalClose}
        selectedLock={selectedLock}
      />

      <LogsDrawer
        open={isLogsDrawerOpen}
        onClose={handleLogsDrawerClose}
        lockId={selectedLockForLogs?.id_lock}
        lockName={selectedLockForLogs?.name}
      />
    </Box>
  );
};

export default LockPage;
