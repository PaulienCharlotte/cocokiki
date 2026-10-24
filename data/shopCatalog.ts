import { SHOP_PRICES } from './shopPricing';

export type ShopCategory = 'vegetables' | 'fruit' | 'dairy' | 'pantry' | 'herbs';
export type ProductUnit = 'piece' | 'gram' | 'milliliter';

export interface ShopProduct {
  id: string;
  name: string;
  category: ShopCategory;
  image: string;
  unitAmount: number;
  unit: ProductUnit;
  packageLabel: string;
  price: number;
  purchasable: true;
}

export const SHOP_CATEGORIES: Array<{ id: 'all' | ShopCategory; label: string }> = [
  { id: 'all', label: 'Alles' },
  { id: 'vegetables', label: 'Groente' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'dairy', label: 'Zuivel & ei' },
  { id: 'pantry', label: 'Voorraad' },
  { id: 'herbs', label: 'Kruiden' },
];

const PRODUCT_PACKAGES: Record<string, [number, ProductUnit, string]> = {
  tomato: [1, 'piece', 'per stuk'], carrot: [1, 'piece', 'per stuk'], pepper: [1, 'piece', 'per stuk'], cucumber: [1, 'piece', 'per stuk'],
  potato: [1, 'piece', 'per stuk'], onion: [1, 'piece', 'per stuk'], garlic: [1, 'piece', 'per bol'], broccoli: [1, 'piece', 'per stuk'],
  strawberry: [250, 'gram', '250 g'], blueberry: [125, 'gram', '125 g'], banana: [1, 'piece', 'per stuk'], apple: [1, 'piece', 'per stuk'],
  pear: [1, 'piece', 'per stuk'], orange: [1, 'piece', 'per stuk'], lemon: [1, 'piece', 'per stuk'], raspberry: [125, 'gram', '125 g'],
  eggs: [1, 'piece', 'per ei'], milk: [1000, 'milliliter', '1 liter'], cheese: [300, 'gram', '300 g'], yogurt: [500, 'gram', '500 g'], butter: [250, 'gram', '250 g'],
  flour: [1000, 'gram', '1 kg'], sugar: [1000, 'gram', '1 kg'], honey: [350, 'gram', '350 g'], bread: [1, 'piece', '1 brood'],
  spaghetti: [500, 'gram', '500 g'], pasta: [500, 'gram', '500 g'], rice: [1000, 'gram', '1 kg'], oats: [40, 'gram', '40 g'],
  'tomato-sauce': [500, 'milliliter', '500 ml'], 'canned-tomatoes': [400, 'gram', '400 g'], 'olive-oil': [500, 'milliliter', '500 ml'],
  lettuce: [1, 'piece', 'per krop'], spinach: [300, 'gram', '300 g'], mushrooms: [250, 'gram', '250 g'], avocado: [1, 'piece', 'per stuk'],
  basil: [1, 'piece', '1 plantje'], parsley: [1, 'piece', '1 bosje'], 'spring-onion': [1, 'piece', '1 bosje'], 'cherry-tomatoes': [250, 'gram', '250 g'],
};

const product = (id: string, name: string, category: ShopCategory): ShopProduct => {
  const [unitAmount, unit, packageLabel] = PRODUCT_PACKAGES[id];
  return {
  id,
  name,
  category,
  image: `/games/shop/products/${id}.png?v=2`,
  unitAmount,
  unit,
  packageLabel,
  price: SHOP_PRICES[id].cocoCoins,
  purchasable: true,
  };
};

export const SHOP_PRODUCTS: ShopProduct[] = [
  product('tomato', 'Tomaat', 'vegetables'),
  product('carrot', 'Wortel', 'vegetables'),
  product('pepper', 'Paprika', 'vegetables'),
  product('cucumber', 'Komkommer', 'vegetables'),
  product('potato', 'Aardappel', 'vegetables'),
  product('onion', 'Ui', 'vegetables'),
  product('garlic', 'Knoflook', 'vegetables'),
  product('broccoli', 'Broccoli', 'vegetables'),
  product('strawberry', 'Aardbei', 'fruit'),
  product('blueberry', 'Blauwe bes', 'fruit'),
  product('banana', 'Banaan', 'fruit'),
  product('apple', 'Appel', 'fruit'),
  product('pear', 'Peer', 'fruit'),
  product('orange', 'Sinaasappel', 'fruit'),
  product('lemon', 'Citroen', 'fruit'),
  product('raspberry', 'Framboos', 'fruit'),
  product('eggs', 'Eieren', 'dairy'),
  product('milk', 'Melk', 'dairy'),
  product('cheese', 'Kaas', 'dairy'),
  product('yogurt', 'Yoghurt', 'dairy'),
  product('butter', 'Boter', 'dairy'),
  product('flour', 'Bloem', 'pantry'),
  product('sugar', 'Suiker', 'pantry'),
  product('honey', 'Honing', 'pantry'),
  product('bread', 'Brood', 'pantry'),
  product('spaghetti', 'Spaghetti', 'pantry'),
  product('pasta', 'Pasta', 'pantry'),
  product('rice', 'Rijst', 'pantry'),
  product('oats', 'Havermout', 'pantry'),
  product('tomato-sauce', 'Tomatensaus', 'pantry'),
  product('canned-tomatoes', 'Tomatenblik', 'pantry'),
  product('olive-oil', 'Olijfolie', 'pantry'),
  product('lettuce', 'Sla', 'vegetables'),
  product('spinach', 'Spinazie', 'vegetables'),
  product('mushrooms', 'Champignons', 'vegetables'),
  product('avocado', 'Avocado', 'vegetables'),
  product('basil', 'Basilicum', 'herbs'),
  product('parsley', 'Peterselie', 'herbs'),
  product('spring-onion', 'Bosui', 'herbs'),
  product('cherry-tomatoes', 'Cherrytomaten', 'vegetables'),
];

export const SHOP_PRODUCTS_BY_ID = Object.fromEntries(SHOP_PRODUCTS.map(item => [item.id, item])) as Record<string, ShopProduct>;
