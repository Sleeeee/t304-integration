import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

function Register() {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isOpenPerm, setIsOpenPerm] = useState(false);
  const [checked, setChecked] = useState([0]);

  const handleToggle = (value) => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto p-6">
      {/* Formulaire d'enregistrement */}
      <fieldset className="border-2 border-gray-300 rounded-2xl p-6 relative">
        <legend className="px-2">
          <button
            className="flex items-center gap-3 px-4 py-2 bg-white hover:bg-gray-50 transition-all duration-300"
            onClick={() => setIsOpenForm(!isOpenForm)}
          >
            <span className="text-xl font-bold text-gray-800">Enregistrement</span>
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center">
              <span
                className={`text-sm font-bold transition-transform duration-300 inline-block ${
                  isOpenForm ? "" : "rotate-180"
                }`}
              >
                ^
              </span>
            </span>
          </button>
        </legend>

        {isOpenForm && (
          <form className="flex flex-col gap-5 animate-in slide-in-from-top duration-300">
            <TextField 
              label="Nom d'utilisateur" 
              variant="outlined" 
              fullWidth 
              className="hover:scale-[1.02] transition-transform"
            />
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              type="email"
              className="hover:scale-[1.02] transition-transform"
            />
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              className="!py-3 !rounded-xl !shadow-lg hover:!shadow-xl !transition-all"
            >
              Manière de connexion
            </Button>
          </form>
        )}

        {!isOpenForm && (
          <div className="text-center text-gray-400 py-4">
            Cliquez pour ouvrir le formulaire
          </div>
        )}
      </fieldset>

      {/* Permissions */}
      <fieldset className="border-2 border-gray-300 rounded-2xl p-6 relative">
        <legend className="px-2">
          <button
            className="flex items-center gap-3 px-4 py-2 bg-white hover:bg-gray-50 transition-all duration-300"
            onClick={() => setIsOpenPerm(!isOpenPerm)}
          >
            <span className="text-xl font-bold text-gray-800">Permissions</span>
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center">
              <span
                className={`text-sm font-bold transition-transform duration-300 inline-block ${
                  isOpenPerm ? "" : "rotate-180"
                }`}
              >
                ^
              </span>
            </span>
          </button>
        </legend>

        {isOpenPerm && (
          <div className="flex flex-col gap-3 animate-in slide-in-from-top duration-300">
            {[0, 1, 2, 3].map((value) => (
              <div
                key={value}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => handleToggle(value)}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={checked.includes(value)}
                    onChange={() => {}}
                    className="w-6 h-6 cursor-pointer accent-purple-600 rounded-lg"
                  />
                  <span className="font-medium text-gray-700">Line item {value + 1}</span>
                </div>

                <button 
                  className="p-2 rounded-full hover:bg-white transition-colors duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className="w-5 h-5 text-gray-500 hover:text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {!isOpenPerm && (
          <div className="text-center text-gray-400 py-4">
            Cliquez pour gérer les permissions
          </div>
        )}
      </fieldset>

      <div className="mt-8 pt-8 border-t-2 border-gray-200">
        <Button 
          variant="contained" 
          color="success" 
          fullWidth
          size="large"
          className="!py-4 !text-lg !font-bold !rounded-2xl !shadow-xl hover:!shadow-2xl !transition-all !bg-gradient-to-r !from-green-500 !to-emerald-500"
        >
          S'INSCRIRE
        </Button>
      </div>
    </div>
  );
}

export default Register;