import React from "react";
import getCookie from "../context/getCookie";
import Button from "@mui/material/Button";

const Header = () => {
  const logout = async () => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/wlogout/`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
    window.location.reload(); // Force la page à recharger et à récupérer l'état de la session
  };

  return (
    <div>
      <Button onClick={logout}>
        Déconnexion
      </Button>
    </div>
  );
}

export default Header;
