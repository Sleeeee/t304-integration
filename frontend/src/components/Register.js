import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

function Register() {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
    {/* Formulaire d'enregistrement */}

    <div className="border rounded-lg p-4 max-w-md">
        {/* Header avec flèche */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-xl font-semibold">Enregistrement</h2>
          <svg
            className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {/* Liste avec checkboxes */}
        {isOpen && (
          <div>
          </div>
        )}
      </div>

      {/* Section des permissions */}

      <div className="border rounded-lg p-4 max-w-md">
        {/* Header avec flèche */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-xl font-semibold">Permissions</h2>
          <svg
            className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {/* Liste avec checkboxes */}
        {isOpen && (
          <div className="mt-4 pt-4 border-t">
            {[0, 1, 2, 3].map((value) => (
              <div
                key={value}
                className="flex items-center justify-between py-2 px-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => handleToggle(value)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked.includes(value)}
                    onChange={() => {}}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span>Line item {value + 1}</span>
                </div>
                
                <button className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Register;