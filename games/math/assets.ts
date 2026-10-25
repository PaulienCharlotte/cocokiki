import type { MathGameId } from './types';

const supplied = '/games/school/math/adventures';
export const mathAssets = {
  basket: `${supplied}/basket.png`, strawberry: `${supplied}/strawberry.png`, blueberry: `${supplied}/blueberry.png`,
  strawberryPlant: `${supplied}/strawberry-plant.png`, blueberryPlant: `${supplied}/blueberry-plant.png`,
  tomatoPlant: `${supplied}/tomato-plant.png`, gardenTools: `${supplied}/garden-tools.png`,
  seedlings: `${supplied}/seedlings.png`, herbs: `${supplied}/herbs.png`,
  squirrel: `${supplied}/squirrel.png`, acorn: `${supplied}/acorn.png`, treeHollow: `${supplied}/tree-hollow.png`,
  bird: `${supplied}/bird.png`, bee: `${supplied}/bee.png`, honeyJar: `${supplied}/honey-jar.png`, cookie: `${supplied}/cookie.png`,
  chef: '/assets/library/cooking/coco-chef-tip.png',
  tray: '/assets/library/cooking/kit/baking-tray.png', oven: '/assets/library/treehouse/furnishings/oven.png',
  apple: '/games/shop/products/apple.png', banana: '/games/shop/products/banana.png',
  forest: '/assets/baby-lua/backgrounds/jungle.png', garden: '/assets/library/treehouse/rooms/terrace.png',
  kitchen: '/assets/library/treehouse/rooms/kitchen-furnished.png', shop: '/games/destinations/shop-interior.png',
};
export const mathEnvironments: Record<MathGameId, string> = {
  multiply: mathAssets.forest, divide: mathAssets.garden, 'add-subtract': mathAssets.forest,
  missing: mathAssets.kitchen, balance: mathAssets.garden, race: mathAssets.shop,
};
export { checkoutProducts } from './checkoutCatalog';
export const missingMathAssets: readonly string[] = [];
