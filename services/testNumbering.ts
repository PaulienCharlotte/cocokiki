export function shuffledTestIds(ids: string[], random = Math.random): string[] {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.length > 1 && result.every((id, i) => id === ids[i])) result.push(result.shift()!);
  return result;
}

export function nextUnansweredTestId(ids: string[], current: string, answers: Record<string, string>, deferredIds: string[] = []): string | null {
  if (!ids.length) return null;
  const index = Math.max(0, ids.indexOf(current));
  const pending: string[] = [];
  for (let offset = 1; offset <= ids.length; offset++) {
    const candidate = ids[(index + offset) % ids.length];
    if (!answers[candidate]?.trim()) pending.push(candidate);
  }
  return pending.find(id => !deferredIds.includes(id)) ?? pending[0] ?? ids[(index + 1) % ids.length];
}
