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

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("users");

  if (loading) return <div>Loading...</div>;
  if (!user) return <Auth />;

  const renderPage = () => {
    switch (currentPage) {
      case "register":
        return <Register />;
      case "users":
        return <UsersPage onNavigate={setCurrentPage} />;
      case "monitoring":
        return (
          <Box sx={{ p: 4 }}>
            <h2>Monitoring Page</h2>
            <p>Cette page sera développée prochainement</p>
          </Box>
        );
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
        return <UsersPage onNavigate={setCurrentPage} />;
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
