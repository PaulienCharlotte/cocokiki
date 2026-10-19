export type TableChoice = number | 'mix';
export type LuaGameMode = 'calm' | 'adventure' | 'challenge';
export type QuestionType = 'classic' | 'missing' | 'check' | 'bigger' | 'factor';
export type GamePhase = 'menu' | 'tutorial' | 'active' | 'resolving' | 'results';

export interface Question {
  id: string;
  left: number;
  right: number;
  answer: number;
  choices: number[];
  choiceLabels: string[];
  prompt: string;
  explanation: string;
  type: QuestionType;
  difficulty: number;
  tables: number[];
}

export interface SessionStats {
  firstTry: number;
  eventual: number;
  missed: number;
  streak: number;
  bestStreak: number;
  score: number;
}

export interface Preferences {
  table: TableChoice;
  mode: LuaGameMode;
  sound: boolean;
  tutorialSeen: boolean;
}

export interface BestResult {
  score: number;
  stars: number;
}
