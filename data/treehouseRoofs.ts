import { PRIJS } from '../services/economie';
import type { RoofAsset } from './treehouseUnits';

export const ROOF_PRODUCTS: { asset: RoofAsset; label: string; price: number }[] = [
  { asset: 'roof', label: 'Klassiek dak', price: 0 },
  { asset: 'roofBlue', label: 'Blauw dak', price: PRIJS.dak.blauw },
  { asset: 'roofFlowers', label: 'Bloemendak', price: PRIJS.dak.bloemen },
];
