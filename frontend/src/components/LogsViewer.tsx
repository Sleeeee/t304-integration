import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

interface ScanLog {
  id_log: number;
  lock: {
    id_lock: number;
    name: string;
  };
  user: {
    id: number;
    username: string;
  };
  scan_datetime: string;
  success: boolean;
}

interface LogsViewerProps {
  lockId?: number;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ lockId }) => {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchLogs = useCallback(async () => {
    try {
      const url = lockId
        ? `http://localhost:8000/logs/lock/${lockId}/`
        : "http://localhost:8000/logs/";

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error");
      }

      const data = await response.json();
      // Si l'API retourne un objet avec "logs", extraire le tableau
      setLogs(lockId && data.logs ? data.logs : data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown Error");
    } finally {
      setLoading(false);
    }
  }, [lockId]);

  useEffect(() => {
    fetchLogs();
    // Rafraîchir les logs toutes les 5 secondes
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total: {logs.length} log{logs.length > 1 ? "s" : ""}
      </Typography>

      {logs.length === 0 ? (
        <Alert severity="info">Aucun log disponible</Alert>
      ) : (
        <List sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}>
          {logs.map((log, index) => (
            <React.Fragment key={log.id_log}>
              {index > 0 && <Divider />}
              <Paper
                elevation={0}
                sx={{
                  mb: 1,
                  p: 2,
                  border: "1px solid #E0E0E0",
                  borderLeft: `4px solid ${log.success ? "#4CAF50" : "#F44336"}`,
                  "&:hover": {
                    backgroundColor: "#F5F7FF",
                  },
                }}
              >
                <Stack spacing={1.5}>
                  {/* Status */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {log.success ? (
                      <CheckCircleIcon sx={{ color: "#4CAF50", fontSize: 20 }} />
                    ) : (
                      <CancelIcon sx={{ color: "#F44336", fontSize: 20 }} />
                    )}
                    <Chip
                      label={log.success ? "Success" : "Error"}
                      size="small"
                      sx={{
                        backgroundColor: log.success ? "#E8F5E9" : "#FFEBEE",
                        color: log.success ? "#2E7D32" : "#C62828",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* User */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon sx={{ color: "#3B5CFF", fontSize: 18 }} />
                    <Typography variant="body2" color="text.primary">
                      <strong>Utilisateur:</strong> {log.user.username}
                    </Typography>
                  </Box>

                  {/* Lock */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LockIcon sx={{ color: "#666", fontSize: 18 }} />
                    <Typography variant="body2" color="text.primary">
                      <strong>Serrure:</strong> {log.lock.name}
                    </Typography>
                  </Box>

                  {/* DateTime */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon sx={{ color: "#999", fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(log.scan_datetime)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default LogsViewer;
