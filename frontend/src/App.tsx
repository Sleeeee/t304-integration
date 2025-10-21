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
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("users");
  
  const [selectedSchematicId, setSelectedSchematicId] = useState<number | null>(null);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Auth />;

  const handleViewSchematic = (schematicId: number) => {
    setSelectedSchematicId(schematicId);
    setCurrentPage("monitoring");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "register":
        return <Register />;
      case "users":
        return <UsersPage 
          onNavigate={setCurrentPage} 
          onViewSchematic={handleViewSchematic}
        />;
      
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
      
      case "groups":
        return <GroupsPage onNavigate={setCurrentPage} />;
      case 'user-groups':
        return <GroupsUserPage onNavigate={setCurrentPage} />;
      case 'user-lockets':
        return <GroupsLocketPage onNavigate={setCurrentPage} />;
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
      <Header onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;