import React, { useState, ChangeEvent, FormEvent } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import getCookie from "../context/getCookie";

type MessageType = "success" | "info" | "warning" | "error" | "";

type UserRole = "user" | "moderator" | "admin";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: MessageType; text: string }>({
    type: "",
    text: ""
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
  };

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

  const csrfToken = getCookie("csrftoken");
  const headers: HeadersInit = csrfToken
    ? {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      }
    : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const rolePermissions = getRolePermissions(selectedRole);

    try {
      const response = await fetch("http://localhost:8000/users/", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          ...rolePermissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "User created successfully!" });
        setFormData({ username: "", email: "", password: "" });
        setSelectedRole("user");
      } else {
        setMessage({
          type: "error",
          text: data.error || data.detail || "Error while creating user"
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server connection error" });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {message.text && message.type !== "" && (
          <Alert
            severity={message.type as "success" | "info" | "warning" | "error"}
            onClose={() => setMessage({ type: "", text: "" })}
          >
            {message.text}
          </Alert>
        )}

        <fieldset className="border-2 border-gray-300 rounded-2xl p-6">
          <legend className="px-4 text-xl font-bold text-gray-800">
            Registration
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

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
          className="!py-4 !text-lg !font-bold !rounded-2xl"
        >
          {loading ? "Creating user..." : "CREATE USER"}
        </Button>
      </form>
    </div>
  );
}

export default Register;
