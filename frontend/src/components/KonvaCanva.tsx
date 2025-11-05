import React from "react";
import { Stage, Layer, Line, Path, Transformer } from "react-konva";
import Konva from "konva";

// ✅ Correction TS : le Stage typé pour accepter children
const StageAny = Stage as unknown as React.FC<any>;

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
  type: "lock";
  id: string;
  lock_id?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

type ComponentData = LineData | LockData;

interface KonvaCanvaProps {
  onNavigate: (page: string) => void;
  schematicId: number;
}

const TransformableLine: React.FC<any> = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  isDragging,
  onDragStart,
  onDragEnd,
}) => {
  const shapeRef = React.useRef<Konva.Line>(null);
  const trRef = React.useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Line
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        points={shapeProps.points}
        x={shapeProps.x}
        y={shapeProps.y}
        scaleX={shapeProps.scaleX || 1}
        scaleY={shapeProps.scaleY || 1}
        stroke={isDragging || isHovered ? "#4CAF50" : "black"}
        strokeWidth={isSelected ? 4 : 2}
        hitStrokeWidth={20} // ✅ zone cliquable élargie
        lineCap="round"
        lineJoin="round"
        draggable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragStart={onDragStart}
        rotation={shapeProps.rotation || 0}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          onDragEnd();
          const node = e.target as Konva.Line;
          onChange({ ...shapeProps, x: node.x(), y: node.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
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
      {isSelected && <Transformer ref={trRef} flipEnabled={false} />}
    </>
  );
};

const TransformableLock: React.FC<any> = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  isDragging,
  onDragStart,
  onDragEnd,
}) => {
  const shapeRef = React.useRef<Konva.Path>(null);
  const trRef = React.useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Path
        onClick={onSelect}
        ref={shapeRef}
        data="M40.92,53.31c0-1.25,1.01-2.26,2.26-2.26..."
        x={shapeProps.x}
        y={shapeProps.y}
        scaleX={(shapeProps.scaleX || 1) * 0.4}
        scaleY={(shapeProps.scaleY || 1) * 0.4}
        fill={isDragging || isHovered ? "#4CAF50" : "black"}
        hitStrokeWidth={20} // ✅ zone cliquable élargie
        draggable
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragStart={onDragStart}
        rotation={shapeProps.rotation || 0}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          onDragEnd();
          const node = e.target as Konva.Path;
          onChange({ ...shapeProps, x: node.x(), y: node.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX() / 0.4,
            scaleY: node.scaleY() / 0.4,
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} flipEnabled={false} />}
    </>
  );
};

const KonvaCanva: React.FC<KonvaCanvaProps> = ({ schematicId }) => {
  const stageRef = React.useRef<Konva.Stage>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [components, setComponents] = React.useState<ComponentData[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [stageSize, setStageSize] = React.useState({ width: 800, height: 600 });

  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: window.innerHeight - 100,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px 0",
            fontSize: "20px",
            fontWeight: "600",
          }}
        >
          Schéma
        </h2>

        <StageAny
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          style={{
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "white",
          }}
          onMouseDown={(e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.target === e.target.getStage()) setSelectedId(null);
          }}
        >
          <Layer>
            {components.map((c, i) =>
              "points" in c ? (
                <TransformableLine
                  key={c.id}
                  shapeProps={c}
                  isSelected={selectedId === c.id}
                  onSelect={() => setSelectedId(c.id)}
                  onChange={(newAttrs: LineData) => {
                    const updated = [...components];
                    updated[i] = newAttrs;
                    setComponents(updated);
                  }}
                />
              ) : (
                <TransformableLock
                  key={c.id}
                  shapeProps={c}
                  isSelected={selectedId === c.id}
                  onSelect={() => setSelectedId(c.id)}
                  onChange={(newAttrs: LockData) => {
                    const updated = [...components];
                    updated[i] = newAttrs;
                    setComponents(updated);
                  }}
                />
              )
            )}
          </Layer>
        </StageAny>
      </div>
    </div>
  );
};

export default KonvaCanva;