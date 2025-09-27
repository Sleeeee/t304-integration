import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

function Register() {
  const [name, setName] = useState("");
  
  return (
    <div>
      <TextField
        hiddenLabel
        placeholder="Name"
        id="filled-hidden-label-normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
        variant="filled"
      />
      <Button variant="contained">Register</Button>
    </div>
  );
}

export default Register;