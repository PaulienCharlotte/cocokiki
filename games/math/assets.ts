import type { MathGameId } from './types';
import { ASSET_LIBRARY } from '../../data/assetLibrary';

const supplied = '/games/school/math/adventures';
export const mathAssets = {
  basket: `${supplied}/basket.webp`, strawberry: `${supplied}/strawberry.webp`, blueberry: `${supplied}/blueberry.webp`,
  strawberryPlant: `${supplied}/strawberry-plant.webp`, blueberryPlant: `${supplied}/blueberry-plant.webp`,
  tomatoPlant: `${supplied}/tomato-plant.webp`, gardenTools: `${supplied}/garden-tools.webp`,
  seedlings: `${supplied}/seedlings.webp`, herbs: `${supplied}/herbs.webp`,
  squirrel: `${supplied}/squirrel.webp`, acorn: `${supplied}/acorn.webp`, treeHollow: `${supplied}/tree-hollow.webp`,
  bird: `${supplied}/bird.webp`, bee: `${supplied}/bee.webp`, honeyJar: `${supplied}/honey-jar.webp`, cookie: `${supplied}/cookie.webp`,
  chef: '/assets/library/cooking/coco-chef-tip.webp',
  tray: '/assets/library/cooking/kit/baking-tray.webp', oven: '/assets/library/treehouse/furnishings/oven.webp',
  apple: '/games/shop/products/apple.webp', banana: '/games/shop/products/banana.webp',
  forest: '/assets/baby-lua/backgrounds/jungle.webp', garden: '/assets/library/treehouse/rooms/terrace.webp',
  kitchen: '/assets/library/treehouse/rooms/kitchen-furnished.webp', shop: '/games/destinations/shop-interior.webp',
};
export const mathEnvironments: Record<MathGameId, string> = {
  multiply: ASSET_LIBRARY.games.babyLua.background, divide: mathAssets.garden, 'add-subtract': mathAssets.forest,
  missing: mathAssets.kitchen, balance: `${supplied}/honey-room.png`, race: `${supplied}/checkout-room.png`,
};
export { checkoutProducts } from './checkoutCatalog';
export const missingMathAssets: readonly string[] = [];
