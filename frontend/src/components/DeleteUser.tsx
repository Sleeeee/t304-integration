import React, { useState } from "react";
import { IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDeleteDialog from "./GroupsUser/ConfirmDeleteDialog";
import getCookie from "../context/getCookie";

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface DeleteUserProps {
  selectedUser: User | null;
  onUserDeleted: () => void;
  refresh: any;
  snackbar: any;
  setSnackbar: any;
}

function DeleteUser({ selectedUser, onUserDeleted, refresh, snackbar, setSnackbar }: DeleteUserProps): React.ReactElement | null {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!selectedUser) return null;

  const handleOpen = () => {
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    if (!isDeleting) setIsDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const csrfToken = getCookie("csrftoken"); // Utilisation du helper partagé

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        credentials: "include",
        body: JSON.stringify({ user_id: selectedUser.id }),
      });

      const data = await response.json();

      if (data.error) {
        setSnackbar({ isError: true, text: data.error })
      } else {
        setSnackbar({ isError: false, text: `${selectedUser.username} has been deleted` })
        onUserDeleted();
        setIsDialogOpen(false);
        refresh(true)
      }
    } catch (error) {
      setSnackbar({ isError: true, text: "Server connection error" })
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        disabled={!selectedUser || isDeleting}
        color="error"
        size="small"
        // ACCESSIBILITÉ: Label dynamique pour savoir QUI on supprime
        aria-label={`Delete user ${selectedUser.username}`}
      >
        <DeleteIcon />
      </IconButton>

      <ConfirmDeleteDialog
        open={isDialogOpen}
        onClose={handleClose}
        onConfirm={handleConfirmDelete}
        title="Confirm User Deletion"
        message={
          isDeleting
            ? "Deleting user..."
            : `Are you sure you want to delete "${selectedUser.username}"? This action cannot be undone.`
        }
      />
    </>
  );
}

export default DeleteUser;
