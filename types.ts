
export interface Location {
  id: string;
  name: string;
  provinceId: string;
  type: 'city' | 'water' | 'region' | 'mountain' | 'province' | 'country';
  lat: number; 
  lng: number; 
  fact?: string;
  clusterId?: string;
  isCapital?: boolean;
  isoAlpha3?: string;
  geoName?: string;
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
  isStudyArea?: boolean;
}

export type GameMode = 'explore' | 'find' | 'spell' | 'master' | 'memory' | 'mnemonic' | 'test';

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
