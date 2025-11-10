import React, { useState } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Header from './components/Header'; // Nous importons votre Header
import Register from './components/Register';
import UsersPage from './components/UsersPage';
import LockPage from './components/LockPage';
import PermissionTable from './components/permissions/PermissionTable';
import { Box } from '@mui/material';
import KonvaCanva from './components/KonvaCanva';

// Fonction copiée de KonvaCanva.tsx pour obtenir le token CSRF
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Interface pour les types que nous allons recevoir
interface Building { id: number; name: string; }
interface Schematic { id: number; name: string; }

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("users");
  const [currentSchematicId, setCurrentSchematicId] = useState<number | null>(null);
  
  // Ajout d'un état de chargement pour le raccourci
  const [isOpeningDefault, setIsOpeningDefault] = useState(false);

  // La navigation de base (quand on a déjà un ID)
  const handleNavigateToSchematic = (schematicId: number) => {
    setCurrentSchematicId(schematicId);
    setCurrentPage("monitoring");
  };

  /**
   * NOUVELLE FONCTION
   * Appelée par le bouton "Monitoring" du Header.
   * Trouve "Batiment A", sinon le crée.
   * Trouve "Rez-de-chaussé" dans ce bâtiment, sinon le crée.
   * Navigue vers cet ID.
   */
  const handleOpenMonitoring = async () => {
    // Si on est déjà en train de charger, on ne fait rien
    if (isOpeningDefault) return;
    
    setIsOpeningDefault(true);
    
    const csrfToken = getCookie('csrftoken');
    const headers = {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    };

    let buildingId: number;
    let schematicId: number;

    // Utilise l'URL de tes variables d'environnement si elle existe
    const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    try {
      // 1. CHERCHER "Batiment A"
      // Note: On utilise l'URL /api/schematics/buildings/ comme dans ton KonvaCanva
      const buildingsRes = await fetch(`${API_URL}/api/schematics/buildings/`, { credentials: 'include' });
      const { buildings } = (await buildingsRes.json()) as { buildings: Building[] };
      const existingBuilding = buildings.find(b => b.name === "Batiment A");

      if (existingBuilding) {
        buildingId = existingBuilding.id;
      } else {
        // 2. CRÉER "Batiment A" s'il n'existe pas
        const createBuildingRes = await fetch(`${API_URL}/api/schematics/buildings/`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ name: "Batiment A", description: "Bâtiment principal", floor: 1 }),
        });
        const newBuilding = (await createBuildingRes.json()) as Building;
        buildingId = newBuilding.id;
      }

      // 3. CHERCHER "Rez-de-chaussé" dans ce bâtiment
      const schematicsRes = await fetch(`${API_URL}/api/schematics/buildings/${buildingId}/schematics/`, { credentials: 'include' });
      const { schematics } = (await schematicsRes.json()) as { schematics: Schematic[] };
      const existingSchematic = schematics.find(s => s.name === "Rez-de-chaussé");

      if (existingSchematic) {
        schematicId = existingSchematic.id;
      } else {
        // 4. CRÉER "Rez-de-chaussé" s'il n'existe pas
        const createSchematicRes = await fetch(`${API_URL}/api/schematics/buildings/${buildingId}/schematics/`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ name: "Rez-de-chaussé", description: "Plan du RDC" }),
        });
        const newSchematic = (await createSchematicRes.json()) as Schematic;
        schematicId = newSchematic.id;
      }

      // 5. NAVIGUER
      handleNavigateToSchematic(schematicId);

    } catch (error) {
      console.error("Erreur lors du chargement ou de la création du schéma par défaut:", error);
      alert("Erreur: Impossible de charger le schéma par défaut.");
    } finally {
      setIsOpeningDefault(false);
    }
  };


  // On vérifie le chargement ET le chargement du schéma par défaut
  if (loading || isOpeningDefault) return <div>Chargement...</div>;
  if (!user) return <Auth />;


  const renderPage = () => {
    switch (currentPage) {
      case "register":
        return <Register />;

      case "users":
        return <UsersPage onNavigate={setCurrentPage} onEditSchematic={handleNavigateToSchematic} />;

      case "monitoring":
        // Cette logique (de ma réponse d'il y a 2 minutes) est correcte
        // Elle gère le cas où l'ID est null (clic header) ou défini (clic ailleurs)
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
      <Header onNavigate={setCurrentPage} onOpenMonitoring={handleOpenMonitoring} />
      {renderPage()}
    </div>
  );
}

export default App;