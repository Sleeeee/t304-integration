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
  timestamp: string;
  method: string;
  user: string | null; 
  failed_code: string | null;
  lock_id: number;
  lock_name: string; 
  result: "success" | "failed"; 
}

interface LogsViewerProps {
  lockId?: number;
  userId?: number;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ lockId, userId }) => {
  const [logs, setLogs] = useState<ScanLog[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchLogs = useCallback(async () => {
    try {
      let url = "http://localhost:8000/logs/accesslogs/";
      
      const params = new URLSearchParams();
      
      if (lockId) {
        params.append("lock_id", lockId.toString());
      }
      if (userId) {
        params.append("user_id", userId.toString());
      }

      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des logs");
      }

      const data = await response.json();
      
      setLogs(Array.isArray(data) ? data : (data.logs || []));
      setError("");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [lockId, userId]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);


  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Date Invalide"; 
    }
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
          {logs.map((log, index) => {
            const isSuccess = log.result === "success";
            
            return (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 1,
                    p: 2,
                    border: "1px solid #E0E0E0",
                    borderLeft: `4px solid ${isSuccess ? "#4CAF50" : "#F44336"}`,
                    "&:hover": {
                      backgroundColor: "#F5F7FF",
                    },
                  }}
                >
                  <Stack spacing={1.5}>
                    {/* Status */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {isSuccess ? (
                        <CheckCircleIcon sx={{ color: "#4CAF50", fontSize: 20 }} />
                      ) : (
                        <CancelIcon sx={{ color: "#F44336", fontSize: 20 }} />
                      )}
                      <Chip
                        label={isSuccess ? "Success" : "Error"}
                        size="small"
                        sx={{
                          backgroundColor: isSuccess ? "#E8F5E9" : "#FFEBEE",
                          color: isSuccess ? "#2E7D32" : "#C62828",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    
                    {!isSuccess && log.failed_code && log.failed_code !== "" && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CancelIcon sx={{ color: "#F44336", fontSize: 18 }} />
                        <Typography variant="body2" color="text.primary">
                          <strong>Code d'échec:</strong> {log.failed_code}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PersonIcon sx={{ color: "#3B5CFF", fontSize: 18 }} />
                      <Typography variant="body2" color="text.primary">
                        <strong>Utilisateur:</strong> {log.user || "Inconnu"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LockIcon sx={{ color: "#666", fontSize: 18 }} />
                      <Typography variant="body2" color="text.primary">
                        <strong>Serrure:</strong> {log.lock_name || `ID: ${log.lock_id}`}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTimeIcon sx={{ color: "#999", fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(log.timestamp)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default LogsViewer;