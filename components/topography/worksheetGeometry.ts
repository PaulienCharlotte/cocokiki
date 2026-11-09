import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Location } from '../../types';
import { topographyDataset } from '../../data/topography/datasets';
import { validateWorksheetGeometry, WorksheetGeometry } from '../../data/topography/geometry';

const requests = new Map<string, Promise<WorksheetGeometry>>();
export function useWorksheetGeometry(areaId: string) {
  const dataset = topographyDataset(areaId);
  const [state, setState] = useState<{ id: string; data?: WorksheetGeometry; error?: boolean }>({ id: '' });
  useEffect(() => {
    if (!dataset) return;
    let cancelled = false;
    let request = requests.get(dataset.id);
    if (!request) {
      request = fetch(dataset.geometryUrl).then(response => {
        if (!response.ok) throw new Error('Kaartdata niet bereikbaar');
        return response.json();
      }).then(data => validateWorksheetGeometry(data, dataset));
      requests.set(dataset.id, request);
    }
    request.then(data => { if (!cancelled) setState({ id: dataset.id, data }); })
      .catch(() => { requests.delete(dataset.id); if (!cancelled) setState({ id: dataset.id, error: true }); });
    return () => { cancelled = true; };
  }, [dataset]);
  return { dataset, data: state.id === areaId ? state.data : undefined, error: state.id === areaId && state.error };
}

/** Dezelfde echte kaartvormen voor verkennen, aanwijzen, spellen en toetsen. */
export function drawWorksheetGeometry(map: L.Map, data: WorksheetGeometry, locations: Location[], selectedId: string | null | undefined, onSelect?: (location: Location) => void) {
  const group = L.featureGroup().addTo(map);
  const tokens = getComputedStyle(map.getContainer());
  const color = (token: string) => tokens.getPropertyValue(token).trim();
  const border = color('--color-primary');
  const areas = new Map(locations.map(location => [location.id, location]));
  const panes = [['worksheet-water', 390], ['worksheet-land', 400], ['worksheet-region', 410], ['worksheet-river', 420]] as const;
  for (const [name, zIndex] of panes) {
    const pane = map.getPane(name) ?? map.createPane(name);
    pane.style.zIndex = String(zIndex);
  }
  L.geoJSON(data.context as any, { interactive: false, pane: 'worksheet-land', style: { stroke: false, fillColor: color('--color-background'), fillOpacity: .6 } }).addTo(group);
  L.geoJSON(data.boundaries as any, { interactive: false, pane: 'worksheet-land', style: { color: border, weight: 1, fill: false } }).addTo(group);
  map.attributionControl.addAttribution('Natural Earth');
  group.on('remove', () => map.attributionControl.removeAttribution('Natural Earth'));
  // Eerst landen, daarna eilanden/gebergten. Zo blijven kleinere overlappende vormen bereikbaar.
  const ordered = [...data.features].sort((a, b) => Number(areas.get(b.properties.id)?.type === 'country') - Number(areas.get(a.properties.id)?.type === 'country'));
  for (const feature of ordered) {
    const location = areas.get(feature.properties.id);
    if (!location || location.geometryType === 'point') continue;
    const river = location.geometryType === 'line';
    const water = location.type === 'water';
    const selected = location.id === selectedId;
    const fillColor = color(selected ? '--color-reward' : water ? '--color-sky' : location.type === 'country' ? '--color-sage' : '--color-lilac');
    const pane = river ? 'worksheet-river' : water ? 'worksheet-water' : location.type === 'country' ? 'worksheet-land' : 'worksheet-region';
    if (river) {
      L.geoJSON(feature as any, { pane, bubblingMouseEvents: false,
        style: { color: border, weight: 44, opacity: 0, fill: false },
      }).on('click', () => onSelect?.(location)).addTo(group);
    }
    const layer = L.geoJSON(feature as any, {
      pane, bubblingMouseEvents: false,
      style: { color: selected ? color('--color-reward-strong') : river ? color('--color-primary') : border,
        stroke: !water || river,
        weight: river ? selected ? 7 : 4 : selected ? 3 : 1.5,
        fillColor, fillOpacity: selected ? .65 : water ? .3 : .25,
        className: 'worksheet-feature' },
    }).addTo(group);
    layer.on('click', () => onSelect?.(location));
    layer.eachLayer((path: any) => {
      const element = path.getElement?.();
      if (!element) return;
      element.setAttribute('data-topo-id', location.id);
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      // Ook voor schermlezers geen antwoord verklappen tijdens een oefening/toets.
      element.setAttribute('aria-label', river ? 'Rivier op de kaart' : water ? 'Watergebied op de kaart' : location.type === 'country' ? 'Land op de kaart' : 'Gebied op de kaart');
      element.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect?.(location); }
      });
    });
  }
  return group;
}

// Kleine landen behouden hun echte grens. Dit raakvlak ligt op het echte anker,
// zonder Nice of Monaco te verplaatsen om een overlap kunstmatig op te lossen.
export const needsAreaHandle = (location: Location) => location.geometryType !== 'point' && location.type === 'country' && ['AD', 'MC', 'LU'].includes(
  topographyDataset(location.provinceId)?.items.find(item => item.id === location.id)?.countryCode ?? ''
);
