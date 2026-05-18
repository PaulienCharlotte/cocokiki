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
  const response = await fetch('/data/geojson/nl-provincies-2026.geojson');
  if (!response.ok) {
    throw new Error(`Kon Nederlandse provinciegrenzen niet laden: ${response.status}`);
  }

  return response.json() as Promise<DutchProvincesGeoJson>;
}
