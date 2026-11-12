import { loadStaticJson } from '../../../services/staticJson';
// Province borders for the Netherlands, used by topo maps, puzzles and province selection.
export interface DutchProvinceFeature {
  type: 'Feature';
  id?: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: unknown;
  };
  properties: {
    statnaam: string;
    [key: string]: unknown;
  };
}

export interface DutchProvincesGeoJson {
  type: 'FeatureCollection';
  features: DutchProvinceFeature[];
}

export async function loadDutchProvincesGeoJson(): Promise<DutchProvincesGeoJson> {
  return loadStaticJson<DutchProvincesGeoJson>('/data/geojson/nl-provincies-2026.geojson');
}
