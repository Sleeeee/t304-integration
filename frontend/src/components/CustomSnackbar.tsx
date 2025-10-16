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
    >
      <Alert
        severity={isError ? "error" : "success"}
        variant="filled"
        sx={{ width: '100%' }}
        onClose={onClose}
      >
        {text}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;
