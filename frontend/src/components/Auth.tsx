import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/wlogin/`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.error) {
      console.log("Erreur:", data.error);
    } else if (data.message) {
      console.log("Succès:", data.message);
      window.location.reload();
    }
  };

  return (
    <div className="w-4/5 flex mx-auto">
      <form>
        <TextField
          name="username"
          label="Nom d'utilisateur"
          value={username}
          onChange={(e) => { setUsername(e.target.value); }}
          required
        />

        <TextField
          name="password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); }}
          required
        />

        <Button type="submit" onClick={login}>
          Connexion
        </Button>
      </form>

      <img className="w-100" src="hero.png" alt="Homme satisfait de son utilisation du produit Lares" />
    </div>
  );
};

export default Auth;
