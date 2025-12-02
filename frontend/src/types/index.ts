export interface Lock {
  id_lock: number;
  name: string;
  description: string | null;
  status: 'connected' | 'disconnected' | 'error' | string;
  last_connexion: string | null;
  is_reservable: boolean;
  auth_methods?: string[];
}

export interface LockGroup {
  id_group: number;
  name: string;
  locks: Lock[]; 
}

// Pour l'objet 'schematic' principal de la réponse API
export interface SchematicInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  background_color: string;
}

// Pour un mur (wall) placé sur le canevas
export interface PlacedWall {
  id: string; // ex: "wall-1"
  x: number;
  y: number;
  points: number[];
  scaleX: number;
  scaleY: number;
  rotation: number;
  type: 'wall';
}

// Pour une serrure (lock) placée sur le canevas
export interface PlacedLock {
  id: string; // ex: "slock-1"
  x: number;
  y: number;
  type: 'lock';
  lock_id: number; // L'ID du modèle Lock
  lock_name: string;
  scaleX: number;
  scaleY: number;
  rotation: number;
  color: string;
}

// Un type qui peut être soit un mur, soit une serrure
export type PlacedComponent = PlacedWall | PlacedLock;

// Pour une serrure dans la barre latérale "disponible"
export interface AvailableLock {
  id: number; 
  name: string;
}

export interface SchematicEditorData {
  schematic: SchematicInfo;
  placed_components: PlacedComponent[];
  available_locks: AvailableLock[];
}