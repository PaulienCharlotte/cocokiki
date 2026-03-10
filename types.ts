
export interface Location {
  id: string;
  name: string;
  provinceId: string;
  type: 'city' | 'water' | 'region' | 'mountain';
  lat: number; 
  lng: number; 
  fact?: string;
  clusterId?: string;
}

export interface Cluster {
  id: string;
  name: string;
  icon: string;
  provinceId: string;
}

export interface Province {
  id: string;
  name: string;
  color: string;
  capital: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
}

export type GameMode = 'explore' | 'find' | 'spell' | 'master';

export interface GameState {
  currentMode: GameMode;
  selectedProvinceId: string | 'all';
  score: number;
  streak: number;
  passport: string[]; 
}

export interface QuizQuestion {
  target: Location;
  options?: string[];
  type: 'point' | 'name' | 'spell';
}
