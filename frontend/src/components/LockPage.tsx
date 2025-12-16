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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  FormControlLabel,
  Switch,
  ListItemText,
  Checkbox,
  SelectChangeEvent,
  Tooltip
} from "@mui/material";
import KeyIcon from '@mui/icons-material/Key';

// --- Imports Icones Batterie ---
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import Battery80Icon from '@mui/icons-material/Battery80';
import Battery50Icon from '@mui/icons-material/Battery50';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';

// --- Imports internes ---
import getCookie from "../context/getCookie";
import LockGroupManager from "./GroupsLock/LockGroupManager";
import LogsDrawer from "./LogsDrawer";
import CustomSnackbar from "./CustomSnackbar";

// --- Interfaces ---
interface BatteryLevel {
  voltage: number;
  current: number;
  timestamp: string;
  bars: number;          // 0 à 4
  percent_approx: number; // 0 à 100
}

interface Lock {
  id_lock: number;
  name: string;
  description: string | null;
  status: string;
  is_reservable: boolean;
  last_connexion: string | null;
  auth_methods?: string[];
  remote_address?: string | null;
  battery_level?: BatteryLevel | null;
}

// --- ManageLock Component (Inline) ---

const AUTH_OPTIONS = [
  { value: 'badge', label: 'Badge' },
  { value: 'keypad', label: 'Keypad' },
];

interface ManageLockProps {
  isDialogOpen: boolean;
  onClose: (shouldUpdate: boolean) => void;
  selectedLock: Lock | null;
}

