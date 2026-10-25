import { SHOP_PRODUCTS_BY_ID } from '../../data/shopCatalog';
import { DECOR_PRODUCTS_BY_ID } from '../../data/decorCatalog';

export interface CheckoutProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  category: 'food' | 'furniture';
  unit: readonly [string, string];
}

// Rounded euro teaching prices, independent of the shop's CocoCoin economy.
const food = (id: string, name: string, price: number, unit: CheckoutProduct['unit'] = ['stuk', 'stuks']): CheckoutProduct => ({
  id, name, price, unit, image: SHOP_PRODUCTS_BY_ID[id].image, category: 'food',
});
const furniture = (id: string, price: number): CheckoutProduct => ({
  id, name: DECOR_PRODUCTS_BY_ID[id].name, price,
  image: DECOR_PRODUCTS_BY_ID[id].image, category: 'furniture', unit: ['stuk', 'stuks'],
});

export const checkoutProducts: readonly CheckoutProduct[] = [
  food('apple', 'Appel', 1), food('banana', 'Banaan', 1),
  food('bread', 'Brood', 2, ['brood', 'broden']), food('milk', 'Pak melk (1 liter)', 1, ['pak', 'pakken']),
  food('strawberry', 'Bakje aardbeien (250 g)', 3, ['bakje', 'bakjes']),
  food('blueberry', 'Bakje blauwe bessen (125 g)', 3, ['bakje', 'bakjes']),
  food('butter', 'Pakje boter (250 g)', 3, ['pakje', 'pakjes']), food('cheese', 'Stuk kaas (300 g)', 4),
  food('honey', 'Pot honing (350 g)', 5, ['pot', 'potten']), food('olive-oil', 'Fles olijfolie (500 ml)', 8, ['fles', 'flessen']),
  furniture('rose-pouf', 75), furniture('terrazzo-table', 120),
  furniture('rose-armchair', 250), furniture('cream-two-seater', 600),
  furniture('cream-corner-sofa', 900),
];

export interface CheckoutDetails {
  products: CheckoutProduct[];
  quantity: number;
}
