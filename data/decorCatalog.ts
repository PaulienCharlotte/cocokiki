export type DecorStoreId = 'furniture' | 'plants';
export type DecorCategory = 'sleeping' | 'seating' | 'storage' | 'tables' | 'rugs' | 'lighting' | 'large-plants' | 'hanging-plants' | 'flowering-plants' | 'small-plants';

export interface SpriteCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DecorProduct {
  id: string;
  name: string;
  store: DecorStoreId;
  category: DecorCategory;
  price: number;
  image: string;
  crop: SpriteCrop;
}

export const DECOR_SHEET = '/assets/library/shop/decor/furniture-plants-sheet.png';

export const DECOR_STORES: Record<DecorStoreId, { label: string; eyebrow: string }> = {
  furniture: { label: 'Meubelwinkel', eyebrow: 'Maak je boomhut eigen' },
  plants: { label: 'Plantenwinkel', eyebrow: 'Groen voor iedere kamer' },
};

export const DECOR_CATEGORIES: Record<DecorStoreId, Array<{ id: 'all' | DecorCategory; label: string }>> = {
  furniture: [
    { id: 'all', label: 'Alles' },
    { id: 'sleeping', label: 'Bedden' },
    { id: 'seating', label: 'Zitten' },
    { id: 'storage', label: 'Kasten' },
    { id: 'tables', label: 'Tafels' },
    { id: 'rugs', label: 'Kleden' },
    { id: 'lighting', label: 'Lampen & decoratie' },
  ],
  plants: [
    { id: 'all', label: 'Alles' },
    { id: 'large-plants', label: 'Grote planten' },
    { id: 'hanging-plants', label: 'Hangplanten' },
    { id: 'flowering-plants', label: 'Bloeiende planten' },
    { id: 'small-plants', label: 'Kleine planten' },
  ],
};

const decor = (
  id: string,
  name: string,
  store: DecorStoreId,
  category: DecorCategory,
  price: number,
  crop: SpriteCrop,
): DecorProduct => ({ id, name, store, category, price, image: `/assets/library/shop/decor/products/${id}.png?v=2`, crop });

