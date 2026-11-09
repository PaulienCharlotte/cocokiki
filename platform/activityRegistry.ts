import { MATH_GAMES, mathIcon } from '../games/math/config';
import { RECIPES } from '../data/cooking/catalog';
import { PLANT_SPECIES, plantProduct } from '../data/plants/species';

export interface ActivityDefinition {
  id: string;
  title: string;
  kind: 'game' | 'recipe' | 'plant' | 'collection';
  path: string;
  image?: string;
  contentId?: string;
  status: 'available' | 'coming-soon';
}

// Shared content index, not a new game engine or a second progress store.
export const SCHOOL_ACTIVITIES: ActivityDefinition[] = [
  ...MATH_GAMES.map(game => ({ id: `math:${game.id}`, title: game.title, kind: 'game' as const, path: `/school/math/${game.id}`, image: mathIcon(game.id), status: 'available' as const })),
  { id: 'topo', title: 'Topografie', kind: 'game', path: '/games/topo', status: 'available' },
  { id: 'clock', title: 'Kloklezen en wereldtijden', kind: 'game', path: '/school/clock', status: 'available' },
  { id: 'flags-memory', title: 'Vlaggenmemory', kind: 'game', path: '/games/flags-memory', status: 'available' },
  { id: 'red-baby-lua', title: 'Red Baby Lua!', kind: 'game', path: '/games/red-baby-lua', status: 'available' },
];
export const ACTIVITY_LIBRARY: ActivityDefinition[] = [
  ...SCHOOL_ACTIVITIES,
  { id: 'recipes', title: 'Recepten', kind: 'collection', path: '/treehouse/cookbook', status: 'available' },
  { id: 'nutrient-memory', title: 'Voedingsstoffen', kind: 'game', path: '/games/nutrient-memory', status: 'available' },
  { id: 'plant-clinic', title: 'Plantendokter', kind: 'game', path: '/plantendokter', status: 'available' },
  { id: 'plant-family', title: 'Mijn planten', kind: 'collection', path: '/plants/collection', status: 'available' },
  { id: 'plant-book', title: 'Plantenboek', kind: 'collection', path: '/encyclopedie', status: 'available' },
  ...RECIPES.map(recipe => ({ id: `recipe:${recipe.id}`, title: recipe.name, kind: 'recipe' as const,
    path: `/treehouse/cookbook?recipe=${encodeURIComponent(recipe.id)}`, image: recipe.image,
    status: recipe.contentStatus === 'ready' ? 'available' as const : 'coming-soon' as const })),
  ...PLANT_SPECIES.map(plant => ({ id: `plant:${plant.id}`, contentId: plant.id, title: plant.commonName, kind: 'plant' as const,
    path: `/encyclopedie?plant=${encodeURIComponent(plant.id)}`, image: plantProduct(plant.id)?.image, status: 'available' as const })),
];
export const ACTIVITIES_BY_ID = Object.fromEntries(ACTIVITY_LIBRARY.map(activity => [activity.id, activity])) as Record<string, ActivityDefinition>;
