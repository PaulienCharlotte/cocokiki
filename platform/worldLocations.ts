import { RECIPES } from '../data/cooking/catalog';
import { PLANT_SPECIES } from '../data/plants/species';
import { MATH_GAMES } from '../games/math/config';
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
  icon: 'muffin' | 'cake' | 'secret' | 'ingredients' | 'delivery' | 'contest';
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
    backgroundPosition: { desktop: 'center', mobile: '28% center' },
    accentColor: 'var(--color-reward-strong)', character: { id: 'coco', name: CHARACTERS.coco.naam },
    presentation: 'game',
    // Geen losse activiteitenkaarten: twee van de drie beloofden alleen
    // "binnenkort", en voedingsstoffen staat al in de encyclopedie in de
    // bovenbalk. Wat je hier doet begint bij een bestelling.
    activities: [],
    featuredActivities: RECIPES.map(recipe => `recipe:${recipe.id}`),
    practiceActivities: ['math:missing', 'math:balance', 'math:race', 'math:add-subtract'],
    adventures: [],
    adventurePreviews: [
      { id: 'bestellingen', title: 'Bestellingen', description: 'Er staat iemand aan de toonbank met een wens. Zoek uit welk recept erbij past en hoe vaak je moet bakken.', icon: 'delivery', image: '/assets/library/cooking/baking/blueberry-muffin.webp', tone: 'honey', status: 'available' },
      { id: 'birthday-cake', title: 'De verjaardagstaart', description: 'Er is iemand jarig! Coco wil een bijzondere taart maken, maar er moet nog veel worden voorbereid.', icon: 'cake', image: '/assets/library/cooking/kit/whisk.webp', tone: 'berry', status: 'locked' },
      { id: 'secret-recipe', title: 'Het geheime recept', description: 'Coco heeft een oud recept gevonden. Wat zou er op de ontbrekende stukjes staan?', icon: 'secret', image: '/assets/library/cooking/baking/vanilla-extract.webp', tone: 'sage', status: 'locked' },
      { id: 'missing-ingredients', title: 'De verdwenen ingrediënten', description: 'De bakkerij gaat bijna open, maar een paar ingrediënten zijn zoek. Waar zijn ze gebleven?', icon: 'ingredients', image: '/games/shop/products/blueberry.webp', tone: 'sky', status: 'locked' },
      { id: 'delivery-chaos', title: 'De bezorgchaos', description: 'De bestellingen staan klaar. Alleen zijn de pakketjes door elkaar geraakt!', icon: 'delivery', image: '/assets/library/cooking/baking/muffin-pan.webp', tone: 'sage', status: 'locked' },
      { id: 'baking-contest', title: 'De bakwedstrijd', description: 'Er komt een bakwedstrijd aan. Coco zoekt een bakmaatje voor een heerlijke inzending.', icon: 'contest', image: '/assets/library/cooking/baking/blueberry-muffin.webp', tone: 'honey', status: 'locked' },
    ],
  },
  {
    id: 'kiki', islandId: 'plants', path: '/islands/plants', name: 'Kiki’s Plantenkas',
    background: '/dreamworld/locations/kiki-greenhouse.png',
    backgroundPosition: { desktop: '32% center', mobile: '25% center' },
    accentColor: 'var(--color-primary)', character: { id: 'kiki', name: CHARACTERS.kiki.naam },
    activities: [
      { id: 'clinic', label: 'Plantendokter', icon: 'clinic', target: { activity: 'plant-clinic' } },
      { id: 'plants', label: 'Mijn planten', icon: 'plants', target: { activity: 'plant-family' } },
      { id: 'book', label: 'Plantenboek', icon: 'book', target: { activity: 'plant-book' } },
      { id: 'grow', label: 'Kweken', icon: 'grow', target: { comingSoon: true } },
    ],
    featuredActivities: PLANT_SPECIES.map(plant => `plant:${plant.id}`), practiceActivities: [], adventures: [],
  },
];
