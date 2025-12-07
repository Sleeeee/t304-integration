import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CustomSnackbar from "./CustomSnackbar";

// Couleur contrastée et cohérente avec le reste du site
const ACCESSIBLE_BLUE = "#2A4AE5";

const Auth = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [snackbar, setSnackbar] = useState({
        isError: false,
        text: "",
    });

    const login = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/auth/wlogin/`, {
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
        } catch (err) {
            setSnackbar({ isError: true, text: "Connection error" });
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <CustomSnackbar
                isError={snackbar?.isError}
                text={snackbar?.text}
                onClose={() => { setSnackbar({ isError: snackbar?.isError || false, text: "" }); }}
            />

            {/* ACCESSIBILITÉ: <main> identifie le contenu principal */}
            <main className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-10">
                <h1 
                    className="text-3xl sm:text-4xl font-bold mb-4"
                    style={{ color: ACCESSIBLE_BLUE }}
                >
                    LARES
                </h1>
                <p 
                    className="text-lg sm:text-xl font-semibold mb-2"
                    style={{ color: ACCESSIBLE_BLUE }}
                >
                    Smart Access Management
                </p>
                <p 
                    className="text-sm sm:text-md font-medium mb-8"
                    style={{ color: ACCESSIBLE_BLUE }}
                >
                    Powered by Connected Lock Technology
                </p>

                <form onSubmit={login} className="flex flex-col gap-6 w-full max-w-sm" noValidate>
                    <TextField
                        id="username"
                        label="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        required
                        // ACCESSIBILITÉ
                        inputProps={{ "aria-required": "true" }}
                    />

                    <TextField
                        id="password"
                        label="Password"
                        type="password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        required
                        inputProps={{ "aria-required": "true" }}
                    />

                    <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth
                        size="large"
                        sx={{
                            backgroundColor: ACCESSIBLE_BLUE,
                            fontWeight: 'bold',
                            py: 1.5,
                            "&:hover": {
                                backgroundColor: "#1A3AC0",
                            },
                        }}
                    >
                        Log In
                    </Button>
                </form>
            </main>

            {/* Section décorative (cachée aux lecteurs d'écran si purement déco, ou alt text explicite) */}
            <div className="w-full lg:w-1/2 bg-blue-50 flex items-center justify-center p-6 sm:p-10">
                <img
                    src="hero.png"
                    alt="Illustration of a satisfied client using smart access" // Alt text descriptif
                    className="w-full max-w-xs sm:max-w-md"
                />
            </div>
        </div>
    );
};

export default Auth;