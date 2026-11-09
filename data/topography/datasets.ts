import { Location, Province } from '../../types';
import source from './france-spain-portugal.json';
import geography from './france-spain-portugal-geography.json';

export interface WorksheetItem {
  number: number;
  id: string;
  name: string;
  type: string;
  geometryType: 'point' | 'polygon' | 'line' | 'region';
  countryCode?: string;
  anchor?: { lat: number; lng: number };
}

export interface TopographyDataset {
  id: string;
  title: string;
  items: WorksheetItem[];
  geometryUrl: string;
  bounds: [[number, number], [number, number]];
  anchors: Record<string, number[]>;
  area: Province;
}

// Nieuwe werkbladen voegen alleen een bronlijst, geografiebestand en registratie toe.
export const TOPOGRAPHY_DATASETS: TopographyDataset[] = [{
  id: source.datasetId,
  title: source.title,
  items: source.items as WorksheetItem[],
  geometryUrl: '/data/geojson/france-spain-portugal.geo.json',
  bounds: [[35, -12], [52, 11]],
  anchors: geography.anchors,
  area: { id: source.datasetId, name: source.title, center: [44, 0], zoom: 5, capital: '', color: 'var(--color-sage)', isStudyArea: true },
}];

export const topographyDataset = (areaId: string) => TOPOGRAPHY_DATASETS.find(dataset => dataset.id === areaId);

export function worksheetLocations(dataset: TopographyDataset): Location[] {
  return dataset.items.map(item => {
    const anchor = dataset.anchors[item.id];
    if (!anchor || anchor.length !== 2) throw new Error(`Geografisch anker ontbreekt: ${item.id}`);
    return {
      id: item.id, name: item.name, provinceId: dataset.id,
      type: item.type === 'country' ? 'country'
        : ['river', 'sea', 'ocean'].includes(item.type) ? 'water'
        : ['island', 'mountain_range'].includes(item.type) ? 'region' : 'city',
      lat: anchor[0], lng: anchor[1],
      datasetId: dataset.id, sourceNumber: item.number, geometryType: item.geometryType,
    };
  });
}

export const WORKSHEET_LOCATIONS = TOPOGRAPHY_DATASETS.flatMap(worksheetLocations);
