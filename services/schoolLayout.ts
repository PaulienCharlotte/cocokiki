import { commitLocalState, readDocument } from './localState';
export const SCHOOL_LAYOUT_KEY = 'cocokiki:school-layout:v1';
export const SCHOOL_ICON_IDS = ['topo', 'clock', 'tables', 'math'] as const;
export type SchoolIconId = typeof SCHOOL_ICON_IDS[number];
export type SchoolLayoutMode = 'mobile' | 'desktop';
export interface IconPoint { x: number; y: number }
export interface SchoolLayout { version: 1; mobile: Record<SchoolIconId, IconPoint>; desktop: Record<SchoolIconId, IconPoint> }
export function defaultSchoolLayout(): SchoolLayout {
  return { version: 1,
    desktop: { topo: { x: .12, y: .82 }, clock: { x: .37, y: .82 }, tables: { x: .63, y: .82 }, math: { x: .88, y: .82 } },
    mobile: { topo: { x: .25, y: .52 }, clock: { x: .75, y: .52 }, tables: { x: .25, y: .82 }, math: { x: .75, y: .82 } },
  };
}
export function migrateSchoolLayout(value: unknown): SchoolLayout {
  const result = defaultSchoolLayout();
  if (!value || typeof value !== 'object' || (value as SchoolLayout).version !== 1) return result;
  for (const mode of ['mobile', 'desktop'] as const) for (const id of SCHOOL_ICON_IDS) {
    const point = (value as SchoolLayout)[mode]?.[id];
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) result[mode][id] = { x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) };
  }
  return result;
}
export function loadSchoolLayout(): SchoolLayout {
  try { return migrateSchoolLayout(JSON.parse(readDocument(SCHOOL_LAYOUT_KEY) ?? 'null')); } catch { return defaultSchoolLayout(); }
}
export function saveSchoolLayoutMode(mode: SchoolLayoutMode, positions: Record<SchoolIconId, IconPoint>): boolean {
  const current = loadSchoolLayout();
  current[mode] = migrateSchoolLayout({ ...current, [mode]: positions })[mode];
  return commitLocalState({ [SCHOOL_LAYOUT_KEY]: JSON.stringify(current) }).status === 'applied';
}
export function boundedSchoolPoint(x: number, y: number, width: number, height: number, iconWidth: number, iconHeight: number): IconPoint {
  const clamp = (value: number, extent: number, size: number) => {
    if (extent <= 0) return .5;
    const margin = Math.min(extent / 2, size / 2 + 4);
    return Math.max(margin, Math.min(extent - margin, value)) / extent;
  };
  return { x: clamp(x, width, iconWidth), y: clamp(y, height, iconHeight) };
}
