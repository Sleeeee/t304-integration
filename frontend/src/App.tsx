import React, { useState } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Header from './components/Header';
import Register from './components/Register';
import UsersPage from './components/UsersPage';
import LockPage from './components/LockPage';
import PermissionTable from './components/permissions/PermissionTable';
import { Box, CircularProgress } from '@mui/material';
import KonvaCanva from './components/KonvaCanva';
import UserDashboardPage from './components/UsersFront/UserDashboardPage';
import UserHeader from './components/UsersFront/UsersHeader';
import ReservationAdminPage from './components/ReservationAdminPage';

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};
interface Building { id: number; name: string; }
interface Schematic { id: number; name: string; }


function App() {
  const { user, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState("users");

  const [currentSchematicId, setCurrentSchematicId] = useState<number | null>(null);
  const [isOpeningDefault, setIsOpeningDefault] = useState(false);

  const handleNavigateToSchematic = (schematicId: number) => {
    setCurrentSchematicId(schematicId);
    setCurrentPage("monitoring");
  };
  const handleOpenMonitoring = async () => {
    if (isOpeningDefault) return;
    setIsOpeningDefault(true);
    const csrfToken = getCookie('csrftoken');
    const headers = {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    };
    let buildingId: number;
    let schematicId: number;
    const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    try {
      const buildingsRes = await fetch(`${API_URL}/schematics/buildings/`, { credentials: 'include' });
      const { buildings } = (await buildingsRes.json()) as { buildings: Building[] };
      const existingBuilding = buildings.find(b => b.name === "Batiment A");
      if (existingBuilding) {
        buildingId = existingBuilding.id;
      } else {
        const createBuildingRes = await fetch(`${API_URL}/schematics/buildings/`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ name: "Batiment A", description: "Bâtiment principal", floor: 1 }),
        });
        const newBuilding = (await createBuildingRes.json()) as Building;
        buildingId = newBuilding.id;
      }
      const schematicsRes = await fetch(`${API_URL}/schematics/buildings/${buildingId}/schematics/`, { credentials: 'include' });
      const { schematics } = (await schematicsRes.json()) as { schematics: Schematic[] };
      const existingSchematic = schematics.find(s => s.name === "Rez-de-chaussé");
      if (existingSchematic) {
        schematicId = existingSchematic.id;
      } else {
        const createSchematicRes = await fetch(`${API_URL}/schematics/buildings/${buildingId}/schematics/`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ name: "Rez-de-chaussé", description: "Plan du RDC" }),
        });
        const newSchematic = (await createSchematicRes.json()) as Schematic;
        schematicId = newSchematic.id;
      }
      handleNavigateToSchematic(schematicId);
    } catch (error) {
      console.error("Erreur lors du chargement ou de la création du schéma par défaut:", error);
      alert("Erreur: Impossible de charger le schéma par défaut.");
    } finally {
      setIsOpeningDefault(false);
    }
  };


  if (loading || isOpeningDefault) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        {/* ACCESSIBILITÉ: Label pour le chargement initial */}
        <CircularProgress aria-label="Application loading, please wait..." />
      </Box>
    );
  }

  if (!user) return <Auth />;

  if (user.is_staff) {

    const renderAdminPanel = () => {
      switch (currentPage) {
        case "dashboard":
          return <ReservationAdminPage onNavigate={setCurrentPage} />;
        case "register":
          return <Register />;
        case "users":
          return <UsersPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;
        case "monitoring":
          return (
            <KonvaCanva
              onNavigate={setCurrentPage}
              schematicId={currentSchematicId}
            />
          );
        case "lock":
          return <LockPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;
        case "access-control":
          return <PermissionTable />;
        default:
          return <UsersPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;
      }
    };

    return (
      <div className="App min-h-screen bg-gray-100">
        {/* Header est une <nav> */}
        <Header onNavigate={setCurrentPage} onOpenMonitoring={handleOpenMonitoring} />

        {/* ACCESSIBILITÉ: <main> indique où commence le vrai contenu après le menu */}
        <main role="main">
          {renderAdminPanel()}
        </main>
      </div>
    );

  } else {
    return (
      <div className="App min-h-screen bg-gray-100">
        <UserHeader />
        {/* ACCESSIBILITÉ: <main> */}
        <main role="main">
          <UserDashboardPage user={user} onNavigate={setCurrentPage} />
        </main>
      </div>
    );
  }
}

export default App;
