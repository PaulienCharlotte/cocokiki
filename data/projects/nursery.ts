import { DECOR_PRODUCTS_BY_ID } from '../decorCatalog';
export const PROJECT_BUDGET = 500;
export const NURSERY_ITEMS = [
  { id: 'crib', name: 'Babybedje', price: 180, image: '/assets/library/projects/luna-crib.webp', width: 26, frame: [28, 127, 712, 545, 768, 768], required: true },
  { id: 'dresser', name: 'Opbergkast', price: 140, image: DECOR_PRODUCTS_BY_ID['japandi-oak-sideboard'].image, width: 25, frame: [77, 134, 1620, 653, 1774, 887], required: true },
  { id: 'lamp', name: 'Vloerlamp', price: 45, image: DECOR_PRODUCTS_BY_ID['japandi-paper-floor-lamp'].image, width: 8, frame: [219, 61, 584, 1430, 1024, 1536], required: true },
  { id: 'shelf', name: 'Boekenkast', price: 95, image: DECOR_PRODUCTS_BY_ID['japandi-open-bookcase'].image, width: 14, frame: [187, 73, 646, 1391, 1024, 1536], required: false },
  { id: 'chair', name: 'Leesstoel', price: 60, image: DECOR_PRODUCTS_BY_ID['armchair-clay-front'].image, width: 19, frame: [27, 52, 1257, 1107, 1312, 1199], required: false },
] as const;
/** Een meubel-id; elke inrichtopdracht heeft zijn eigen lijst (zie data/projects/index.ts). */
export type NurseryItemId = string;
export const NURSERY_QUESTIONS = ['height', 'space', 'total', 'change', 'rug'] as const;
export type NurseryQuestionId = typeof NURSERY_QUESTIONS[number];
