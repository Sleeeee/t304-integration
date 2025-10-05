import React from "react";
import getCookie from "../context/getCookie";
import Button from "@mui/material/Button";

const Header = () => {
  const csrfToken = getCookie("csrftoken");

  const headers: HeadersInit = csrfToken
    ? { "X-CSRFToken": csrfToken }
    : {};

  const logout = async () => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/wlogout/`, {
      method: "POST",
      credentials: "include",
      headers,
    });
    window.location.reload(); // Force la page à recharger et à récupérer l'état de la session
  };

  return (
    <div className="flex justify-end bg-white p-4">
      <Button
        variant="contained"
        onClick={logout}
      >
        Déconnexion
      </Button>
    </div>
  );
}

export default Header;
