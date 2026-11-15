/**
 * Wie er in de app praat, en met welk plaatje.
 *
 * De personages horen bij een gebied: Coco bij koken, Kiki bij planten,
 * Baby Lua bij rekenen en Seb bij topografie. Eén lijst, zodat een scherm
 * niet zelf een plaatje kan kiezen en Kiki nooit per ongeluk kookt.
 */
export type CharacterId = 'kiki' | 'coco' | 'lua' | 'seb' | 'luna';

export interface Character {
  naam: string;
  beeld: string;
  /** Waar dit personage over gaat; bedoeld voor commentaar en tests. */
  gebied: 'planten' | 'koken' | 'rekenen' | 'topografie' | 'inrichten';
}

export const CHARACTERS: Record<CharacterId, Character> = {
  luna: { naam: 'Luna', beeld: '/images/avatars/luna-profile.webp', gebied: 'inrichten' },
  kiki: { naam: 'Kiki', beeld: '/images/avatars/kiki/kiki-plant.webp', gebied: 'planten' },
  coco: { naam: 'Coco', beeld: '/images/avatars/coco-profile.webp', gebied: 'koken' },
  // Visueel gecontroleerd: Lua is de luiaard, luiaard.webp het stokstaartje.
  lua: { naam: 'Baby Lua', beeld: '/images/avatars/lua-profile.webp', gebied: 'rekenen' },
  seb: { naam: 'Seb', beeld: '/images/avatars/luiaard.webp', gebied: 'topografie' },
};
