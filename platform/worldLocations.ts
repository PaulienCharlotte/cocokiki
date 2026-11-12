import { RECIPES } from '../data/cooking/catalog';
import { PLANT_SPECIES } from '../data/plants/species';
import { MATH_GAMES, GETEKENDE_MATH_GAMES } from '../games/math/config';
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
    backgroundPosition: { desktop: 'center', mobile: 'center' },
    accentColor: 'var(--color-sky)', character: { id: 'seb', name: CHARACTERS.seb.naam },
    // Geen losse iconen meer op de tekening: één raster kaarten, net als school.
    activities: [],
    featuredActivities: ['topo', 'flags-memory', 'clock'],
    practiceActivities: [], adventures: [],
  },
  {
    id: 'lua', islandId: 'math', path: '/islands/math', name: 'Baby Lua’s Rekenwerkplaats',
    // Rekenen hoort op school; de rekenspellen staan er al jaren in.
    background: '/games/school/school-interior.webp',
    backgroundPosition: { desktop: 'center', mobile: 'center' },
    accentColor: 'var(--color-primary)', character: { id: 'lua', name: CHARACTERS.lua.naam },
    // Geen knoppenrij: die wees naar dezelfde spellen als de kaarten eronder.
    // Kloklezen stond er alleen in, en staat nu gewoon tussen de kaarten.
    activities: [],
    featuredActivities: [...MATH_GAMES.map(game => `math:${game.id}`), 'clock'],
    practiceActivities: [], adventures: [],
  },
  {
    id: 'coco', islandId: 'cooking', path: '/islands/cooking', name: 'Coco’s Bakkerij',
    background: '/dreamworld/locations/coco-bakery.webp',
    backgroundPosition: { desktop: '28% center', mobile: '18% center' },
    clipboard: '/assets/library/cooking/klembord.webp',
    accentColor: 'var(--color-reward-strong)', character: { id: 'coco', name: CHARACTERS.coco.naam },
    presentation: 'game',
    // Vaste bestemmingen openen rechtstreeks; de toonbank bevat de opdrachten.
    activities: [],
    featuredActivities: RECIPES.map(recipe => `recipe:${recipe.id}`),
    practiceActivities: ['math:missing', 'math:balance', 'math:race', 'math:add-subtract'],
    adventures: [],
    adventurePreviews: [
      { id: 'bestellingen', title: 'De toonbank', description: 'Help een klant met een kookopdracht of een verjaardagstaart.', image: '/assets/library/cooking/klembord.webp', tone: 'honey', status: 'available' },
      { id: 'kookboek', title: 'Het kookboek', description: 'Kies een recept of versier vrij een taart.', image: '/assets/library/cooking/baking/blueberry-muffin.webp', tone: 'sage', status: 'available' },
      { id: 'taartenatelier', title: 'Taart versieren', description: 'Maak en versier je eigen feestelijke taart.', image: '/assets/library/cooking/taarten/roze-rand.webp', tone: 'berry', status: 'available' },
      { id: 'voeding', title: 'Ontdek je eten', description: 'Ontdek samen met Coco wat je lichaam met eten doet.', image: '/assets/library/cooking/healthy/wholewheat-pasta.webp', tone: 'sage', status: 'available' },
    ],
  },
  {
    id: 'kiki', islandId: 'plants', path: '/islands/plants', name: 'Kiki’s Plantenkas',
    background: '/dreamworld/locations/kiki-greenhouse.webp',
    backgroundPosition: { desktop: 'center', mobile: '38% center' },
    clipboard: '/assets/library/plants/klembord.webp',
    accentColor: 'var(--color-primary)', character: { id: 'kiki', name: CHARACTERS.kiki.naam },
    presentation: 'game',
    // Alleen de plantendokter. Mijn planten en het plantenboek bestaan nog
    // wel, maar staan hier niet: liever minimaal dan rommelig. De routes
    // /plants/collection en /encyclopedie blijven gewoon werken.
    activities: [], featuredActivities: [], practiceActivities: [], adventures: [],
    adventurePreviews: [
      { id: 'plantendokter', title: 'De plantendokter', description: 'Er staat een plant klaar die het niet goed doet. Kijk wat er mis is en bedenk wat hij nodig heeft.', image: '/assets/library/plants/gereedschap/plantenspuit.webp', tone: 'sage', status: 'available' },
    ],
  },
];
