/**
 * Dezelfde toevalsbron per vraag een stukje verschuiven.
 *
 * Zonder dit geeft een vaste toevalsbron — zoals in een test — tien keer
 * dezelfde vraag, en dan blijft een deck halfleeg.
 */
export const verschoven = (random: () => number, index: number) => () => (random() + index * 0.37) % 1;
