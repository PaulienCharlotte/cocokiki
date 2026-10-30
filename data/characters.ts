/**
 * Wie er in de app praat, en met welk plaatje.
 *
 * De personages horen bij een gebied: Coco bij koken, Kiki bij planten,
 * Baby Lua bij rekenen en Seb bij topografie. Eén lijst, zodat een scherm
 * niet zelf een plaatje kan kiezen en Kiki nooit per ongeluk kookt.
 */
export type CharacterId = 'kiki' | 'coco' | 'lua' | 'seb';

export interface Character {
  naam: string;
  beeld: string;
  /** Waar dit personage over gaat; bedoeld voor commentaar en tests. */
  gebied: 'planten' | 'koken' | 'rekenen' | 'topografie';
}

export const CHARACTERS: Record<CharacterId, Character> = {
  kiki: { naam: 'Kiki', beeld: '/images/avatars/kiki/kiki-plant.webp', gebied: 'planten' },
  coco: { naam: 'Coco', beeld: '/images/avatars/coco.webp', gebied: 'koken' },
  // De bestandsnamen van Lua en Seb staan verwisseld in de oude map; de
  // paden hieronder zijn de plaatjes die er echt bij horen.
  lua: { naam: 'Baby Lua', beeld: '/images/avatars/luiaard.webp', gebied: 'rekenen' },
  seb: { naam: 'Seb', beeld: '/images/avatars/lua.webp', gebied: 'topografie' },
};
