type Guard = (proceed: () => void) => void;
let guard: Guard | null = null;
export const hasNavigationGuard = () => guard !== null;
export function registerNavigationGuard(next: Guard): () => void {
  guard = next;
  return () => { if (guard === next) guard = null; };
}
export function guardedNavigation(proceed: () => void): void {
  if (guard) guard(proceed); else proceed();
}
