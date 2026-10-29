export type ClockGameId = 'memory' | 'set-clock' | 'race' | 'world-times';
export type ClockLevel = 1 | 2 | 3 | 4 | 5;
export type ClockRaceMode = 'analog' | 'digital' | 'mixed';

export interface ClockTime {
  hours: number;
  minutes: number;
}

export interface ClockAngles {
  hour: number;
  minute: number;
}

export interface MemoryCardData {
  id: string;
  pairId: string;
  kind: 'analog' | 'digital';
  time: ClockTime;
}

export interface RaceRound {
  target: ClockTime;
  options: ClockTime[];
}

export interface ClockProgress {
  version: 1;
  completed: Record<ClockGameId, ClockLevel[]>;
}
