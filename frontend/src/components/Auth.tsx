import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CustomSnackbar from "./CustomSnackbar";

const Auth = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const [snackbar, setSnackbar] = useState({
		isError: false,
		text: "",
	});

	const login = async (e: React.FormEvent) => {
		e.preventDefault();
		const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/wlogin/`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		const data = await res.json();
		if (data.error) {
			setSnackbar({ isError: true, text: data.error });
		} else if (data.message) {
			setSnackbar({ isError: false, text: data.message });
			setTimeout(() => {
				window.location.reload();
			}, 500);
		}
	};

	return (
		<div className="flex flex-col md:flex-row min-h-screen">
			<CustomSnackbar
				isError={snackbar?.isError}
				text={snackbar?.text}
				onClose={() => { setSnackbar({ isError: snackbar?.isError || false, text: "" }); }}
			/>

			<div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-10">
				<h1 className="text-3xl sm:text-4xl font-bold text-blue-700 mb-4">
					LARES
				</h1>
				<p className="text-lg sm:text-xl font-semibold text-blue-700 mb-2">
					Smart Access Management
				</p>
				<p className="text-sm sm:text-md font-medium text-blue-700 mb-8">
					Powered by Connected Lock Technology
				</p>

				<form onSubmit={login} className="flex flex-col gap-6 w-full max-w-sm">
					<TextField
						label="Username"
						variant="outlined"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						fullWidth
						required
					/>

					<TextField
						label="Password"
						type="password"
						variant="outlined"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						fullWidth
						required
					/>

					<Button type="submit" variant="contained" color="primary" fullWidth>
						Log In
					</Button>
				</form>
			</div>

			<div className="w-full lg:w-1/2 bg-blue-50 flex items-center justify-center p-6 sm:p-10">
				<img
					src="hero.png"
					alt="A deeply satisfied client"
					className="w-full max-w-xs sm:max-w-md"
				/>
			</div>
		</div>
	);
};

export default Auth;

