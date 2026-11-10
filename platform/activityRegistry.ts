import { MATH_GAMES, mathIcon } from '../games/math/config';
import { RECIPES } from '../data/cooking/catalog';
import { PLANT_SPECIES, plantProduct } from '../data/plants/species';

export interface ActivityDefinition {
  id: string;
  title: string;
  /** Eén korte regel eronder. Alleen als hij per kaart verschilt. */
  subtitle?: string;
  kind: 'game' | 'recipe' | 'plant' | 'collection';
  path: string;
  image?: string;
  contentId?: string;
  status: 'available' | 'coming-soon';
}

// Shared content index, not a new game engine or a second progress store.
export const SCHOOL_ACTIVITIES: ActivityDefinition[] = [
  ...MATH_GAMES.map(game => ({ id: `math:${game.id}`, title: game.title, subtitle: game.subtitle, kind: 'game' as const, path: `/school/math/${game.id}`, image: mathIcon(game.id), status: 'available' as const })),
  { id: 'topo', title: 'Topografie', subtitle: 'Plekken zoeken op de kaart', kind: 'game', path: '/games/topo', image: '/games/school/topo-cta.webp', status: 'available' },
  { id: 'clock', title: 'Kloklezen', subtitle: 'Klokkijken en wereldtijden', kind: 'game', path: '/school/clock', image: '/games/school/clock/clock-school-navigation-v2.webp', status: 'available' },
  { id: 'flags-memory', title: 'Vlaggenmemory', subtitle: 'Zoek de vlag bij het land', kind: 'game', path: '/games/flags-memory', image: '/games/flags-memory/navigation.webp', status: 'available' },
  { id: 'red-baby-lua', title: 'Red Baby Lua!', kind: 'game', path: '/games/red-baby-lua', status: 'available' },
];
export const ACTIVITY_LIBRARY: ActivityDefinition[] = [
  ...SCHOOL_ACTIVITIES,
  { id: 'recipes', title: 'Recepten', kind: 'collection', path: '/treehouse/cookbook', status: 'available' },
  { id: 'nutrient-memory', title: 'Voedingsstoffen', kind: 'game', path: '/games/nutrient-memory', status: 'available' },
  { id: 'plant-clinic', title: 'Plantendokter', subtitle: 'Help een plant die het niet goed doet', kind: 'game', path: '/plantendokter', image: '/dreamworld/plant-clinic.webp', status: 'available' },
  { id: 'plant-family', title: 'Mijn planten', subtitle: 'Kijk hoe het met je eigen planten gaat', kind: 'collection', path: '/plants/collection', image: plantProduct(PLANT_SPECIES[0]?.id)?.image, status: 'available' },
  { id: 'plant-book', title: 'Plantenboek', subtitle: 'Alles over de planten die je kent', kind: 'collection', path: '/encyclopedie', image: '/games/treehouse/encyclopedia-cta.webp', status: 'available' },
  ...RECIPES.map(recipe => ({ id: `recipe:${recipe.id}`, title: recipe.name, kind: 'recipe' as const,
    path: `/treehouse/cookbook?recipe=${encodeURIComponent(recipe.id)}`, image: recipe.image,
    status: recipe.contentStatus === 'ready' ? 'available' as const : 'coming-soon' as const })),
  ...PLANT_SPECIES.map(plant => ({ id: `plant:${plant.id}`, contentId: plant.id, title: plant.commonName, kind: 'plant' as const,
    path: `/encyclopedie?plant=${encodeURIComponent(plant.id)}`, image: plantProduct(plant.id)?.image, status: 'available' as const })),
];
export const ACTIVITIES_BY_ID = Object.fromEntries(ACTIVITY_LIBRARY.map(activity => [activity.id, activity])) as Record<string, ActivityDefinition>;
