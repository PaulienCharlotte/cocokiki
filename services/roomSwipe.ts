export function roomSwipeDirection(dx: number, dy: number, atLeft: boolean, atRight: boolean): -1 | 1 | null {
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  if (dx < 0 && atRight) return 1;
  if (dx > 0 && atLeft) return -1;
  return null;
}
