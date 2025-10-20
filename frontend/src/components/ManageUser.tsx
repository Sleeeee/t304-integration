import React, { useState, useEffect, ChangeEvent } from "react";
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
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import getCookie from "../context/getCookie";

type ManageUserProps = {
		isDialogOpen: boolean;
		setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
		selectedUserId: number | null;
		setSelectedUserId: React.Dispatch<React.SetStateAction<number | null>>
	};

function ManageUser({isDialogOpen, setIsDialogOpen, selectedUserId, setSelectedUserId}: ManageUserProps) {
	
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});


	// Désaffiche le forme en overlay et remet l'id de l'utilisateur sélectionné a null
	const handleDialogClose = () => {
		setIsDialogOpen(false);
		setSelectedUserId(null);
	}

	  // Gère l'envoie du formulaire de gestion d'utilisateur
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log(selectedUserId)
	}

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
 		setFormData({
      		...formData,
     	 	[e.target.name]: e.target.value
    	});
  	};


	return ( 
		<Dialog 
			open={isDialogOpen}
			onClose={handleDialogClose}
			fullWidth = {true}
			maxWidth = "lg"
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
						label="Email"
						name="email"
						type="email"
						value={formData.email}
						onChange={handleInputChange}
						variant="outlined"
						fullWidth
						required
					/>
					<TextField
						label="Password"
						name="password"
						type="password"
						value={formData.password}
						onChange={handleInputChange}
						variant="outlined"
						fullWidth
						required
					/>
					<DialogActions>
						<Button
							type = "submit"
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
