import React, { useState } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Header from './components/Header';
import Register from './components/Register';
import UsersPage from './components/UsersPage';
import LockPage from './components/LockPage';
import PermissionTable from './components/permissions/PermissionTable';
import { Box } from '@mui/material';
import KonvaCanva from './components/KonvaCanva';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("users");
  const [currentSchematicId, setCurrentSchematicId] = useState(null);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Auth />;

  //Mettre à jour les différents états 
  const handleNavigateToSchematic = (schematicId) => {
    setCurrentSchematicId(schematicId);
    setCurrentPage("monitoring");
  };


  const renderPage = () => {
    switch (currentPage) {
      case "register":
        return <Register />;

      case "users":
        return <UsersPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;

      case "monitoring":
        // 1. On vérifie si on a un ID
        if (!currentSchematicId) {
          return <UsersPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;
        }
        return (
          <KonvaCanva 
            onNavigate={setCurrentPage} 
            schematicId={currentSchematicId} 
          />
        );

      case "lock":
        return <LockPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;

      case "access":
        return (
          <Box sx={{ p: 4 }}>
            <h2>Access Page</h2>
            <p>Cette page sera développée prochainement</p>
          </Box>
        );
      case "access-control":
        return <PermissionTable />;
      case "settings":
        return (
          <Box sx={{ p: 4 }}>
            <h2>Settings Page</h2>
            <p>Cette page sera développée prochainement</p>
          </Box>
        );

      default:
        return <UsersPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;
    }
  };

  return (
    <div className="App min-h-screen bg-gray-100">
      <Header onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;
