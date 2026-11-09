import { TopographyDataset } from './datasets';

export interface WorksheetFeature {
  type: 'Feature';
  properties: { id: string; sourceNumber: number; sourceName: string; anchor: number[] };
  geometry: { type: string; coordinates: any[] };
}
export interface WorksheetGeometry {
  type: 'FeatureCollection';
  features: WorksheetFeature[];
  context: { type: 'FeatureCollection'; features: any[] };
  boundaries: { type: 'FeatureCollection'; features: any[] };
}

export function validateWorksheetGeometry(data: WorksheetGeometry, dataset: TopographyDataset): WorksheetGeometry {
  if (data?.type !== 'FeatureCollection' || data.features?.length !== dataset.items.length || !data.context?.features?.length || !data.boundaries?.features?.length) throw new Error('Onvolledige kaartdata');
  const features = new Map(data.features.map(feature => [feature.properties.id, feature]));
  if (features.size !== dataset.items.length) throw new Error('Dubbele kaartobjecten');
  for (const item of dataset.items) {
    const feature = features.get(item.id);
    const allowed = item.geometryType === 'point' ? ['Point'] : item.geometryType === 'line' ? ['LineString', 'MultiLineString'] : ['Polygon', 'MultiPolygon'];
    if (!feature || feature.properties.sourceNumber !== item.number || !allowed.includes(feature.geometry.type) || !feature.geometry.coordinates.length) throw new Error(`Onjuiste kaartvorm: ${item.id}`);
  }
  return data;
}
