import { isBaseRoom, isExtraRoom, ROOM_TEMPLATE_ASSETS, ROOM_TEMPLATES, TREEHOUSE_ROOMS, type ExtraRoomId, type RoomTemplateId, type TreehouseRoomDefinition, type TreehouseRoomId } from '../data/treehouse';
import { readDocument, readLocalState } from './localState';
import { spendCurrencyOnce } from './currency';
import { loadTreehouseLayout } from './treehouseLayout';
import { buildSlots, validBuildRooms } from '../data/treehouseUnits';
import { ROOM_ICONS } from '../data/roomIcons';

export const ROOM_EXPANSIONS_KEY = 'cocokiki:room-expansions:v1';
export interface RoomInstance { id: ExtraRoomId; template: RoomTemplateId; name: string; purchaseId: string; icon?: string }
export interface RoomExpansions { version: 1; rooms: RoomInstance[] }
export const roomGroup = (template: RoomTemplateId) => ROOM_TEMPLATES.find(item => item.id === template)?.group;
export function migrateRoomExpansions(value: unknown): RoomExpansions {
  const result: RoomExpansions = { version: 1, rooms: [] };
  if (!value || typeof value !== 'object' || (value as RoomExpansions).version !== 1 || !Array.isArray((value as RoomExpansions).rooms)) return result;
  for (const room of (value as RoomExpansions).rooms) {
    if (!room || !isExtraRoom(room.id) || !ROOM_TEMPLATES.some(item => item.id === room.template) || typeof room.name !== 'string' || !room.name.trim() || typeof room.purchaseId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(room.purchaseId)) continue;
    if (result.rooms.some(item => item.id === room.id || item.purchaseId === room.purchaseId)) continue;
    if (result.rooms.length >= 11) continue;
    result.rooms.push({ id: room.id, template: room.template, name: room.name.trim().slice(0, 30), purchaseId: room.purchaseId, ...(ROOM_ICONS.some(icon => icon.id === room.icon) ? { icon: room.icon } : {}) });
  }
  return result;
}
export function loadRoomExpansions(): RoomExpansions {
  try { return migrateRoomExpansions(JSON.parse(readDocument(ROOM_EXPANSIONS_KEY) ?? 'null')); } catch { return { version: 1, rooms: [] }; }
}
export function nextRoomPrice(state: RoomExpansions, group: 'inside' | 'balcony'): number | null {
  if (state.rooms.length >= 11) return null;
  return (group === 'inside' ? 150 : 100) + 100 * state.rooms.filter(room => roomGroup(room.template) === group).length;
}
export function roomTemplatePrice(state: RoomExpansions, templateId: RoomTemplateId): number | null {
  const template = ROOM_TEMPLATES.find(item => item.id === templateId);
  if (!template) return null;
  const base = nextRoomPrice(state, template.group);
  return base === null ? null : base + (templateId === 'garden-room' ? 150 : 0);
}
export function ownedRooms(state = loadRoomExpansions()): TreehouseRoomDefinition[] {
  const extensions = state.rooms.map(room => {
    const template = ROOM_TEMPLATES.find(item => item.id === room.template)!;
    return { id: room.id, label: room.name, path: `/treehouse/${room.id}` as const, background: template.background, icon: template.icon, alt: `Lege ${template.label.toLowerCase()} in de boomhut` };
  });
  return [
    ...['bedroom', 'living-room', 'kitchen', 'bathroom'].map(id => TREEHOUSE_ROOMS.find(room => room.id === id)!),
    ...extensions.filter(room => roomGroup(state.rooms.find(item => item.id === room.id)!.template) === 'inside'),
    TREEHOUSE_ROOMS.find(room => room.id === 'terrace')!,
    ...extensions.filter(room => roomGroup(state.rooms.find(item => item.id === room.id)!.template) === 'balcony'),
  ];
}
export function ownsRoom(id: TreehouseRoomId): boolean { return isBaseRoom(id) || loadRoomExpansions().rooms.some(room => room.id === id); }
export function buyRoom(templateId: RoomTemplateId, name: string, purchaseId: string, quotedPrice?: number, icon?: string): { status: 'applied' | 'duplicate' | 'invalid' | 'insufficient' | 'full' | 'price-changed'; room?: ExtraRoomId } {
  try {
    const raw = readDocument(ROOM_EXPANSIONS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed?.version !== 1 || !Array.isArray(parsed.rooms) || migrateRoomExpansions(parsed).rooms.length !== parsed.rooms.length) return { status: 'invalid' };
    }
  } catch { return { status: 'invalid' }; }
  const state = loadRoomExpansions(), template = ROOM_TEMPLATES.find(item => item.id === templateId);
  const old = state.rooms.find(room => room.purchaseId === purchaseId);
  if (old) return old.template === templateId ? { status: 'duplicate', room: old.id } : { status: 'invalid' };
  if (!template || typeof name !== 'string' || !name.trim() || typeof purchaseId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(purchaseId)) return { status: 'invalid' };
  if (icon !== undefined && !ROOM_ICONS.some(item => item.id === icon)) return { status: 'invalid' };
  const layout = loadTreehouseLayout();
  if (!buildSlots(layout).some(slot => validBuildRooms([...layout, { id: '__room-purchase', asset: ROOM_TEMPLATE_ASSETS[templateId], name, ...slot }]))) return { status: 'full' };
  const price = roomTemplatePrice(state, templateId);
  if (price === null) return { status: 'full' };
  if (quotedPrice !== undefined && quotedPrice !== price) return { status: 'price-changed' };
  const id = (Array.from({ length: 11 }, (_, index) => `extra-${index + 1}`) as ExtraRoomId[]).find(candidate => !state.rooms.some(room => room.id === candidate));
  if (!id) return { status: 'full' };
  // A receipt without its room document must not silently restore ownership for free.
  try { if (Object.hasOwn(readLocalState().appliedTransactions, `room:buy:${purchaseId}`)) return { status: 'invalid' }; } catch { return { status: 'invalid' }; }
  const next: RoomExpansions = { version: 1, rooms: [...state.rooms, { id, template: templateId, name: name.trim().slice(0, 30), purchaseId, ...(icon ? { icon } : {}) }] };
  const saved = spendCurrencyOnce(`room:buy:${purchaseId}`, price, { [ROOM_EXPANSIONS_KEY]: JSON.stringify(next) });
  return { status: saved.status, ...(saved.status === 'applied' ? { room: id } : {}) };
}
