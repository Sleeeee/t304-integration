import { Alert, Snackbar } from "@mui/material";

interface CustomSnackbarProps {
  isError: boolean;
  text: string;
  onClose: () => void;
}

const CustomSnackbar = ({ isError, text, onClose }: CustomSnackbarProps) => {
  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={text !== ""}
      onClose={onClose}
      // ACCESSIBILITÉ: Permet au message de disparaître tout seul après 6s
      // si l'utilisateur ne peut pas atteindre le bouton fermer.
      autoHideDuration={6000} 
    >
      <Alert
        severity={isError ? "error" : "success"}
        variant="filled"
        sx={{ width: '100%' }}
        onClose={onClose}
        // ACCESSIBILITÉ: 
        // "alert" = interrompt le lecteur (urgent)
        // "status" = attend que l'utilisateur finisse (informatif)
        role={isError ? "alert" : "status"}
      >
        {text}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;