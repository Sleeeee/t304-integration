import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePermissionToggle = (value) => {
    setPermissions(prev => 
      prev.includes(value) 
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          permissions: permissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Inscription réussie !" });
        // Réinitialiser le formulaire
        setFormData({ username: "", email: "", password: "" });
        setPermissions([]);
      } else {
        setMessage({ type: "error", text: data.detail || "Erreur lors de l'inscription" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur de connexion au serveur" });
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Messages d'alerte */}
        {message.text && (
          <Alert severity={message.type} onClose={() => setMessage({ type: "", text: "" })}>
            {message.text}
          </Alert>
        )}

        {/* Formulaire d'enregistrement */}
        <fieldset className="border-2 border-gray-300 rounded-2xl p-6">
          <legend className="px-4 text-xl font-bold text-gray-800">
            Enregistrement
          </legend>

          <div className="flex flex-col gap-4 mt-4">
            <TextField
              label="Nom d'utilisateur"
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
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              variant="outlined"
              fullWidth
              required
            />
          </div>
        </fieldset>

        {/* Permissions */}
        <fieldset className="border-2 border-gray-300 rounded-2xl p-6">
          <legend className="px-4 text-xl font-bold text-gray-800">
            Permissions
          </legend>

          <div className="flex flex-col gap-3 mt-4">
            {["Lecture", "Écriture", "Modification", "Suppression"].map((label, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-all"
                onClick={() => handlePermissionToggle(index)}
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(index)}
                  onChange={() => {}}
                  className="w-6 h-6 cursor-pointer accent-blue-600"
                />
                <span className="font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Bouton d'envoi */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          className="!py-4 !text-lg !font-bold !rounded-2xl"
        >
          {loading ? "Inscription en cours..." : "S'INSCRIRE"}
        </Button>
      </form>
    </div>
  );
}

export default Register;
