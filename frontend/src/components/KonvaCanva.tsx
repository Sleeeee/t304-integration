import React from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';

interface LineData {
  x: number;
  y: number;
  points: number[];
}

interface DraggableLineProps {
  line: LineData;
}

interface KonvaCanvaProps {
  onNavigate: (page: string) => void;
}

const DraggableLine: React.FC<DraggableLineProps> = ({ line }) => {
  return (
    <Line
      points={line.points}
      x={line.x}
      y={line.y}
      stroke="black"
      strokeWidth={3}
      lineCap="round"
      lineJoin="round"
      draggable
    />
  );
};

const KonvaCanva: React.FC<KonvaCanvaProps> = ({ onNavigate }) => {
  const stageRef = React.useRef<Konva.Stage>(null);
  const [lines, setLines] = React.useState<LineData[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  const linePoints = [0, 0, 100, 0]; // Ligne horizontale de 100px

  return (
    <div>
      Essayez de glisser-déposer la ligne dans la zone :
      <br />
      <div
        style={{
          display: 'inline-block',
          margin: '10px',
          padding: '10px',
          border: '2px solid #333',
          cursor: 'grab',
          backgroundColor: '#f0f0f0'
        }}
        draggable="true"
        onDragStart={() => {
          setIsDragging(true);
        }}
        onDragEnd={() => {
          setIsDragging(false);
        }}
      >
        <svg width="100" height="20">
          <line x1="0" y1="10" x2="100" y2="10" stroke="black" strokeWidth="3" />
        </svg>
      </div>
      <div
        onDrop={(e) => {
          e.preventDefault();
          if (isDragging && stageRef.current) {
            stageRef.current.setPointersPositions(e);
            const pos = stageRef.current.getPointerPosition();
            if (pos) {
              setLines([
                ...lines,
                {
                  x: pos.x,
                  y: pos.y,
                  points: linePoints,
                },
              ]);
            }
            setIsDragging(false);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* @ts-ignore - React 19 compatibility issue with react-konva */}
        <Stage
          width={window.innerWidth}
          height={window.innerHeight - 100}
          style={{ border: '1px solid grey' }}
          ref={stageRef}
        >
          <Layer>
            {lines.map((line, i) => (
              <DraggableLine key={i} line={line} />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default KonvaCanva;