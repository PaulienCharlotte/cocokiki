import { CHARACTERS, type CharacterId } from '../data/characters';

/** De bewoners zijn de personages uit `data/characters.ts`, geen eigen lijst. */
export type ResidentId = Extract<CharacterId, 'coco' | 'kiki' | 'lua' | 'seb'>;
export type LocationIcon = 'recipes' | 'orders' | 'math' | 'nutrition' | 'clinic' | 'plants' | 'book' | 'grow' | 'clock';
export interface LocationActivity {
  id: string;
  label: string;
  icon: LocationIcon;
  image?: string;
  tone?: 'honey' | 'sage' | 'sky' | 'berry';
  target: { activity: string } | { section: 'adventures' | 'math' } | { comingSoon: true };
}
// Future multi-activity stories, deliberately not recipe/plant progress.
export interface LocationAdventure { id: string; name: string; activityIds: string[]; status: 'coming-soon' }
// Presentation only; deliberately separate from playable engine definitions/runs.
export interface AdventurePreview {
  id: string;
  title: string;
  description: string;
  image: string;
  tone: 'honey' | 'sage' | 'sky' | 'berry';
  status: 'available' | 'active' | 'completed' | 'locked';
  progress?: { completed: number; total: number };
}
export interface WorldLocation {
  id: ResidentId;
  islandId: 'cooking' | 'plants' | 'math' | 'discovery';
  path: '/islands/cooking' | '/islands/plants' | '/islands/math' | '/islands/discovery';
  name: string;
  background: string;
  backgroundPosition: { desktop: string; mobile: string };
  /** De tekening van het klembord op deze plek. */
  clipboard?: string;
  accentColor: string;
  character: { id: ResidentId; name: string };
  activities: LocationActivity[];
  featuredActivities: string[];
  practiceActivities: string[];
  adventures: LocationAdventure[];
  presentation?: 'game';
  adventurePreviews?: AdventurePreview[];
}
export const WORLD_LOCATIONS: WorldLocation[] = [
  {
    id: 'seb', islandId: 'discovery', path: '/islands/discovery', name: 'Seb’s Ontdekkingskamer',
    background: '/dreamworld/topo-interior.webp',
    clipboard: '/assets/library/travel/klembord.webp',
    backgroundPosition: { desktop: 'center', mobile: 'center' },
    accentColor: 'var(--ck-wereld)', character: { id: 'seb', name: CHARACTERS.seb.naam },
    activities: [],
    featuredActivities: [],
    practiceActivities: [], adventures: [],
  },
  {
    id: 'lua', islandId: 'math', path: '/islands/math', name: 'Lua’s werkplaats',
    background: '/dreamworld/lua-workshop.webp',
    clipboard: '/assets/library/school/klembord.webp',
    backgroundPosition: { desktop: 'center', mobile: 'center' },
    accentColor: 'var(--ck-actief)', character: { id: 'lua', name: CHARACTERS.lua.naam },
    activities: [],
    featuredActivities: [],
    practiceActivities: [], adventures: [],
  },
  {
    id: 'coco', islandId: 'cooking', path: '/islands/cooking', name: 'Coco’s kookstudio',
    background: '/dreamworld/locations/coco-bakery-discovery.webp',
    backgroundPosition: { desktop: '28% center', mobile: '18% center' },
    clipboard: '/assets/library/cooking/klembord.webp',
    accentColor: 'var(--ck-keuken)', character: { id: 'coco', name: CHARACTERS.coco.naam },
    presentation: 'game',
    activities: [],
    featuredActivities: [],
    practiceActivities: [],
    adventures: [],
    adventurePreviews: [],
  },
  {
    id: 'kiki', islandId: 'plants', path: '/islands/plants', name: 'Kiki’s moestuin',
    background: '/dreamworld/locations/kiki-greenhouse-discovery.webp',
    backgroundPosition: { desktop: 'center', mobile: '38% center' },
    clipboard: '/assets/library/plants/klembord.webp',
    accentColor: 'var(--ck-actief)', character: { id: 'kiki', name: CHARACTERS.kiki.naam },
    presentation: 'game',
    activities: [], featuredActivities: [], practiceActivities: [], adventures: [],
    adventurePreviews: [],
  },
];
