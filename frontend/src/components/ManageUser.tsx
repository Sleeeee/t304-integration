import React, { useState, useEffect, ChangeEvent } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle, // Ajouté pour l'accessibilité (titre de la modale)
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { Key, KeyOff, Badge } from '@mui/icons-material';
import getCookie from "../context/getCookie";

type ManageUserProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedUser: any;
  setSelectedUser: React.Dispatch<React.SetStateAction<any>>
  snackbar: any;
  setSnackbar: any;
  refresh: any;
};

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  has_keypad_code?: boolean;
  has_badge_code?: boolean;
}

type UserRole = "user" | "moderator" | "admin";

function ManageUser({ isDialogOpen, setIsDialogOpen, selectedUser, setSelectedUser, snackbar, setSnackbar, refresh }: ManageUserProps) {

  const getUserRole = (user: User): UserRole => {
    if (user.is_superuser && user.is_staff) {
      return "admin" as UserRole;
    } else if (user.is_staff) {
      return "moderator" as UserRole;
    } else {
      return "user" as UserRole;
    }
  };

  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [generateKeypad, setGenerateKeypad] = useState(false);
  const [generateBadge, setGenerateBadge] = useState(false);

  const csrfToken = getCookie("csrftoken");
  const headers: HeadersInit = csrfToken
    ? {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken
    }
    : {};

  const [formData, setFormData] = useState({
    username: "",
    current_password: "",
  });

  const getRolePermissions = (role: UserRole) => {
    switch (role) {
      case "user":
        return { is_superuser: false, is_staff: false };
      case "moderator":
        return { is_superuser: false, is_staff: true };
      case "admin":
        return { is_superuser: true, is_staff: true };
      default:
        return { is_superuser: false, is_staff: false };
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };

  const roles = [
    {
      value: "user" as UserRole,
      label: "User",
      description: "No administrative privileges"
    },
    {
      value: "moderator" as UserRole,
      label: "Moderator",
      description: "Can view user information"
    },
    {
      value: "admin" as UserRole,
      label: "Administrator",
      description: "Full administrative privileges"
    }
  ];

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser("none");
    formData.current_password = "";
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const rolePermissions = getRolePermissions(selectedRole);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({
          user_id: selectedUser.id,
          ...formData,
          ...rolePermissions,
          keypad: generateKeypad,
          badge: generateBadge
        })
      });
      const data = await response.json();
      if (data.error) {
        setSnackbar({ isError: true, text: data.error })
      } else {
        setSnackbar({ isError: false, text: data.message })
        refresh(true);
        handleDialogClose()
      }
    } catch (error) {
      setSnackbar({ isError: true, text: error })
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    if (isDialogOpen) {
      setSelectedRole(getUserRole(selectedUser))
      setFormData({
        ...formData,
        username: selectedUser.username
      });
      setGenerateKeypad(false);
      setGenerateBadge(false);
    }
  }, [isDialogOpen]);


  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleDialogClose}
      fullWidth={true}
      maxWidth="sm"
      // ACCESSIBILITÉ: Liens ARIA pour la modale
      aria-labelledby="manage-user-title"
    >
      {/* ACCESSIBILITÉ: Titre visible qui sera lu à l'ouverture */}
      <DialogTitle id="manage-user-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Manage User: {selectedUser?.username}
        <IconButton
          onClick={() => handleDialogClose()}
          // ACCESSIBILITÉ: Label explicite pour le bouton fermer
          aria-label="Close dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <form onSubmit={handleSubmit}>

          <fieldset className="border-2 border-gray-300 rounded-2xl p-6 mb-6">
            <legend className="px-4 text-xl font-bold text-gray-800">
              Informations
            </legend>

            <div className="flex flex-col gap-4 mt-4">
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
                required
                // ACCESSIBILITÉ
                inputProps={{ "aria-required": "true" }}
              />

              <TextField
                label="Current password"
                name="current_password"
                type="password"
                value={formData.current_password}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
                required
                inputProps={{ "aria-required": "true" }}
              />

              {/* Keypad Management Row - Accessible */}
              <div
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${selectedUser.has_keypad_code
                  ? "bg-blue-50 border-blue-100"
                  : "bg-gray-50 border-gray-200"
                  }`}
              // Pour que la div entière ne soit pas lue bizarrement, on laisse les contrôles internes gérer le focus
              >
                <div className="flex items-center gap-3">
                  {selectedUser.has_keypad_code ? (
                    <Key className="text-blue-500" aria-hidden="true" />
                  ) : (
                    <KeyOff className="text-gray-400" aria-hidden="true" />
                  )}
                  <span className={`font-medium ${selectedUser.has_keypad_code ? "text-blue-900" : "text-gray-600"}`}>
                    {selectedUser.has_keypad_code ? "Keypad code set up" : "No existing keypad code"}
                  </span>
                </div>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateKeypad}
                      onChange={(e) => setGenerateKeypad(e.target.checked)}
                      sx={{
                        '&.Mui-checked': { color: "#2A4AE5" }, // Bleu contrasté
                      }}
                      // ACCESSIBILITÉ: Label explicite pour le lecteur d'écran
                      inputProps={{ 'aria-label': selectedUser.has_keypad_code ? "Regenerate keypad code" : "Generate keypad code" }}
                    />
                  }
                  label={
                    <span className="text-sm font-bold text-gray-700">
                      {selectedUser.has_keypad_code ? "Regenerate" : "Generate"}
                    </span>
                  }
                />
              </div>

              {/* Badge Management Row - Accessible */}
              <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${selectedUser.has_badge_code
                ? "bg-blue-50 border-blue-100"
                : "bg-gray-50 border-gray-200"
                }`}>
                <div className="flex items-center gap-3">
                  <Badge className={selectedUser.has_badge_code ? "text-blue-500" : "text-gray-400"} aria-hidden="true" />
                  <span className={`font-medium ${selectedUser.has_badge_code ? "text-blue-900" : "text-gray-600"}`}>
                    {selectedUser.has_badge_code ? "Badge code set up" : "No existing badge code"}
                  </span>
                </div>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateBadge}
                      onChange={(e) => setGenerateBadge(e.target.checked)}
                      sx={{
                        '&.Mui-checked': { color: "#2A4AE5" }, // Bleu contrasté
                      }}
                      inputProps={{ 'aria-label': selectedUser.has_badge_code ? "Regenerate badge code" : "Generate badge code" }}
                    />
                  }
                  label={
                    <span className="text-sm font-bold text-gray-700">
                      {selectedUser.has_badge_code ? "Regenerate" : "Generate"}
                    </span>
                  }
                />
              </div>

            </div>
          </fieldset>

          <fieldset className="border-2 border-gray-300 rounded-2xl p-6">
            <legend className="px-4 text-xl font-bold text-gray-800">
              Role
            </legend>

            {/* ACCESSIBILITÉ: Rôle radiogroup pour regrouper les options */}
            <div className="flex flex-col gap-3 mt-4" role="radiogroup" aria-label="Select user role">
              {roles.map((role) => (
                // ACCESSIBILITÉ: Utilisation de <label> pour rendre toute la zone cliquable
                <label
                  key={role.value}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${selectedRole === role.value
                    ? "bg-blue-100 border-2 border-blue-500"
                    : "bg-gray-50 hover:bg-blue-50 border-2 border-transparent"
                    }`}
                >
                  <input
                    type="radio"
                    name="userRole" // Important pour grouper les radios
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={() => handleRoleChange(role.value)}
                    className="w-6 h-6 cursor-pointer accent-blue-600 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{role.label}</span>
                    <span className="text-sm text-gray-600">{role.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <DialogActions sx={{ pt: 3 }}>
            <Button
              onClick={() => handleDialogClose()}
              color="inherit"
              sx={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "#2A4AE5", // Bleu contrasté
                fontWeight: 600,
                '&:hover': { backgroundColor: "#1A3AC0" }
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ManageUser;
