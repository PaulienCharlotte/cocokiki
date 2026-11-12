/** Eén coördinatenstelsel voor de kookplaat, de pan en alle aanraakdoelen. */
export const COOKTOP_ZONES = [
  { id: 'small', label: 'Kleine kookzone', x: 250, y: 165, radius: 85 },
  { id: 'medium', label: 'Middelgrote kookzone', x: 260, y: 420, radius: 110 },
  { id: 'large', label: 'Grote kookzone', x: 670, y: 270, radius: 140 },
] as const;
export const COMPACT_COOKTOP_ZONES = [
  { ...COOKTOP_ZONES[0], x: 150, y: 160, radius: 100 },
  { ...COOKTOP_ZONES[1], x: 150, y: 470, radius: 105 },
  { ...COOKTOP_ZONES[2], x: 420, y: 320, radius: 115 },
] as const;
export type CooktopZoneId = typeof COOKTOP_ZONES[number]['id'];
export function isCooktopZone(value: unknown): value is CooktopZoneId {
  return COOKTOP_ZONES.some(zone => zone.id === value);
}
export function nearestCooktopZone(point: { x: number; y: number }, zones: ReadonlyArray<{ id: CooktopZoneId; x: number; y: number; radius: number }> = COOKTOP_ZONES): CooktopZoneId | undefined {
  return zones.find(zone => Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.radius)?.id;
}
export function cooktopPanFrame(asset: string, center: { x: number; y: number }, width = 400) {
  // Het bestaande panplaatje is 420×260; het midden van de bodem ligt bij 130×130.
  // De steel telt dus niet mee bij het uitlijnen op een kookzone.
  const fryingPan = asset.includes('pan-empty') || asset.includes('pan-pancake') || asset.includes('frying-pan');
  const height = fryingPan ? width * 260 / 420 : width * 2 / 3;
  const anchorX = fryingPan ? width * 130 / 420 : asset.includes('omelette') ? width * .4 : width * .5;
  return { x: center.x - anchorX, y: center.y - height * .5, width, height };
}
