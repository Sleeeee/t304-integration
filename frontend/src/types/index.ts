export interface Lock {
  id_lock: number;
  name: string;
  description: string | null;
  status: 'connected' | 'disconnected' | 'error' | string;
  last_connexion: string | null;
}

export interface LockGroup {
  id_group: number;
  name: string;
  locks: Lock[]; 
}