const ManageLock: React.FC<ManageLockProps> = ({ isDialogOpen, onClose, selectedLock }) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isReservable, setIsReservable] = useState<boolean>(false);
  const [authMethods, setAuthMethods] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const isEditMode = selectedLock !== null;

  useEffect(() => {
    if (isDialogOpen) {
      if (isEditMode && selectedLock) {
        setName(selectedLock.name);
        setDescription(selectedLock.description || '');
        setIsReservable(selectedLock.is_reservable || false);
        setAuthMethods(selectedLock.auth_methods || []);
      } else {
        setName('');
        setDescription('');
        setIsReservable(false);
        setAuthMethods([]);
      }
      setError('');
    }
  }, [selectedLock, isEditMode, isDialogOpen]);

  const handleAuthMethodsChange = (event: SelectChangeEvent<typeof authMethods>) => {
    const { target: { value } } = event;
    setAuthMethods(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    const csrfToken = getCookie("csrftoken");
    const method = isEditMode ? 'PUT' : 'POST';
    const url = `${process.env.REACT_APP_BACKEND_URL}/locks/`;

    let bodyData: any = {
      name,
      description,
      is_reservable: isReservable,
      auth_methods: authMethods
    };

    if (isEditMode && selectedLock) {
      bodyData.id_lock = selectedLock.id_lock;
    }

    try {
      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        onClose(true);
      } else {
        const data = await response.json();
        const errorMessage = data.auth_methods
          ? `Auth Methods: ${data.auth_methods.join(', ')}`
          : (data.error || 'Error saving lock');
        setError(errorMessage);
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !selectedLock) return;
    if (!window.confirm(`Are you sure you want to delete the lock "${selectedLock.name}"?`)) {
      return;
    }
    setIsLoading(true);
    try {
      const csrfToken = getCookie("csrftoken");
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({ id_lock: selectedLock.id_lock }),
      });
      if (response.ok) {
        onClose(true);
      } else {
        setError("Error deleting lock.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onClose={() => onClose(false)}
      fullWidth
      maxWidth="xs"
      aria-labelledby="manage-lock-title"
    >
      <DialogTitle id="manage-lock-title">
        {isEditMode ? 'Manage Lock' : 'Add Lock'}
      </DialogTitle>

      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Lock Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            inputProps={{ "aria-required": "true" }}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="auth-methods-label">Auth Methods</InputLabel>
            <Select
              labelId="auth-methods-label"
              multiple
              value={authMethods}
              onChange={handleAuthMethodsChange}
              input={<OutlinedInput label="Auth Methods" />}
              renderValue={(selected: string[]) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              disabled={isLoading}
            >
              {AUTH_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={authMethods.indexOf(option.value) > -1} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={isReservable}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsReservable(e.target.checked)}
                color="primary"
                disabled={isLoading}
                inputProps={{ 'aria-label': 'Enable reservation for this lock' }}
              />
            }
            label="Reservable (Can be booked)"
            sx={{ mt: 1 }}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }} role="alert">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        {isEditMode ? (
          <Button onClick={handleDelete} color="error" disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        ) : <Box />}
        <Box>
          <Button onClick={() => onClose(false)} sx={{ mr: 1 }}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isLoading}
            sx={{ backgroundColor: "#2A4AE5", '&:hover': { backgroundColor: "#1A3AC0" } }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// --- Main LockPage Component ---

interface LockPageProps {
  onNavigate?: (page: string) => void;
  onEditSchematic?: (schematicId: number) => void;
}

const actionButtonStyle = {
  color: "#2A4AE5",
  textTransform: "none" as const,
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

  const [openingLockId, setOpeningLockId] = useState<number | null>(null);

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSnackbarError, setIsSnackbarError] = useState(false);

  const getRelativeTime = (isoString: string | undefined | null): string => {
    if (!isoString) return 'Never';

    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Just now';

    if (diffInSeconds < 60) return `${diffInSeconds} sec`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} d`;
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

  // --- FONCTION D'AFFICHAGE BATTERIE AVEC LOGIQUE DE TIMEOUT ---
  const renderBatteryStatus = (lock: Lock) => {
    if (!lock.battery_level) {
      return (
        <Tooltip title="No battery data received">
          <Chip
            icon={<BatteryUnknownIcon />}
            label="Unknown"
            size="small"
            variant="outlined"
            color="default"
          />
        </Tooltip>
      );
    }

    const { bars, voltage, percent_approx, timestamp } = lock.battery_level;
    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

    if (diffInSeconds > 1800) {
      return (
        <Tooltip title={`Connection lost! Last update: ${lastUpdate.toLocaleTimeString()} (${percent_approx}%)`}>
          <Chip
            icon={<BatteryUnknownIcon />}
            label="Unknown"
            size="small"
            variant="outlined"
            color="default"
            sx={{ borderColor: '#ccc', color: '#666' }}
          />
        </Tooltip>
      );
    }

    let Icon = BatteryUnknownIcon;
    let color: "success" | "warning" | "error" | "default" = "default";

    switch (bars) {
      case 4:
        Icon = BatteryFullIcon;
        color = "success";
        break;
      case 3:
        Icon = Battery80Icon;
        color = "success";
        break;
      case 2:
        Icon = Battery50Icon;
        color = "warning";
        break;
      case 1:
        Icon = Battery20Icon;
        color = "error";
        break;
      case 0:
        Icon = BatteryAlertIcon;
        color = "error";
        break;
      default:
        Icon = BatteryUnknownIcon;
    }

    return (
      <Tooltip title={`Voltage: ${voltage}V (~${percent_approx}%)`}>
        <Chip
          icon={<Icon />}
          label={`${percent_approx}%`}
          size="small"
          color={color}
          sx={{ fontWeight: 600 }}
        />
      </Tooltip>
    );
  };

  const fetchLocks = useCallback(async () => {
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/`, {
        method: "GET",
        credentials: "include",
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setLocks(data.locks || []);
        setError("");
      } else {
        setError("Error fetching locks");
      }
    } catch (err) {
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbarMessage("");
  };

  const handleRemoteOpen = async (lock: Lock) => {
    if (!lock.remote_address) return;
    setOpeningLockId(lock.id_lock);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/locks/${lock.id_lock}/remote-open/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
      });

      if (response.ok) {
        setSnackbarMessage(`Signal sent to lock ${lock.name} (${lock.remote_address})`);
        setIsSnackbarError(false);
      } else {
        const data = await response.json();
        setSnackbarMessage(`Error: ${data.error || "Failed to open"}`);
        setIsSnackbarError(true);
      }
    } catch (err) {
      setSnackbarMessage("Connection error");
      setIsSnackbarError(true);
    } finally {
      setOpeningLockId(null);
    }
  };

  useEffect(() => {
    fetchLocks();

    const timer = setInterval(() => {
      setLocks(currentLocks => [...currentLocks]);
    }, 10000);

    return () => clearInterval(timer);
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
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 700, mb: 3, color: "#333" }}
      >
        Locks Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>

        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2, color: "#444" }}>
            All Locks
          </Typography>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>

            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
              <TextField
                placeholder="Name or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                inputProps={{ "aria-label": "Search locks" }}
                sx={{ flexGrow: 1, maxWidth: 300, backgroundColor: "white" }}
              />
              <Button
                variant="contained"
                onClick={handleAddClick}
                sx={{
                  backgroundColor: "#2A4AE5",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  ml: "auto",
                  "&:hover": { backgroundColor: "#1A3AC0" },
                }}
              >
                ADD LOCK
              </Button>
            </Box>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress aria-label="Loading locks" />
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
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>ID</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>Name</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>Description</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>Battery</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>Reservable</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>Auth Methods</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>Last Connection</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>History</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 600, color: "#444" }}>Remote</TableCell>
                      <TableCell scope="col" aria-label="Actions"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} sx={{ textAlign: "center", py: 4 }}>
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
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              #{lock.id_lock}
                            </Typography>
                          </TableCell>

                          <TableCell component="th" scope="row">{lock.name}</TableCell>
                          <TableCell>{lock.description || 'N/A'}</TableCell>

                          {/* --- AFFICHAGE BATTERIE --- */}
                          <TableCell>
                            {renderBatteryStatus(lock)}
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

                          <TableCell>
                            {lock.auth_methods && lock.auth_methods.length > 0 ? (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {lock.auth_methods.map((method) => (
                                  <Chip
                                    key={method}
                                    label={method.charAt(0).toUpperCase() + method.slice(1)}
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

                          <TableCell>
                            <Tooltip
                              title={
                                lock.battery_level?.timestamp
                                  ? new Date(lock.battery_level.timestamp).toLocaleString()
                                  : (lock.last_connexion ? new Date(lock.last_connexion).toLocaleString() : "No data")
                              }
                            >
                              <Typography
                                variant="body2"
                                color={!lock.battery_level?.timestamp ? "text.disabled" : "text.primary"}
                              >
                                {getRelativeTime(lock.battery_level?.timestamp || lock.last_connexion)}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleViewLogs(lock)}
                              aria-label={`View history for ${lock.name}`}
                              sx={actionButtonStyle}
                            >
                              View
                            </Button>
                          </TableCell>

                          <TableCell>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              disabled={!lock.remote_address || openingLockId === lock.id_lock}
                              onClick={() => handleRemoteOpen(lock)}
                              startIcon={openingLockId === lock.id_lock ? <CircularProgress size={16} /> : <KeyIcon />}
                              sx={{
                                minWidth: '40px',
                                padding: '4px 10px',
                                textTransform: 'none'
                              }}
                            >
                              {lock.remote_address ? "Open" : "No IP"}
                            </Button>
                          </TableCell>

                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => handleDialogOpen(lock)}
                              aria-label={`Manage lock ${lock.name}`}
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
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2, color: "#444" }}>
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

      <CustomSnackbar
        isError={isSnackbarError}
        text={snackbarMessage}
        onClose={handleCloseSnackbar}
      />

    </Box >
  );
};

export default LockPage;
