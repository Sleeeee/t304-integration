import React from 'react';
import { Stage, Layer, Line, Path, Transformer } from 'react-konva';
import Konva from 'konva';

interface LineData {
  x: number;
  y: number;
  points: number[];
  id: string;
  scaleX?: number;
  scaleY?: number;
}

interface LockData {
  x: number;
  y: number;
  type: 'lock';
  id: string;
  lock_id?: number; 
  scaleX?: number;
  scaleY?: number;
}

type ComponentData = LineData | LockData;

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
  const shapeRef = React.useRef<any>();
  const trRef = React.useRef<any>();
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
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
        lineCap="round"
        lineJoin="round"
        draggable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragStart={onDragStart}
        // @ts-ignore - React 19 Incompatible
        onDragEnd={(e) => {
          onDragEnd();
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            scaleX: scaleX,
            scaleY: scaleY,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          // @ts-ignore - React 19 Incompatible
          boundBoxFunc={(oldBox, newBox) => {
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
  const shapeRef = React.useRef<any>();
  const trRef = React.useRef<any>();
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Path
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        data="M40.92,53.31c0-1.25,1.01-2.26,2.26-2.26c1.25,0,2.26,1.01,2.26,2.26v46.84c0,6.25-2.56,11.93-6.67,16.05 c-4.12,4.12-9.8,6.67-16.05,6.67h0c-6.25,0-11.93-2.56-16.05-6.67C2.56,112.09,0,106.41,0,100.16V22.72 c0-6.25,2.56-11.93,6.67-16.05C10.79,2.56,16.47,0,22.72,0h0c4.04,0,7.85,1.08,11.16,2.96c3.42,1.94,6.29,4.75,8.32,8.12 c0.64,1.07,0.29,2.46-0.78,3.1c-1.07,0.64-2.46,0.29-3.1-0.78c-1.62-2.7-3.93-4.95-6.68-6.51c-2.64-1.5-5.69-2.35-8.93-2.35h0 c-5,0-9.55,2.05-12.85,5.35c-3.3,3.3-5.35,7.85-5.35,12.85v77.44c0,5,2.05,9.55,5.35,12.85c3.3,3.3,7.85,5.35,12.85,5.35h0 c5,0,9.55-2.05,12.85-5.35c3.3-3.3,5.35-7.85,5.35-12.85V53.31L40.92,53.31z M28.91,20.27H94.7c3.6,0,6.86,1.47,9.23,3.84 c2.37,2.37,3.84,5.63,3.84,9.23v0c0,3.6-1.47,6.86-3.84,9.23c-2.37,2.37-5.63,3.84-9.23,3.84H28.91c-3.6,0-6.86-1.47-9.23-3.84 c-2.37-2.37-3.84-5.63-3.84-9.23v0c0-3.6,1.47,6.86,3.84-9.23C22.05,21.74,25.32,20.27,28.91,20.27L28.91,20.27z M94.7,24.8H28.91 c-2.35,0-4.48,0.96-6.03,2.51c-1.55,1.55-2.51,3.68-2.51,6.03v0c0,2.35,0.96,4.48,2.51,6.03c1.55,1.55,3.68,2.51,6.03,2.51H94.7 c2.35,0,4.48-0.96,6.03-2.51c1.55-1.55,2.51-3.68,2.51-6.03v0c0-2.35-0.96-4.48-2.51-6.03C99.18,25.76,97.05,24.8,94.7,24.8 L94.7,24.8z M25.18,92.58v8.76c0,1.25-1.01,2.26-2.26,2.26c-1.25,0-2.26-1.01-2.26-2.26v-8.87c-1.17-0.39-2.22-1.04-3.07-1.89 c-1.41-1.41-2.29-3.37-2.29-5.52c0-2.16,0.87-4.11,2.29-5.52c1.41-1.41,3.37-2.29,5.52-2.29c2.16,0,4.11,0.87,5.52,2.29 c1.41,1.41,2.29,3.37,2.29,5.52c0,2.16-0.87,4.11-2.29,5.52C27.68,91.52,26.5,92.22,25.18,92.58L25.18,92.58z M25.42,82.73 c-0.59-0.59-1.41-0.96-2.32-0.96c-0.91,0-1.73,0.37-2.32,0.96c-0.59,0.59-0.96,1.41-0.96,2.32c0,0.91,0.37,1.73,0.96,2.32 c0.59,0.59,1.41,0.96,2.32,0.96c0.91,0,1.73-0.37,2.32-0.96c0.59-0.59,0.96,1.41,0.96-2.32C26.39,84.15,26.02,83.33,25.42,82.73 L25.42,82.73z"
        x={shapeProps.x}
        y={shapeProps.y}
        scaleX={(shapeProps.scaleX || 1) * 0.4}
        scaleY={(shapeProps.scaleY || 1) * 0.4}
        fill={isDragging || isHovered ? '#4CAF50' : 'black'}
        draggable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragStart={onDragStart}
        // @ts-ignore - React 19 Incompatible
        onDragEnd={(e) => {
          onDragEnd();
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(0.4);
          node.scaleY(0.4);

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            scaleX: scaleX / 0.4,
            scaleY: scaleY / 0.4,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          // @ts-ignore - React 19 Incompatible
          boundBoxFunc={(oldBox, newBox) => {
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

const KonvaCanva: React.FC<KonvaCanvaProps> = ({ onNavigate, schematicId }) => {
  const stageRef = React.useRef<Konva.Stage>(null);
  const [components, setComponents] = React.useState<ComponentData[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [draggedType, setDraggedType] = React.useState<'line' | 'lock' | null>(null);
  const [draggedItemActive, setDraggedItemActive] = React.useState<'line' | 'lock' | null>(null);
  const [draggingComponentIndex, setDraggingComponentIndex] = React.useState<number | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [stageSize, setStageSize] = React.useState({ width: 600, height: 500 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // États pour le chargement et la sauvegarde
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const linePoints = [0, 0, 100, 0];

  // Chargement des données au montage
  React.useEffect(() => {
    const loadData = async () => {
      if (!schematicId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/schematics/${schematicId}/data/`);
        if (!response.ok) throw new Error('Failed to fetch schematic data');
        
        const data = await response.json();
        setComponents(data.components || []);

      } catch (error) {
        console.error("Error loading schematic data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [schematicId]);

  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: window.innerHeight - 430 
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };
  
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setComponents(prev => prev.filter(c => c.id !== selectedId));
    setSelectedId(null); 
  };

  const handleSave = async () => {
    if (!schematicId) return;
    setIsSaving(true);

    const payload = {
      components: components.map(c => ({
        ...c,
        scaleX: c.scaleX || 1, 
        scaleY: c.scaleY || 1,
      })),
    };

    try {
      const response = await fetch(`/api/schematics/${schematicId}/save/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save schematic');
      }

      const result = await response.json();
      console.log('Save successful:', result.message);
      alert('Schéma sauvegardé !');
    } catch (error) {
      console.error('Error saving schematic:', error);
      alert(`Erreur lors de la sauvegarde: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderToolbar = () => {
    return (
      <div style={{
        marginBottom: '15px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        height: '30px',
      }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '8px 16px',
            backgroundColor: isSaving ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        {selectedId && (
          <button
            onClick={handleDeleteSelected}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Supprimer la sélection
          </button>
        )}
      </div>
    );
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
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        flex: '1'
      }}>
        
        {/* Schematic */}
        <div style={{ 
          flex: '1',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '600' }}>Schematic</h2>
            {renderToolbar()}
            
            <div style={{ display: 'flex', gap: '20px', height: stageSize.height }}>
              {/* Palette de composants */}
              <div style={{
                width: '150px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                padding: '15px',
                border: '2px dashed #ddd',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600' }}>Composants</h3>
                
                {/* Ligne draggable */}
                <div
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: draggedItemActive === 'line' ? '#90EE90' : 'white',
                    border: '2px solid #333',
                    borderRadius: '4px',
                    cursor: 'grab',
                    textAlign: 'center',
                    transition: 'background-color 0.2s ease'
                  }}
                  draggable="true"
                  onDragStart={() => {
                    setIsDragging(true);
                    setDraggedType('line');
                    setDraggedItemActive('line');
                  }}
                  onDragEnd={() => {
                    setIsDragging(false);
                    setDraggedItemActive(null);
                  }}
                >
                  <svg width="100" height="20">
                    <line x1="10" y1="10" x2="90" y2="10" stroke="black" strokeWidth="3" />
                  </svg>
                  <div style={{ fontSize: '11px', marginTop: '5px', color: '#666' }}>Ligne</div>
                </div>

                {/* Serrure draggable */}
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: draggedItemActive === 'lock' ? '#90EE90' : 'white',
                    border: '2px solid #333',
                    borderRadius: '4px',
                    cursor: 'grab',
                    textAlign: 'center',
                    transition: 'background-color 0.2s ease'
                  }}
                  draggable="true"
                  onDragStart={() => {
                    setIsDragging(true);
                    setDraggedType('lock');
                    setDraggedItemActive('lock');
                  }}
                  onDragEnd={() => {
                    setIsDragging(false);
                    setDraggedItemActive(null);
                  }}
                >
                  <svg width="50" height="60" viewBox="-7.55 0 122.88 122.88" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path d="M40.92,53.31c0-1.25,1.01-2.26,2.26-2.26c1.25,0,2.26,1.01,2.26,2.26v46.84c0,6.25-2.56,11.93-6.67,16.05 c-4.12,4.12-9.8,6.67-16.05,6.67h0c-6.25,0-11.93-2.56-16.05-6.67C2.56,112.09,0,106.41,0,100.16V22.72 c0-6.25,2.56-11.93,6.67-16.05C10.79,2.56,16.47,0,22.72,0h0c4.04,0,7.85,1.08,11.16,2.96c3.42,1.94,6.29,4.75,8.32,8.12 c0.64,1.07,0.29,2.46-0.78,3.1c-1.07,0.64-2.46,0.29-3.1-0.78c-1.62-2.7-3.93-4.95-6.68-6.51c-2.64-1.5-5.69-2.35-8.93-2.35h0 c-5,0-9.55,2.05-12.85,5.35c-3.3,3.3-5.35,7.85-5.35,12.85v77.44c0,5,2.05,9.55,5.35,12.85c3.3,3.3,7.85,5.35,12.85,5.35h0 c5,0,9.55-2.05,12.85-5.35c3.3-3.3,5.35-7.85,5.35-12.85V53.31L40.92,53.31z M28.91,20.27H94.7c3.6,0,6.86,1.47,9.23,3.84 c2.37,2.37,3.84,5.63,3.84,9.23v0c0,3.6-1.47,6.86-3.84,9.23c-2.37,2.37-5.63,3.84-9.23,3.84H28.91c-3.6,0-6.86-1.47-9.23-3.84 c-2.37-2.37-3.84-5.63-3.84-9.23v0c0-3.6,1.47,6.86,3.84-9.23C22.05,21.74,25.32,20.27,28.91,20.27L28.91,20.27z M94.7,24.8H28.91 c-2.35,0-4.48,0.96-6.03,2.51c-1.55,1.55-2.51,3.68-2.51,6.03v0c0,2.35,0.96,4.48,2.51,6.03c1.55,1.55,3.68,2.51,6.03,2.51H94.7 c2.35,0,4.48-0.96,6.03-2.51c1.55-1.55,2.51-3.68,2.51-6.03v0c0-2.35-0.96-4.48-2.51-6.03C99.18,25.76,97.05,24.8,94.7,24.8 L94.7,24.8z M25.18,92.58v8.76c0,1.25-1.01,2.26-2.26,2.26c-1.25,0-2.26-1.01-2.26-2.26v-8.87c-1.17-0.39-2.22-1.04-3.07-1.89 c-1.41-1.41-2.29-3.37-2.29-5.52c0-2.16,0.87-4.11,2.29-5.52c1.41-1.41,3.37-2.29,5.52-2.29c2.16,0,4.11,0.87,5.52,2.29 c1.41,1.41,2.29,3.37,2.29,5.52c0,2.16-0.87,4.11-2.29,5.52C27.68,91.52,26.5,92.22,25.18,92.58L25.18,92.58z M25.42,82.73 c-0.59-0.59-1.41-0.96-2.32-0.96c-0.91,0-1.73,0.37-2.32,0.96c-0.59,0.59-0.96,1.41-0.96,2.32c0,0.91,0.37,1.73,0.96,2.32 c0.59,0.59,1.41,0.96,2.32,0.96c0.91,0,1.73-0.37,2.32-0.96c0.59-0.59,0.96,1.41,0.96-2.32C26.39,84.15,26.02,83.33,25.42,82.73 L25.42,82.73z"/>
                    </g>
                  </svg>
                  <div style={{ fontSize: '11px', marginTop: '5px', color: '#666' }}>Serrure</div>
                </div>
              </div>

              {/* Canvas Konva */}
              <div
                ref={containerRef}
                style={{ flex: 1, position: 'relative' }}
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
                          } as LineData,
                        ]);
                      } else if (draggedType === 'lock') {
                        setComponents([
                          ...components,
                          {
                            x: pos.x,
                            y: pos.y,
                            type: 'lock' as const,
                            id: `lock-${Date.now()}`,
                            lock_id: 1, 
                            scaleX: 1,
                            scaleY: 1,
                          } as LockData,
                        ]);
                      }
                    }
                    setIsDragging(false);
                    setDraggedType(null);
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
                {/* @ts-ignore - React 19 Incompatible */}
                <Stage
                  width={stageSize.width}
                  height={stageSize.height}
                  style={{ 
                    border: isDragOver ? '3px solid #4CAF50' : '2px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: isDragOver ? '#f0f8f0' : 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: isDragOver ? '0 0 20px rgba(76, 175, 80, 0.3)' : 'none'
                  }}
                  ref={stageRef}
                  onMouseDown={checkDeselect}
                  onTouchStart={checkDeselect}
                >
                  <Layer>
                    {/* Affichage du chargement */}
                    {isLoading ? (
                      <Konva.Text text="Chargement du schéma..." fontSize={20} fill="#888" padding={20} />
                    ) : (
                      components.map((component, i) => {
                        if ('points' in component) {
                          return (
                            <TransformableLine
                              key={component.id}
                              shapeProps={component}
                              isSelected={component.id === selectedId}
                              onSelect={() => setSelectedId(component.id)}
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
                              onSelect={() => setSelectedId(component.id)}
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
</div>
</div>
<div style={{
flex: '1',
display: 'flex',
flexDirection: 'column'
}}>
<div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: '100%'
          }}>
<h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Logs</h2>
<div style={{
              height: 'calc(100% - 40px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              border: '2px dashed #ddd',
              borderRadius: '8px'
            }}>
Please choose a door/user
</div>
</div>
</div>
</div>
<div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: '250px'
      }}>
<h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Users</h2>
<div style={{
          height: 'calc(100% - 40px)',
          border: '2px dashed #ddd',
          borderRadius: '8px'
        }}>
{/* Zone vide pour l'instant */}
</div>
</div>
</div>
);
};

export default KonvaCanva;