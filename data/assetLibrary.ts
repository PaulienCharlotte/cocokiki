export const ASSET_LIBRARY = {
  brand: {
    logo: '/images/cocokiki-logo.png',
    compass: '/images/logo-compas.svg',
    coinCompass: '/images/logo-compas-geel.svg',
  },
  avatars: {
    coco: '/images/avatars/coco.webp',
    kiki: '/images/avatars/kiki.webp',
    lua: '/images/avatars/lua.webp',
    together: '/images/avatars/samen.webp',
    sloth: '/images/avatars/luiaard.webp',
    adventurer: '/images/avatars/avonturier.webp',
  },
  world: {
    backgroundDesktop: '/games/world-hub/v2/world-background-desktop.jpg',
    backgroundMobile: '/games/world-hub/v2/world-background-mobile.jpg',
    treehouseIsland: '/games/world-hub/v2/treehouse-island.webp',
    schoolIsland: '/games/world-hub/v2/school-island.webp',
    shopIsland: '/games/world-hub/v2/shop-island.webp',
    cookingIsland: '/games/world-hub/v2/cooking-island.webp',
    bridge: '/games/treehouse/world-v2/bridge-cutout.png',
  },
  treehouse: {
    overview: '/assets/library/treehouse/overview/treehouse-overview.png',
    rooms: {
      livingRoom: '/assets/library/treehouse/rooms/living-room.png',
      kitchen: '/assets/library/treehouse/rooms/kitchen-furnished.png',
      bedroom: '/assets/library/treehouse/rooms/bedroom.png',
      terrace: '/assets/library/treehouse/rooms/terrace.png',
    },
    furnishings: {
      fridge: '/assets/library/treehouse/furnishings/fridge.png',
      fridgeOpen: '/assets/library/treehouse/furnishings/fridge-open.png',
      oven: '/assets/library/treehouse/furnishings/oven.png',
      ovenOpen: '/assets/library/treehouse/furnishings/oven-open.png',
      pantry: '/assets/library/treehouse/furnishings/pantry.png',
      pantryOpen: '/assets/library/treehouse/furnishings/pantry-open.png',
      island: '/assets/library/treehouse/furnishings/island.png',
      cart: '/assets/library/treehouse/furnishings/cart.png',
    },
    stations: {
      worktop: '/assets/library/treehouse/stations/worktop.png',
      cooktop: '/assets/library/treehouse/stations/cooktop.png',
    },
    icons: {
      bedroom: '/assets/library/treehouse/icons/bedroom.png',
      garden: '/assets/library/treehouse/icons/garden.png',
      livingRoom: '/assets/library/treehouse/icons/living-room.png',
      kitchen: '/assets/library/treehouse/icons/kitchen.png',
      home: '/assets/library/treehouse/icons/home.png',
      add: '/assets/library/treehouse/icons/add.png',
      arrowLeft: '/assets/library/treehouse/icons/arrow-left.png',
      arrowRight: '/assets/library/treehouse/icons/arrow-right.png',
    },
    collections: {
      encyclopedia: '/games/treehouse/encyclopedia-cta.png',
      cookbook: '/games/treehouse/cookbook-cta.png',
    },
  },
  destinations: {
    school: '/games/school/school-interior.jpg',
    shop: '/games/destinations/shop-interior.png',
    cookingStudio: '/games/destinations/cooking-studio.png',
    travel: '/games/destinations/travel-room.png',
  },
  cooking: {
    recipes: {
      bananaPancakes: '/games/cooking/banana-pancakes.png',
      fruitYogurt: '/games/cooking/fruit-yogurt.png',
      oatMuffins: '/games/cooking/oat-muffins.png',
    },
    equipmentFolder: '/games/cooking/equipment/',
    bananaPancakes: {
      banana: '/assets/library/cooking/banana-pancakes/banana.png',
      eggs: '/assets/library/cooking/banana-pancakes/eggs.png',
      butter: '/assets/library/cooking/banana-pancakes/butter.png',
      bowl: '/assets/library/cooking/banana-pancakes/bowl.png',
      whisk: '/assets/library/cooking/banana-pancakes/whisk.png',
      fork: '/assets/library/cooking/banana-pancakes/fork.png',
      pan: '/assets/library/cooking/banana-pancakes/pan.png',
      spatula: '/assets/library/cooking/banana-pancakes/spatula.png',
      mashedBanana: '/assets/library/cooking/banana-pancakes/mashed-banana.png',
      batter: '/assets/library/cooking/banana-pancakes/batter.png',
      pancakeRaw: '/assets/library/cooking/banana-pancakes/pancake-raw.png',
      pancakeGolden: '/assets/library/cooking/banana-pancakes/pancake-golden.png',
      finished: '/assets/library/cooking/banana-pancakes/finished.png',
    },
  },
  shop: {
    productFolder: '/games/shop/products/',
    productSheet: '/games/shop/products-sheet.png',
    street: '/games/shop/shop-street.png',
    decorSheet: '/assets/library/shop/decor/furniture-plants-sheet.png',
  },
  games: {
    babyLua: {
      background: '/assets/baby-lua/backgrounds/jungle.png',
      poses: '/assets/baby-lua/characters/lua-poses.png',
      rocks: '/games/red-baby-lua/rocks.png',
    },
    schoolActions: {
      tables: '/games/school/tables-cta.png',
      topo: '/games/school/topo-cta.png',
    },
  },
} as const;

export type AssetLibrary = typeof ASSET_LIBRARY;
