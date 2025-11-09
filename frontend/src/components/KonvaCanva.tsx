import React from 'react';
import { Stage, Layer, Line, Path, Transformer, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import type { Line as KonvaLine } from 'konva/lib/shapes/Line';
import type { Path as KonvaPath } from 'konva/lib/shapes/Path';
import type { Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer';

// Utility function for CSRF token
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

interface LineData {
  x: number;
  y: number;
  points: number[];
  id: string;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

interface LockData {
  x: number;
  y: number;
  type: 'lock';
  id: string;
  lock_id?: number;
  lock_name?: string;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

type ComponentData = LineData | LockData;

// Interface for Lock from backend
interface Lock {
  id_lock: number;
  name: string;
  description: string | null;
  status: 'connected' | 'disconnected' | 'error' | string;
  last_connexion: string | null;
}

// Interface for Building from backend
interface Building {
  id: number;
  name: string;
  description: string | null;
  floor: number;
}

// Interface for Schematic from backend
interface Schematic {
  id: number;
  name: string;
  description: string | null;
  building: number;
  building_name?: string;
  floor_number?: number;
}

interface KonvaCanvaProps {
  onNavigate: (page: string) => void;
  schematicId: number;
}

// Composant pour une ligne transformable
const TransformableLine: React.FC<{
  shapeProps: LineData;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: LineData) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}> = ({ shapeProps, isSelected, onSelect, onChange, isDragging, onDragStart, onDragEnd }) => {
  const shapeRef = React.useRef<KonvaLine>(null);
  const trRef = React.useRef<KonvaTransformer>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      const layer = (trRef.current as any).getLayer();
      layer?.batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Line
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        points={shapeProps.points}
        x={shapeProps.x}
        y={shapeProps.y}
        scaleX={shapeProps.scaleX || 1}
        scaleY={shapeProps.scaleY || 1}
        stroke={isDragging || isHovered ? '#4CAF50' : 'black'}
        strokeWidth={isSelected ? 4 : 2}
        hitStrokeWidth={20}
        lineCap="round"
        lineJoin="round"
        draggable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragStart={onDragStart}
        rotation={shapeProps.rotation || 0}
        onDragEnd={(e: KonvaEventObject<DragEvent>) => {
          onDragEnd();
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e: KonvaEventObject<Event>) => {
          const node = e.target;

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox: any, newBox: any) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

// Composant pour une serrure transformable
const TransformableLock: React.FC<{
  shapeProps: LockData;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: LockData) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}> = ({ shapeProps, isSelected, onSelect, onChange, isDragging, onDragStart, onDragEnd }) => {
  const shapeRef = React.useRef<KonvaPath>(null);
  const trRef = React.useRef<KonvaTransformer>(null);
  const textRef = React.useRef<any>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  // Facteur de scale de base pour la serrure
  const BASE_SCALE = 0.4;

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      const layer = (trRef.current as any).getLayer();
      layer?.batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Path
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        name="lock-path"
        data="M40.92,53.31c0-1.25,1.01-2.26,2.26-2.26c1.25,0,2.26,1.01,2.26,2.26v46.84c0,6.25-2.56,11.93-6.67,16.05 c-4.12,4.12-9.8,6.67-16.05,6.67h0c-6.25,0-11.93-2.56-16.05-6.67C2.56,112.09,0,106.41,0,100.16V22.72 c0-6.25,2.56-11.93,6.67-16.05C10.79,2.56,16.47,0,22.72,0h0c4.04,0,7.85,1.08,11.16,2.96c3.42,1.94,6.29,4.75,8.32,8.12 c0.64,1.07,0.29,2.46-0.78,3.10c-1.07,0.64-2.46,0.29-3.10-0.78c-1.62-2.70-3.93-4.95-6.68-6.51c-2.64-1.50-5.69-2.35-8.93-2.35h0 c-5,0-9.55,2.05-12.85,5.35c-3.30,3.30-5.35,7.85-5.35,12.85v77.44c0,5,2.05,9.55,5.35,12.85c3.30,3.30,7.85,5.35,12.85,5.35h0 c5,0,9.55-2.05,12.85-5.35c3.30-3.30,5.35-7.85,5.35-12.85V53.31L40.92,53.31z M28.91,20.27H94.7c3.6,0,6.86,1.47,9.23,3.84 c2.37,2.37,3.84,5.63,3.84,9.23v0c0,3.6-1.47,6.86-3.84,9.23c-2.37,2.37-5.63,3.84-9.23,3.84H28.91c-3.6,0-6.86-1.47-9.23-3.84 c-2.37-2.37-3.84-5.63-3.84-9.23v0c0-3.6,1.47-6.86,3.84-9.23C22.05,21.74,25.32,20.27,28.91,20.27L28.91,20.27z M94.7,24.8H28.91 c-2.35,0-4.48,0.96-6.03,2.51c-1.55,1.55-2.51,3.68-2.51,6.03v0c0,2.35,0.96,4.48,2.51,6.03c1.55,1.55,3.68,2.51,6.03,2.51H94.7 c2.35,0,4.48-0.96,6.03-2.51c1.55-1.55,2.51-3.68,2.51-6.03v0c0-2.35-0.96-4.48-2.51-6.03C99.18,25.76,97.05,24.8,94.7,24.8 L94.7,24.8z M25.18,92.58v8.76c0,1.25-1.01,2.26-2.26,2.26c-1.25,0-2.26-1.01-2.26-2.26v-8.87c-1.17-0.39-2.22-1.04-3.07-1.89 c-1.41-1.41-2.29-3.37-2.29-5.52c0-2.16,0.87-4.11,2.29-5.52c1.41-1.41,3.37-2.29,5.52-2.29c2.16,0,4.11,0.87,5.52,2.29 c1.41,1.41,2.29,3.37,2.29,5.52c0,2.16-0.87,4.11-2.29,5.52C27.68,91.52,26.5,92.22,25.18,92.58L25.18,92.58z M25.42,82.73 c-0.59-0.59-1.41-0.96-2.32-0.96c-0.91,0-1.73,0.37-2.32,0.96c-0.59,0.59-0.96,1.41-0.96,2.32c0,0.91,0.37,1.73,0.96,2.32 c0.59,0.59,1.41,0.96,2.32,0.96c0.91,0,1.73-0.37,2.32-0.96c0.59-0.59,0.96-1.41,0.96-2.32C26.39,84.15,26.02,83.33,25.42,82.73 L25.42,82.73z"
        x={shapeProps.x}
        y={shapeProps.y}
        scaleX={(shapeProps.scaleX || 1) * BASE_SCALE}
        scaleY={(shapeProps.scaleY || 1) * BASE_SCALE}
        fill={isDragging || isHovered ? '#4CAF50' : 'black'}
        hitStrokeWidth={30}
        draggable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragStart={onDragStart}
        rotation={shapeProps.rotation || 0}
        onDragEnd={(e: KonvaEventObject<DragEvent>) => {
          onDragEnd();
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e: KonvaEventObject<Event>) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // Réinitialiser le scale du node pour éviter l'effet cumulatif
          node.scaleX(1);
          node.scaleY(1);

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // Diviser par BASE_SCALE pour stocker uniquement le scale de l'utilisateur
            scaleX: scaleX / BASE_SCALE,
            scaleY: scaleY / BASE_SCALE,
            rotation: node.rotation(),
          });
        }}
      />
      {/* Texte avec le nom de la serrure - TOUJOURS AU-DESSUS, SANS ROTATION */}
      {shapeProps.lock_name && (
        <Text
          ref={textRef}
          text={shapeProps.lock_name}
          x={shapeProps.x}
          y={shapeProps.y - 40}
          fontSize={14}
          fill="#333"
          fontStyle="bold"
          align="center"
          offsetX={shapeProps.lock_name.length * 3.5}
          listening={false}
          rotation={0}
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox: any, newBox: any) => {
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

// Composant principal
const KonvaCanva: React.FC<KonvaCanvaProps> = ({ onNavigate, schematicId }) => {
  const [components, setComponents] = React.useState<ComponentData[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedType, setDraggedType] = React.useState<'line' | 'lock' | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [draggingComponentIndex, setDraggingComponentIndex] = React.useState<number | null>(null);
  const [draggedItemActive, setDraggedItemActive] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [stageSize, setStageSize] = React.useState({ width: 800, height: 600 });

  // New states for database synchronization
  const [availableLocks, setAvailableLocks] = React.useState<Lock[]>([]);
  const [placedLockIds, setPlacedLockIds] = React.useState<Set<number>>(new Set());
  const [draggedLockId, setDraggedLockId] = React.useState<number | null>(null);
  const [draggedLockName, setDraggedLockName] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string>('');

  // States for building and schematic management
  const [buildings, setBuildings] = React.useState<Building[]>([]);
  const [schematics, setSchematics] = React.useState<Schematic[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<number | null>(null);
  const [selectedSchematicId, setSelectedSchematicId] = React.useState<number>(schematicId);
  const [showAddBuildingModal, setShowAddBuildingModal] = React.useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = React.useState(false);

  // State for selected object details panel
  const [selectedObjectDetails, setSelectedObjectDetails] = React.useState<ComponentData | null>(null);

  const stageRef = React.useRef<KonvaStage>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);

  // Points pour dessiner un mur (ligne verticale)
  const linePoints = [0, 0, 0, 100];

  // Fetch available locks from backend
  const fetchAvailableLocks = React.useCallback(async () => {
    try {
      const csrfToken = getCookie('csrftoken');
      const headers: HeadersInit = csrfToken ? { 'X-CSRFToken': csrfToken } : {};

      const response = await fetch('http://localhost:8000/locks/', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableLocks(data.locks || []);
      } else {
        console.error('Failed to fetch locks');
      }
    } catch (error) {
      console.error('Error fetching locks:', error);
    }
  }, []);

  // Fetch buildings from backend
  const fetchBuildings = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/buildings/', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBuildings(data.buildings || data || []);
      } else {
        console.error('Failed to fetch buildings');
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  }, []);

  // Fetch schematics for a specific building
  const fetchSchematicsForBuilding = React.useCallback(async (buildingId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/buildings/${buildingId}/schematics/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSchematics(data.schematics || data || []);
      } else {
        console.error('Failed to fetch schematics');
      }
    } catch (error) {
      console.error('Error fetching schematics:', error);
    }
  }, []);

  // Fetch schematic data from backend
  const fetchSchematicData = React.useCallback(async (id: number) => {
    if (!id) return;

    setIsLoading(true);
    // Vider le canvas avant de charger de nouvelles données
    setComponents([]);
    setPlacedLockIds(new Set());
    setSelectedId(null);
    setSelectedObjectDetails(null);

    try {
      const response = await fetch(`http://localhost:8000/api/schematics/${id}/data/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setComponents(data.components || []);

        // Extract IDs of placed locks
        const placedIds = (data.components || [])
          .filter((c: ComponentData) => 'type' in c && c.type === 'lock')
          .map((c: LockData) => c.lock_id)
          .filter((id: number | undefined): id is number => id !== undefined);

        setPlacedLockIds(new Set(placedIds));
      } else {
        console.error('Failed to fetch schematic data');
        // Même en cas d'erreur, garder le canvas vide
        setComponents([]);
        setPlacedLockIds(new Set());
      }
    } catch (error) {
      console.error('Error fetching schematic:', error);
      // Même en cas d'erreur, garder le canvas vide
      setComponents([]);
      setPlacedLockIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save schematic data to backend
  const saveSchematic = React.useCallback(async () => {
    if (!selectedSchematicId) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const csrfToken = getCookie('csrftoken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      };

      const response = await fetch(`http://localhost:8000/api/schematics/${selectedSchematicId}/save/`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ components }),
      });

      if (response.ok) {
        setSaveMessage('✅ Sauvegardé avec succès');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving schematic:', error);
      setSaveMessage('❌ Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  }, [selectedSchematicId, components]);

  // Create new building
  const createBuilding = React.useCallback(async (name: string, description: string, floor: number) => {
    try {
      const csrfToken = getCookie('csrftoken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      };

      const response = await fetch('http://localhost:8000/api/buildings/', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ name, description, floor }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh buildings list
        await fetchBuildings();
        // Select the newly created building
        setSelectedBuildingId(data.id || data.building?.id);
        return true;
      } else {
        console.error('Failed to create building');
        return false;
      }
    } catch (error) {
      console.error('Error creating building:', error);
      return false;
    }
  }, [fetchBuildings]);

  // Create new floor/schematic
  const createFloor = React.useCallback(async (buildingId: number, name: string, description: string) => {
    try {
      const csrfToken = getCookie('csrftoken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      };

      const response = await fetch(`http://localhost:8000/api/buildings/${buildingId}/schematics/`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh schematics list
        await fetchSchematicsForBuilding(buildingId);
        // Select the newly created schematic
        setSelectedSchematicId(data.id || data.schematic?.id);
        return true;
      } else {
        console.error('Failed to create floor');
        return false;
      }
    } catch (error) {
      console.error('Error creating floor:', error);
      return false;
    }
  }, [fetchSchematicsForBuilding]);

  // Load data on mount
  React.useEffect(() => {
    fetchAvailableLocks();
    fetchBuildings();
    // Synchroniser selectedSchematicId avec la prop schematicId au démarrage
    if (schematicId && schematicId !== selectedSchematicId) {
      setSelectedSchematicId(schematicId);
    }
  }, [schematicId, fetchAvailableLocks, fetchBuildings]); // Removed fetchSchematicData and selectedSchematicId

  // Fetch schematics when building is selected
  React.useEffect(() => {
    if (selectedBuildingId) {
      fetchSchematicsForBuilding(selectedBuildingId);
    }
  }, [selectedBuildingId, fetchSchematicsForBuilding]);

  // Load schematic when selection changes
  const lastLoadedSchematicId = React.useRef<number | null>(null);

  React.useEffect(() => {
    // Charger les données si un schéma est sélectionné ET qu'il est différent du dernier chargé
    if (selectedSchematicId && selectedSchematicId !== lastLoadedSchematicId.current) {
      lastLoadedSchematicId.current = selectedSchematicId;
      fetchSchematicData(selectedSchematicId);
    }
  }, [selectedSchematicId, fetchSchematicData]);

  // Gestion du redimensionnement du canvas
  React.useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        const width = canvasContainerRef.current.offsetWidth;
        const height = canvasContainerRef.current.offsetHeight;
        setStageSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Filter available locks (not placed)
  const unplacedLocks = React.useMemo(() => {
    return availableLocks.filter(lock => !placedLockIds.has(lock.id_lock));
  }, [availableLocks, placedLockIds]);

  // Delete selected component (Delete or Backspace key)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Find the component being deleted
        const deletedComponent = components.find(c => c.id === selectedId);

        // If it's a lock, remove it from placedLockIds
        if (deletedComponent && 'type' in deletedComponent && deletedComponent.type === 'lock' && deletedComponent.lock_id) {
          setPlacedLockIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(deletedComponent.lock_id!);
            return newSet;
          });
        }

        // Remove component from canvas
        setComponents(components.filter(c => c.id !== selectedId));
        setSelectedId(null);
        setSelectedObjectDetails(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, components]);

  // Déselection
  const checkDeselect = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
      setSelectedObjectDetails(null);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      gap: '20px'
    }}>
      {/* SECTION DU HAUT: Bâtiments et Étages */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minHeight: '150px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Bâtiments et Étages</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddBuildingModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1976D2';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2196F3';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              + Ajouter Bâtiment
            </button>
            <button
              onClick={() => setShowAddFloorModal(true)}
              disabled={!selectedBuildingId}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedBuildingId ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedBuildingId ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedBuildingId) {
                  e.currentTarget.style.backgroundColor = '#45a049';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedBuildingId) {
                  e.currentTarget.style.backgroundColor = '#4CAF50';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              + Ajouter Étage
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Building Selection */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px', display: 'block' }}>
              Sélectionner un bâtiment
            </label>
            <select
              value={selectedBuildingId || ''}
              onChange={(e) => {
                const buildingId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedBuildingId(buildingId);
                setSchematics([]);
                setSelectedSchematicId(0);
              }}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="">-- Choisir un bâtiment --</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name} ({building.floor} étage{building.floor > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Schematic/Floor Selection */}
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px', display: 'block' }}>
              Sélectionner un étage
            </label>
            <select
              value={selectedSchematicId || ''}
              onChange={(e) => {
                const schematicId = e.target.value ? parseInt(e.target.value) : 0;
                setSelectedSchematicId(schematicId);
              }}
              disabled={!selectedBuildingId}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                backgroundColor: selectedBuildingId ? 'white' : '#f5f5f5',
                cursor: selectedBuildingId ? 'pointer' : 'not-allowed',
                outline: 'none'
              }}
            >
              <option value="">-- Choisir un étage --</option>
              {schematics.map((schematic) => (
                <option key={schematic.id} value={schematic.id}>
                  {schematic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION DU BAS: Éléments draggables à gauche + Canvas à droite */}
      <div style={{
        display: 'flex',
        gap: '20px',
        flex: 1,
        minHeight: 0
      }}>
        {/* GAUCHE: Éléments draggables */}
        <div style={{
          width: '250px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Éléments</h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            overflowY: 'auto'
          }}>
            {/* Élément Mur */}
            <div
              draggable
              style={{
                padding: '15px',
                border: draggedItemActive === 'line' ? '2px solid #4CAF50' : '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'grab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: draggedItemActive === 'line' ? '#f0f8f0' : 'white',
                transition: 'all 0.2s ease'
              }}
              onDragStart={() => {
                setIsDragging(true);
                setDraggedType('line');
                setDraggedItemActive('line');
                setDraggedLockId(null);
              }}
              onDragEnd={() => {
                setIsDragging(false);
                setDraggedItemActive(null);
              }}
            >
              <svg width="50" height="60" viewBox="0 0 50 100">
                <line x1="25" y1="0" x2="25" y2="100" stroke="black" strokeWidth="3" />
              </svg>
              <div style={{ fontSize: '11px', marginTop: '5px', color: '#666' }}>Mur</div>
            </div>

            {/* Serrures disponibles depuis la DB */}
            {unplacedLocks.length === 0 && availableLocks.length > 0 && (
              <div style={{
                padding: '15px',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#999',
                fontSize: '12px'
              }}>
                Toutes les serrures sont placées
              </div>
            )}
            {unplacedLocks.map((lock) => (
              <div
                key={lock.id_lock}
                draggable
                style={{
                  padding: '12px',
                  border: draggedItemActive === `lock-${lock.id_lock}` ? '2px solid #4CAF50' : '2px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: draggedItemActive === `lock-${lock.id_lock}` ? '#f0f8f0' : 'white',
                  transition: 'all 0.2s ease'
                }}
                onDragStart={() => {
                  setIsDragging(true);
                  setDraggedType('lock');
                  setDraggedLockId(lock.id_lock);
                  setDraggedLockName(lock.name);
                  setDraggedItemActive(`lock-${lock.id_lock}`);
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                  setDraggedItemActive(null);
                }}
              >
                <svg width="40" height="50" viewBox="-7.55 0 122.88 122.88" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path d="M40.92,53.31c0-1.25,1.01-2.26,2.26-2.26c1.25,0,2.26,1.01,2.26,2.26v46.84c0,6.25-2.56,11.93-6.67,16.05 c-4.12,4.12-9.8,6.67-16.05,6.67h0c-6.25,0-11.93-2.56-16.05-6.67C2.56,112.09,0,106.41,0,100.16V22.72 c0-6.25,2.56-11.93,6.67-16.05C10.79,2.56,16.47,0,22.72,0h0c4.04,0,7.85,1.08,11.16,2.96c3.42,1.94,6.29,4.75,8.32,8.12 c0.64,1.07,0.29,2.46-0.78,3.10c-1.07,0.64-2.46,0.29-3.10-0.78c-1.62-2.70-3.93-4.95-6.68-6.51c-2.64-1.50-5.69-2.35-8.93-2.35h0 c-5,0-9.55,2.05-12.85,5.35c-3.30,3.30-5.35,7.85-5.35,12.85v77.44c0,5,2.05,9.55,5.35,12.85c3.30,3.30,7.85,5.35,12.85,5.35h0 c5,0,9.55-2.05,12.85-5.35c3.30-3.30,5.35-7.85,5.35-12.85V53.31L40.92,53.31z M28.91,20.27H94.7c3.6,0,6.86,1.47,9.23,3.84 c2.37,2.37,3.84,5.63,3.84,9.23v0c0,3.6-1.47,6.86-3.84,9.23c-2.37,2.37-5.63,3.84-9.23,3.84H28.91c-3.6,0-6.86-1.47-9.23-3.84 c-2.37-2.37-3.84-5.63-3.84-9.23v0c0-3.6,1.47-6.86,3.84-9.23C22.05,21.74,25.32,20.27,28.91,20.27L28.91,20.27z M94.7,24.8H28.91 c-2.35,0-4.48,0.96-6.03,2.51c-1.55,1.55-2.51,3.68-2.51,6.03v0c0,2.35,0.96,4.48,2.51,6.03c1.55,1.55,3.68,2.51,6.03,2.51H94.7 c2.35,0,4.48-0.96,6.03-2.51c1.55-1.55,2.51-3.68,2.51-6.03v0c0-2.35-0.96-4.48-2.51-6.03C99.18,25.76,97.05,24.8,94.7,24.8 L94.7,24.8z M25.18,92.58v8.76c0,1.25-1.01,2.26-2.26,2.26c-1.25,0-2.26-1.01-2.26-2.26v-8.87c-1.17-0.39-2.22-1.04-3.07-1.89 c-1.41-1.41-2.29-3.37-2.29-5.52c0-2.16,0.87-4.11,2.29-5.52c1.41-1.41,3.37-2.29,5.52-2.29c2.16,0,4.11,0.87,5.52,2.29 c1.41,1.41,2.29,3.37,2.29,5.52c0,2.16-0.87,4.11-2.29,5.52C27.68,91.52,26.5,92.22,25.18,92.58L25.18,92.58z M25.42,82.73 c-0.59-0.59-1.41-0.96-2.32-0.96c-0.91,0-1.73,0.37-2.32,0.96c-0.59,0.59-0.96,1.41-0.96,2.32c0,0.91,0.37,1.73,0.96,2.32 c0.59,0.59,1.41,0.96,2.32,0.96c0.91,0,1.73-0.37,2.32-0.96c0.59-0.59,0.96-1.41,0.96-2.32C26.39,84.15,26.02,83.33,25.42,82.73 L25.42,82.73z"/>
                  </g>
                </svg>
                <div style={{ fontSize: '11px', marginTop: '5px', fontWeight: '600', color: '#333' }}>
                  {lock.name}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  {lock.status === 'connected' ? '🟢' : lock.status === 'error' ? '🔴' : '⚪'} {lock.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DROITE: Canvas Konva */}
        <div
          ref={canvasContainerRef}
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (isDragging && stageRef.current) {
              stageRef.current.setPointersPositions(e);
              const pos = stageRef.current.getPointerPosition();
              if (pos) {
                if (draggedType === 'line') {
                  setComponents([
                    ...components,
                    {
                      x: pos.x,
                      y: pos.y,
                      points: linePoints,
                      id: `line-${Date.now()}`,
                      scaleX: 1,
                      scaleY: 1,
                      rotation: 0,
                    } as LineData,
                  ]);
                } else if (draggedType === 'lock' && draggedLockId) {
                  // Add lock with real DB ID and name
                  const newLock: LockData = {
                    x: pos.x,
                    y: pos.y,
                    type: 'lock' as const,
                    id: `lock-${Date.now()}`,
                    lock_id: draggedLockId,
                    lock_name: draggedLockName || undefined,
                    scaleX: 1,
                    scaleY: 1,
                    rotation: 0,
                  };
                  setComponents([...components, newLock]);
                  // Mark lock as placed
                  setPlacedLockIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(draggedLockId);
                    return newSet;
                  });
                }
              }
              setIsDragging(false);
              setDraggedType(null);
              setDraggedLockId(null);
              setDraggedLockName(null);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => {
            setIsDragOver(false);
          }}
        >
          {/* Save button */}
          <button
            onClick={saveSchematic}
            disabled={isSaving}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '12px 24px',
              backgroundColor: isSaving ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              zIndex: 1000
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#45a049';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#4CAF50';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>

          {/* Save message */}
          {saveMessage && (
            <div style={{
              position: 'absolute',
              top: '70px',
              right: '20px',
              padding: '10px 20px',
              backgroundColor: saveMessage.includes('✅') ? '#d4edda' : '#f8d7da',
              color: saveMessage.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${saveMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
              animation: 'fadeIn 0.3s ease-in'
            }}>
              {saveMessage}
            </div>
          )}

          {/* Helper text */}
          {selectedId && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              zIndex: 1000,
              whiteSpace: 'nowrap'
            }}>
              Appuyez sur <strong>Delete</strong> ou <strong>Backspace</strong> pour supprimer
            </div>
          )}

          <div style={{
            border: isDragOver ? '3px solid #4CAF50' : '2px solid #ddd',
            borderRadius: '8px',
            backgroundColor: isDragOver ? '#f0f8f0' : 'white',
            transition: 'all 0.2s ease',
            boxShadow: isDragOver ? '0 0 20px rgba(76, 175, 80, 0.3)' : 'none',
            display: 'inline-block'
          }}>
            {/* @ts-ignore - react-konva v19 type issue */}
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              ref={stageRef}
              onMouseDown={checkDeselect}
              onTouchStart={checkDeselect}
            >
              <Layer>
              {isLoading ? (
                <Text text="Chargement du schéma..." fontSize={20} fill="#888" padding={20} />
              ) : (
                components.map((component, i) => {
                  if ('points' in component) {
                    return (
                      <TransformableLine
                        key={component.id}
                        shapeProps={component}
                        isSelected={component.id === selectedId}
                        onSelect={() => {
                          setSelectedId(component.id);
                          setSelectedObjectDetails(component);
                        }}
                        onChange={(newAttrs) => {
                          const comps = components.slice();
                          comps[i] = newAttrs;
                          setComponents(comps);
                        }}
                        isDragging={draggingComponentIndex === i}
                        onDragStart={() => setDraggingComponentIndex(i)}
                        onDragEnd={() => setDraggingComponentIndex(null)}
                      />
                    );
                  } else if (component.type === 'lock') {
                    return (
                      <TransformableLock
                        key={component.id}
                        shapeProps={component}
                        isSelected={component.id === selectedId}
                        onSelect={() => {
                          setSelectedId(component.id);
                          setSelectedObjectDetails(component);
                        }}
                        onChange={(newAttrs) => {
                          const comps = components.slice();
                          comps[i] = newAttrs;
                          setComponents(comps);
                        }}
                        isDragging={draggingComponentIndex === i}
                        onDragStart={() => setDraggingComponentIndex(i)}
                        onDragEnd={() => setDraggingComponentIndex(null)}
                      />
                    );
                  }
                  return null;
                })
              )}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* PETIT CARRÉ D'INFOS */}
        {selectedObjectDetails && (
          <div style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            width: '220px',
            backgroundColor: 'white',
            borderRadius: '6px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '13px' }}>
                {'type' in selectedObjectDetails && selectedObjectDetails.type === 'lock' ? 'Serrure' : 'Mur'}
              </span>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setSelectedObjectDetails(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {'type' in selectedObjectDetails && selectedObjectDetails.type === 'lock' ? (
              <>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#666', fontSize: '11px' }}>Nom: </span>
                  <span style={{ fontWeight: '500' }}>
                    {selectedObjectDetails.lock_name || 'Sans nom'}
                  </span>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#666', fontSize: '11px' }}>ID: </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                    {selectedObjectDetails.lock_id || 'N/A'}
                  </span>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#666', fontSize: '11px' }}>Statut: </span>
                  {(() => {
                    const lock = availableLocks.find(l => l.id_lock === selectedObjectDetails.lock_id);
                    const status = lock?.status || 'unknown';
                    const statusColors: Record<string, string> = {
                      'connected': '#4CAF50',
                      'disconnected': '#F44336',
                      'error': '#FF9800',
                      'unknown': '#9E9E9E'
                    };
                    const statusLabels: Record<string, string> = {
                      'connected': 'Connecté',
                      'disconnected': 'Déconnecté',
                      'error': 'Erreur',
                      'unknown': 'Inconnu'
                    };
                    return (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: statusColors[status] || statusColors['unknown'],
                          display: 'inline-block'
                        }} />
                        <span style={{ fontSize: '11px' }}>
                          {statusLabels[status] || 'Inconnu'}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#666', fontSize: '11px' }}>ID: </span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                  {selectedObjectDetails.id}
                </span>
              </div>
            )}

            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>
                X: {Math.round(selectedObjectDetails.x)}, Y: {Math.round(selectedObjectDetails.y)}
                {selectedObjectDetails.rotation !== undefined && `, ${Math.round(selectedObjectDetails.rotation)}°`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal pour ajouter un bâtiment */}
      {showAddBuildingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}
        onClick={() => setShowAddBuildingModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            minWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Ajouter un nouveau bâtiment</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              const floor = parseInt(formData.get('floor') as string);

              const success = await createBuilding(name, description, floor);
              if (success) {
                setShowAddBuildingModal(false);
              } else {
                alert('Erreur lors de la création du bâtiment');
              }
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                  Nom du bâtiment *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                  placeholder="Ex: Bâtiment A"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="Description du bâtiment (optionnel)"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                  Nombre d'étages *
                </label>
                <input
                  type="number"
                  name="floor"
                  min="1"
                  defaultValue="1"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddBuildingModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ddd',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un étage */}
      {showAddFloorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}
        onClick={() => setShowAddFloorModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            minWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Ajouter un nouvel étage</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;

              if (selectedBuildingId) {
                const success = await createFloor(selectedBuildingId, name, description);
                if (success) {
                  setShowAddFloorModal(false);
                } else {
                  alert('Erreur lors de la création de l\'étage');
                }
              }
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                  Bâtiment
                </label>
                <input
                  type="text"
                  value={buildings.find(b => b.id === selectedBuildingId)?.name || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: '#f5f5f5',
                    color: '#666'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                  Nom de l'étage *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                  placeholder="Ex: Étage 1, Rez-de-chaussée, etc."
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="Description de l'étage (optionnel)"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddFloorModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ddd',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KonvaCanva;