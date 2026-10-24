export type ShopSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface ProductPriceConfig {
  cocoCoins: number;
  provisional: true;
  seasonal?: Partial<Record<ShopSeason, number>>;
}

export const COCOCOINS_PER_EURO = 10;
export const SHOP_PRICE_VERSION = '2026.1';

export const SHOP_PRICES: Record<string, ProductPriceConfig> = {
  tomato: { cocoCoins: 5, provisional: true },
  carrot: { cocoCoins: 3, provisional: true },
  pepper: { cocoCoins: 12, provisional: true },
  cucumber: { cocoCoins: 8, provisional: true },
  potato: { cocoCoins: 4, provisional: true },
  onion: { cocoCoins: 4, provisional: true },
  garlic: { cocoCoins: 5, provisional: true },
  broccoli: { cocoCoins: 15, provisional: true },
  strawberry: { cocoCoins: 30, provisional: true, seasonal: { spring: 25, summer: 20, autumn: 30, winter: 35 } },
  blueberry: { cocoCoins: 25, provisional: true },
  banana: { cocoCoins: 3, provisional: true },
  apple: { cocoCoins: 5, provisional: true },
  pear: { cocoCoins: 6, provisional: true },
  orange: { cocoCoins: 6, provisional: true },
  lemon: { cocoCoins: 5, provisional: true },
  raspberry: { cocoCoins: 30, provisional: true },
  eggs: { cocoCoins: 4, provisional: true },
  milk: { cocoCoins: 12, provisional: true },
  cheese: { cocoCoins: 25, provisional: true },
  yogurt: { cocoCoins: 10, provisional: true },
  butter: { cocoCoins: 18, provisional: true },
  flour: { cocoCoins: 8, provisional: true },
  sugar: { cocoCoins: 10, provisional: true },
  honey: { cocoCoins: 25, provisional: true },
  bread: { cocoCoins: 15, provisional: true },
  spaghetti: { cocoCoins: 10, provisional: true },
  pasta: { cocoCoins: 10, provisional: true },
  rice: { cocoCoins: 12, provisional: true },
  oats: { cocoCoins: 1, provisional: true },
  'tomato-sauce': { cocoCoins: 12, provisional: true },
  'canned-tomatoes': { cocoCoins: 8, provisional: true },
  'olive-oil': { cocoCoins: 30, provisional: true },
  lettuce: { cocoCoins: 10, provisional: true },
  spinach: { cocoCoins: 15, provisional: true },
  mushrooms: { cocoCoins: 14, provisional: true },
  avocado: { cocoCoins: 12, provisional: true },
  basil: { cocoCoins: 6, provisional: true },
  parsley: { cocoCoins: 5, provisional: true },
  'spring-onion': { cocoCoins: 6, provisional: true },
  'cherry-tomatoes': { cocoCoins: 12, provisional: true },
};

export function getShopSeason(date = new Date()): ShopSeason {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function getProductPrice(productId: string, season: ShopSeason): number {
  const config = SHOP_PRICES[productId];
  if (!config) throw new Error(`Prijs ontbreekt voor product: ${productId}`);
  return config.seasonal?.[season] ?? config.cocoCoins;
}

export function cocoCoinsToEuros(cocoCoins: number): number {
  return cocoCoins / COCOCOINS_PER_EURO;
}

