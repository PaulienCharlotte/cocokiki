export function memoryBoardIds(pairIds: readonly string[], matchedPairCount: number, size: number): string[] {
  const count = Math.max(1, Math.floor(size));
  const start = Math.floor(Math.max(0, matchedPairCount) / count) * count;
  return pairIds.slice(start, start + count);
}
