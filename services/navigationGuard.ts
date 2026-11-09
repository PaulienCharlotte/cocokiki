type Guard = (proceed: () => void) => void;
const guards: Array<{ run: Guard; priority: number }> = [];
export const hasNavigationGuard = () => guards.length > 0;
export function registerNavigationGuard(next: Guard, priority = 0): () => void {
  const entry = { run: next, priority };
  guards.push(entry);
  return () => { const index = guards.indexOf(entry); if (index >= 0) guards.splice(index, 1); };
}
export function guardedNavigation(proceed: () => void): void {
  // Een gebiedsuitgang kan voorrang krijgen op een onderliggende activiteit.
  const guard = guards.reduce<typeof guards[number] | null>((chosen, entry) => !chosen || entry.priority >= chosen.priority ? entry : chosen, null);
  if (guard) guard.run(proceed); else proceed();
}
