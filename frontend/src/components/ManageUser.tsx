import React, { useState, useEffect, ChangeEvent } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
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
	switch(role) {
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

  // Désaffiche le forme en overlay et remet l'id de l'utilisateur sélectionné a null
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser("none");	
	formData.current_password = "";
  }

  // Gère l'envoie du formulaire de gestion d'utilisateur
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

	const rolePermissions = getRolePermissions(selectedRole);
	
	console.log(JSON.stringify({user_id: selectedUser.id, ...formData, ...rolePermissions}))

	try {
		const response = await fetch("http://localhost:8000/users/", {
			method: "PATCH",
			headers,
			credentials: "include",
			body: JSON.stringify({
				user_id: selectedUser.id,
				...formData,
				...rolePermissions
			})
		});
		const data = await response.json();
		if(data.error) {
			setSnackbar({isError: true, text: data.error})
		} else {
			setSnackbar({isError: false, text: "User updated successfully"})
			refresh(true);
			handleDialogClose()
		}
	} catch (error) {
		setSnackbar({isError: true, text: error})
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
	}
  }, [isDialogOpen]);


  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleDialogClose}
      fullWidth={true}
      maxWidth="sm"
    >
	  <DialogContent>
		<DialogActions>
		  <Button
			size="small"
			onClick={() => handleDialogClose()}
			variant="contained"
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
			<CloseIcon />
		  </Button>
		</DialogActions>
		<form onSubmit={handleSubmit}>
			<fieldset className="border-2 border-gray-300 rounded-2xl p-6">
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
				/>
			  </div>
			</fieldset>
		  <fieldset className="border-2 border-gray-300 rounded-2xl p-6">
			<legend className="px-4 text-xl font-bold text-gray-800">
				Role
			</legend>

			<div className="flex flex-col gap-3 mt-4">
				{roles.map((role) => (
				  <div
					key={role.value}
					className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
					  selectedRole === role.value
						? "bg-blue-100 border-2 border-blue-500"
						: "bg-gray-50 hover:bg-blue-50 border-2 border-transparent"
					}`}
					onClick={() => handleRoleChange(role.value)}
				  > 
					<input
					  type="radio"
					  checked={selectedRole === role.value}
					  onChange={() => handleRoleChange(role.value)}
					  className="w-6 h-6 cursor-pointer accent-blue-600 mt-1"
					/>
					<div className="flex flex-col">
					  <span className="font-bold text-gray-800">{role.label}</span>
					  <span className="text-sm text-gray-600">{role.description}</span>
					</div>
				  </div>
				))}
			  </div>
			</fieldset>
		  <DialogActions>
			<Button
			  type="submit"
			>
			  Submit
			</Button>
		  </DialogActions>
		</form>
	  </DialogContent>
    </Dialog>
  )
}

export default ManageUser;
