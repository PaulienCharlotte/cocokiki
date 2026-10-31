/** Een vlak waar een bes in kan: het mandje of de oogstbalk (-1). */
export interface DropVak { id: number; rect: { left: number; right: number; top: number; bottom: number } }

/** Zo ver naast een mandje mag je loslaten en toch dat mandje bedoelen. */
export const DROP_MARGE = 96;

/**
 * Bij welk mandje hoort de plek waar je de bes losliet?
 *
 * Een mandje wint altijd van de oogstbalk erboven: die ligt er vlak tegenaan,
 * en wie net op de rand van een mandje mikt bedoelde het mandje. Valt de bes
 * naast alles, dan gaat hij terug naar de oogst (-1).
 */
export function dropDoel(x: number, y: number, vakken: DropVak[]): number {
  const raakt = (vak: DropVak) => x >= vak.rect.left && x <= vak.rect.right && y >= vak.rect.top && y <= vak.rect.bottom;
  const mandjes = vakken.filter(vak => vak.id >= 0);
  const erop = mandjes.find(raakt);
  if (erop) return erop.id;
  if (vakken.filter(vak => vak.id < 0).some(raakt)) return -1;
  let beste = -1, kortste = Infinity;
  for (const vak of mandjes) {
    const afstand = Math.hypot(Math.max(vak.rect.left - x, 0, x - vak.rect.right), Math.max(vak.rect.top - y, 0, y - vak.rect.bottom));
    if (afstand < kortste) { kortste = afstand; beste = vak.id; }
  }
  return kortste <= DROP_MARGE ? beste : -1;
}
