export const ROOM_UNIT_ASSET = '/assets/library/treehouse/units/room-prototype.png';

// Alleen de zichtbare houten constructie telt mee, niet de transparante canvasmarge.
export const ROOM_UNIT_FRAME = { sourceWidth: 1448, sourceHeight: 1086, x: 48, y: 162, width: 1354, height: 780 };

export function prototypeUnitLayout(joined: boolean) {
  const { width, height } = ROOM_UNIT_FRAME;
  const stepX = width - (joined ? 72 : 0);
  const stepY = height - (joined ? 90 : 0);
  return {
    width: width + stepX,
    height: height + stepY,
    units: Array.from({ length: 4 }, (_, index) => ({
      id: `prototype-${index + 1}`,
      x: (index % 2) * stepX,
      y: Math.floor(index / 2) * stepY,
    })),
  };
}
