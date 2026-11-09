import { RECIPES } from '../data/cooking/catalog';
import { PLANT_SPECIES } from '../data/plants/species';
import { MATH_GAMES } from '../games/math/config';

export type ResidentId = 'milo' | 'novi' | 'felix';
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
  islandId: 'cooking' | 'plants' | 'math';
  path: '/islands/cooking' | '/islands/plants' | '/islands/math';
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
    id: 'felix', islandId: 'math', path: '/islands/math', name: 'Felix de Uitvinder',
    background: '/dreamworld/locations/felix-workshop.png',
    backgroundPosition: { desktop: '32% center', mobile: '25% center' },
    accentColor: 'var(--color-primary)', character: { id: 'felix', name: 'Felix de Uitvinder' },
    activities: [
      { id: 'multiply', label: 'Tafels oefenen', icon: 'math', target: { activity: 'math:multiply' } },
      { id: 'divide', label: 'Eerlijk delen', icon: 'math', target: { activity: 'math:divide' } },
      { id: 'balance', label: 'Rekenpuzzels', icon: 'math', target: { activity: 'math:balance' } },
      { id: 'clock', label: 'Kloklezen', icon: 'clock', target: { activity: 'clock' } },
    ],
    featuredActivities: MATH_GAMES.map(game => `math:${game.id}`),
    practiceActivities: [], adventures: [],
  },
  {
    id: 'milo', islandId: 'cooking', path: '/islands/cooking', name: 'Milo’s Bakkerij',
    background: '/dreamworld/locations/milo-bakery.png',
    backgroundPosition: { desktop: '32% center', mobile: '24% center' },
    accentColor: 'var(--color-reward-strong)', character: { id: 'milo', name: 'Milo' },
    presentation: 'game',
    activities: [
      { id: 'recipes', label: 'Recepten', icon: 'recipes', image: '/assets/library/cooking/baking/blueberry-muffin.webp', tone: 'honey', target: { activity: 'recipes' } },
      { id: 'groceries', label: 'Boodschappen', icon: 'orders', image: '/games/shop/products/flour.webp', tone: 'sage', target: { comingSoon: true } },
      { id: 'math', label: 'Bakrekenen', icon: 'math', image: '/assets/library/cooking/baking/measuring-jug.webp', tone: 'sky', target: { comingSoon: true } },
      { id: 'nutrition', label: 'Voedingsstoffen', icon: 'nutrition', image: '/games/shop/products/strawberry.webp', tone: 'berry', target: { activity: 'nutrient-memory' } },
    ],
    featuredActivities: RECIPES.map(recipe => `recipe:${recipe.id}`),
    practiceActivities: ['math:missing', 'math:balance', 'math:race', 'math:add-subtract'],
    adventures: [],
    adventurePreviews: [
      { id: 'muffin-order', title: 'De grote muffinbestelling', description: 'Milo heeft een grote bestelling gekregen. Wie helpt hem straks met rekenen, boodschappen en bakken?', icon: 'muffin', image: '/assets/library/cooking/baking/blueberry-muffin.webp', tone: 'honey', status: 'locked' },
      { id: 'birthday-cake', title: 'De verjaardagstaart', description: 'Er is iemand jarig! Milo wil een bijzondere taart maken, maar er moet nog veel worden voorbereid.', icon: 'cake', image: '/assets/library/cooking/kit/whisk.webp', tone: 'berry', status: 'locked' },
      { id: 'secret-recipe', title: 'Het geheime recept', description: 'Milo heeft een oud recept gevonden. Wat zou er op de ontbrekende stukjes staan?', icon: 'secret', image: '/assets/library/cooking/baking/vanilla-extract.webp', tone: 'sage', status: 'locked' },
      { id: 'missing-ingredients', title: 'De verdwenen ingrediënten', description: 'De bakkerij gaat bijna open, maar een paar ingrediënten zijn zoek. Waar zijn ze gebleven?', icon: 'ingredients', image: '/games/shop/products/blueberry.webp', tone: 'sky', status: 'locked' },
      { id: 'delivery-chaos', title: 'De bezorgchaos', description: 'De bestellingen staan klaar. Alleen zijn de pakketjes door elkaar geraakt!', icon: 'delivery', image: '/assets/library/cooking/baking/muffin-pan.webp', tone: 'sage', status: 'locked' },
      { id: 'baking-contest', title: 'De bakwedstrijd', description: 'Er komt een bakwedstrijd aan. Milo zoekt een bakmaatje voor een heerlijke inzending.', icon: 'contest', image: '/assets/library/cooking/baking/blueberry-muffin.webp', tone: 'honey', status: 'locked' },
    ],
  },
  {
    id: 'novi', islandId: 'plants', path: '/islands/plants', name: 'Novi’s Plantenkas',
    background: '/dreamworld/locations/novi-greenhouse.png',
    backgroundPosition: { desktop: '32% center', mobile: '25% center' },
    accentColor: 'var(--color-primary)', character: { id: 'novi', name: 'Novi' },
    activities: [
      { id: 'clinic', label: 'Plantendokter', icon: 'clinic', target: { activity: 'plant-clinic' } },
      { id: 'plants', label: 'Mijn planten', icon: 'plants', target: { activity: 'plant-family' } },
      { id: 'book', label: 'Plantenboek', icon: 'book', target: { activity: 'plant-book' } },
      { id: 'grow', label: 'Kweken', icon: 'grow', target: { comingSoon: true } },
    ],
    featuredActivities: PLANT_SPECIES.map(plant => `plant:${plant.id}`), practiceActivities: [], adventures: [],
  },
];