// Source-sheet crops are retained for reference; the shop renders isolated PNGs.
const EXISTING_DECOR_PRODUCTS: DecorProduct[] = [
  decor('single-bed', 'Eenpersoonsbed', 'furniture', 'sleeping', 85, { x: 0, y: 0, width: 13, height: 25 }),
  decor('double-bed', 'Tweepersoonsbed', 'furniture', 'sleeping', 120, { x: 13, y: 0, width: 17.5, height: 27 }),
  decor('bunk-bed', 'Hoogslaper', 'furniture', 'sleeping', 135, { x: 31, y: 0, width: 17, height: 28 }),
  decor('soft-sofa', 'Zachte bank', 'furniture', 'seating', 95, { x: 48.5, y: 2, width: 17.5, height: 23 }),
  decor('green-chair', 'Groene fauteuil', 'furniture', 'seating', 55, { x: 66.5, y: 2, width: 12.5, height: 23 }),
  decor('rattan-chair', 'Rotan stoel', 'furniture', 'seating', 60, { x: 78.5, y: 1, width: 11.5, height: 24 }),
  decor('hanging-chair', 'Hangstoel', 'furniture', 'seating', 75, { x: 89.5, y: 0, width: 10.5, height: 27 }),
  decor('cream-wardrobe', 'Crème kledingkast', 'furniture', 'storage', 90, { x: 0, y: 24, width: 12, height: 23 }),
  decor('green-wardrobe', 'Groene kledingkast', 'furniture', 'storage', 90, { x: 11, y: 25, width: 10, height: 22 }),
  decor('drawer-chest', 'Ladekast', 'furniture', 'storage', 60, { x: 20, y: 28, width: 13, height: 17 }),
  decor('media-cabinet', 'Lage kast', 'furniture', 'storage', 75, { x: 39, y: 29, width: 23, height: 14 }),
  decor('round-table', 'Ronde tafel', 'furniture', 'tables', 70, { x: 61, y: 25, width: 17, height: 18 }),
  decor('coffee-table', 'Salontafel', 'furniture', 'tables', 55, { x: 80, y: 25, width: 20, height: 16 }),
  decor('flower-rug', 'Bloemenkleed', 'furniture', 'rugs', 35, { x: 0, y: 45, width: 16, height: 14 }),
  decor('jute-rug', 'Juten kleed', 'furniture', 'rugs', 35, { x: 16, y: 43, width: 18, height: 16 }),
  decor('leaf-rug', 'Bladkleed', 'furniture', 'rugs', 45, { x: 46, y: 43, width: 17, height: 16 }),
  decor('pink-rug', 'Roze kleed', 'furniture', 'rugs', 40, { x: 62, y: 43, width: 15, height: 16 }),
  decor('flower-lights', 'Bloemenslinger', 'furniture', 'lighting', 25, { x: 40, y: 57, width: 18, height: 12 }),
  decor('pink-lamp', 'Roze lamp', 'furniture', 'lighting', 30, { x: 29, y: 55, width: 8, height: 15 }),
  decor('green-lamp', 'Groene hanglamp', 'furniture', 'lighting', 35, { x: 90, y: 55, width: 10, height: 16 }),

  decor('monstera-basket', 'Monstera in mand', 'plants', 'large-plants', 40, { x: 10.5, y: 70.5, width: 9.5, height: 20 }),
  decor('palm-white-pot', 'Palm in witte pot', 'plants', 'large-plants', 38, { x: 19, y: 71, width: 8, height: 19 }),
  decor('palm-clay-pot', 'Palm in kleipot', 'plants', 'large-plants', 38, { x: 25.3, y: 70.5, width: 7.5, height: 20 }),
  decor('snake-plant', 'Vrouwentong', 'plants', 'large-plants', 35, { x: 31, y: 69.5, width: 7.5, height: 21 }),
  decor('hanging-fern', 'Hangvaren', 'plants', 'hanging-plants', 30, { x: 37.3, y: 67, width: 8.5, height: 23 }),
  decor('hanging-vine', 'Hangende klimop', 'plants', 'hanging-plants', 30, { x: 43.8, y: 66.5, width: 8.5, height: 24 }),
  decor('white-flower', 'Witte bloem', 'plants', 'flowering-plants', 32, { x: 51, y: 69.5, width: 9.5, height: 21 }),
  decor('pink-flower', 'Roze bloem', 'plants', 'flowering-plants', 32, { x: 58.7, y: 69.5, width: 9.5, height: 21 }),
  decor('orange-tree', 'Sinaasappelboompje', 'plants', 'flowering-plants', 45, { x: 66, y: 69, width: 9.5, height: 21.5 }),
  decor('orchid', 'Orchidee', 'plants', 'flowering-plants', 36, { x: 73.2, y: 69, width: 9.5, height: 21.5 }),
  decor('succulent', 'Vetplantje', 'plants', 'small-plants', 18, { x: 82, y: 80, width: 8, height: 11 }),
  decor('small-cactus', 'Kleine cactus', 'plants', 'small-plants', 18, { x: 88.5, y: 69, width: 6, height: 20 }),
  decor('tall-cactus', 'Hoge cactus', 'plants', 'small-plants', 24, { x: 94, y: 68, width: 6, height: 21 }),
];

const cleanPlants = new Set(['monstera-basket', 'orange-tree', 'pink-flower', 'hanging-vine', 'white-flower', 'hanging-fern', 'snake-plant']);
const furniture = (id: string, name: string, category: DecorCategory, price: number): DecorProduct => ({
  id, name, store: 'furniture', category, price,
  image: `/assets/library/shop/decor/products/${id}.png?v=3`,
  crop: { x: 0, y: 0, width: 100, height: 100 },
});

export const DECOR_PRODUCTS: DecorProduct[] = [
  furniture('corner-sofa', 'Zachte hoekbank', 'seating', 110),
  furniture('dining-set', 'Ronde eethoek', 'tables', 95),
  furniture('ribbed-sideboard', 'Geribbeld dressoir', 'storage', 75),
  furniture('arched-cabinet', 'Boogkast', 'storage', 85),
  furniture('rose-armchair', 'Roze fauteuil', 'seating', 55),
  furniture('rose-pouf', 'Roze poef', 'seating', 30),
  furniture('terrazzo-table', 'Terrazzo bijzettafel', 'tables', 45),
  furniture('arched-floor-lamp', 'Booglamp', 'lighting', 35),
  ...EXISTING_DECOR_PRODUCTS.map(product => cleanPlants.has(product.id)
    ? { ...product, image: `/assets/library/shop/decor/products/${product.id}-v3.png` }
    : { ...product, image: `/assets/library/shop/decor/products/${product.id}-v4.png` }),
];

export const DECOR_PRODUCTS_BY_ID = Object.fromEntries(
  DECOR_PRODUCTS.map(product => [product.id, product]),
) as Record<string, DecorProduct>;

