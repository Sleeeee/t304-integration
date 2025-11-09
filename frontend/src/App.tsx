import React, { useState } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext'; 
import Auth from './components/Auth';
import Header from './components/Header';
import Register from './components/Register';
import UsersPage from './components/UsersPage';
import GroupsPage from './components/GroupsPage';
import GroupsUserPage from './components/GroupsUser/UserGroupsList';
import GroupsLocketPage from './components/GroupsLocket/UserLocketsList';
import LockPage from './components/LockPage';
import PermissionTable from './components/permissions/PermissionTable';
import { Box } from '@mui/material';
import KonvaCanva from './components/KonvaCanva';

function App() {
  const { user, loading, defaultSchematicId } = useAuth(); 
  const [currentPage, setCurrentPage] = useState("users");
  
  const [selectedSchematicId, setSelectedSchematicId] = useState<number | null>(null);

  // Vérifications d'authentification (votre branche "visu")
  if (loading) return <div>Loading...</div>;
  if (!user) return <Auth />;

  // Navigation vers Konva
  const handleViewSchematic = (schematicId: number) => {
    setSelectedSchematicId(schematicId);
    setCurrentPage("monitoring");
  };

  // Navigation générale
  const handleNavigate = (page: string) => {
    if (page === "monitoring") {
      if (defaultSchematicId) {
        setSelectedSchematicId(defaultSchematicId);
        setCurrentPage("monitoring");
      } else {
        setSelectedSchematicId(null);
        setCurrentPage("monitoring"); 
      }
    } else {
      setCurrentPage(page);
    }
  };

  // Rendu de la page (votre version "moi" qui est la bonne)
  const renderPage = () => {
    switch (currentPage) {
      case "register":
        return <Register />;
      
      case "users":
        return <UsersPage 
          onNavigate={setCurrentPage} 
          onViewSchematic={handleViewSchematic}
        />;
      
      // Cas KONVA
      case "monitoring":
        if (!selectedSchematicId) {
          return (
            <Box sx={{ p: 4 }}>
              <h2>Erreur</h2>
              <p>Aucun schéma n'a été sélectionné.</p>
              <button 
                onClick={() => setCurrentPage("users")}
                style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Retour
              </button>
            </Box>
          );
        }
        return <KonvaCanva 
          onNavigate={setCurrentPage} 
          schematicId={selectedSchematicId}
        />;
      
      // Cas des GROUPES
      case "groups":
        return <GroupsPage onNavigate={setCurrentPage} />;
      case 'user-groups':
        return <GroupsUserPage onNavigate={setCurrentPage} />;
      case 'user-lockets':
        return <GroupsLocketPage onNavigate={setCurrentPage} />;
      
      // Reste des pages
      case "lock":
        return <LockPage onNavigate={setCurrentPage} />;
        
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
        return <UsersPage 
          onNavigate={setCurrentPage} 
          onViewSchematic={handleViewSchematic}
        />;
    }
  };

  return (
    <div className="App min-h-screen bg-gray-100">
      <Header onNavigate={handleNavigate} /> 
      {renderPage()}
    </div>
  );
}

export default App;