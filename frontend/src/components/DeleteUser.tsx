import React, { useState } from "react";
import {
	IconButton,
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete'; 
import ConfirmDeleteDialog from "./GroupsUser/ConfirmDeleteDialog";

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

function getCSRFToken(): string {
  const cookie = document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="));
  return cookie ? cookie.split("=")[1] : "";
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

    try {
      const response = await fetch("http://localhost:8000/users/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        credentials: "include",
        body: JSON.stringify({ user_id: selectedUser.id }),
      });

      const data = await response.json();

      if (data.error) {
		  setSnackbar({isError: true, text: data.error})
      } else {
			setSnackbar({isError: false, text: `${selectedUser.username} as been deleted`})
        	onUserDeleted();
        	setIsDialogOpen(false);
			refresh(true)
      }
    } catch (error) {
		setSnackbar({isError: true, text: error})
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        disabled={!selectedUser}
		color="error"
		size="small"
		aria-label="delete user"
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
