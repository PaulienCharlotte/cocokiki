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
  /** Breedte in de kamer, als percentage van de kamerbreedte. */
  roomWidth: number;
  /** Aantal aanzichten rondom; 1 betekent dat het meubel niet draait. */
  views: number;
}

/**
 * Standaardbreedte per soort, zodat een nieuw meubel alleen een eigen maat
 * hoeft op te geven wanneer het uit de toon valt.
 */
function defaultRoomWidth(id: string, category: DecorCategory): number {
  if (id.includes('sofa') || id.includes('sideboard')) return 34;
  if (category === 'sleeping' || category === 'rugs') return 30;
  if (category === 'tables') return 25;
  if (category === 'storage') return 19;
  return 15;
}

/**
 * Het plaatje bij een aanzicht. Meubels met meerdere aanzichten hebben een
 * eigen map met view-1 tot en met view-N; de rest heeft één vast plaatje.
 */
export function decorViewImage(product: DecorProduct, view: number): string {
  if (product.views < 2) return product.image;
  const index = ((Math.round(view) % product.views) + product.views) % product.views;
  return `/assets/library/shop/decor/products/${product.id}/view-${index + 1}.png`;
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
): DecorProduct => ({
  id, name, store, category, price,
  image: `/assets/library/shop/decor/products/${id}.png?v=2`,
  crop,
  roomWidth: defaultRoomWidth(id, category),
  views: 1,
});

// Source-sheet crops are retained for reference; the shop renders isolated PNGs.
const EXISTING_DECOR_PRODUCTS: DecorProduct[] = [
  decor('double-bed', 'Tweepersoonsbed', 'furniture', 'sleeping', 120, { x: 13, y: 0, width: 17.5, height: 27 }),
  decor('green-chair', 'Groene fauteuil', 'furniture', 'seating', 55, { x: 66.5, y: 2, width: 12.5, height: 23 }),
  decor('rattan-chair', 'Rotan stoel', 'furniture', 'seating', 60, { x: 78.5, y: 1, width: 11.5, height: 24 }),
  decor('hanging-chair', 'Hangstoel', 'furniture', 'seating', 75, { x: 89.5, y: 0, width: 10.5, height: 27 }),
  decor('cream-wardrobe', 'Crème kledingkast', 'furniture', 'storage', 90, { x: 0, y: 24, width: 12, height: 23 }),
  decor('green-wardrobe', 'Groene kledingkast', 'furniture', 'storage', 90, { x: 11, y: 25, width: 10, height: 22 }),
  decor('drawer-chest', 'Ladekast', 'furniture', 'storage', 60, { x: 20, y: 28, width: 13, height: 17 }),
  decor('round-table', 'Ronde tafel', 'furniture', 'tables', 70, { x: 61, y: 25, width: 17, height: 18 }),
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
  decor('white-flower', 'Lepelplant', 'plants', 'flowering-plants', 32, { x: 51, y: 69.5, width: 9.5, height: 21 }),
  decor('pink-flower', 'Flamingoplant', 'plants', 'flowering-plants', 32, { x: 58.7, y: 69.5, width: 9.5, height: 21 }),
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
  roomWidth: defaultRoomWidth(id, category),
  views: 1,
});

/**
 * Een draaibaar meubel: acht aanzichten in een eigen map. Een nieuw exemplaar
 * toevoegen is de frames neerzetten en hier één regel bijschrijven.
 */
const turnable = (id: string, name: string, category: DecorCategory, price: number, roomWidth: number): DecorProduct => ({
  id, name, store: 'furniture', category, price,
  image: `/assets/library/shop/decor/products/${id}/view-1.png`,
  crop: { x: 0, y: 0, width: 100, height: 100 },
  roomWidth,
  views: 8,
});

export const DECOR_PRODUCTS: DecorProduct[] = [
  turnable('plant-shelf', 'Plantenplank', 'storage', 55, 20),
  turnable('cloud-shelf', 'Wolkenplank', 'storage', 45, 20),
  furniture('pumpkin-pouf', 'Pompoenpoef', 'seating', 35),
  turnable('daisy-sofa', 'Bloemenbank', 'seating', 95, 25),
  turnable('daisy-armchair', 'Bloemfauteuil', 'seating', 60, 15),
  turnable('cream-corner-sofa', 'Crème hoekbank', 'seating', 115, 30),
  turnable('cream-two-seater', 'Crème tweezitsbank', 'seating', 90, 25),
  turnable('swivel-armchair', 'Draaifauteuil', 'seating', 65, 15),
  turnable('bunny-chair', 'Konijnenstoeltje', 'seating', 40, 10),
  turnable('bunk-bed-stairs', 'Stapelbed met trap', 'sleeping', 140, 26),
  turnable('shell-bed', 'Schelpbed', 'sleeping', 95, 24),
  turnable('ribbed-tv-cabinet', 'Tv-dressoir', 'storage', 70, 22),
  turnable('low-coffee-table', 'Lage salontafel', 'tables', 50, 19),

  furniture('dining-set', 'Ronde eethoek', 'tables', 95),
  furniture('arched-cabinet', 'Boogkast', 'storage', 85),
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

