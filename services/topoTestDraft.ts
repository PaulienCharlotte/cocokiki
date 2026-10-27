import { readLocal, writeLocal } from './localProgress';
export interface TestDraft { answers: Record<string, string>; submitted: boolean; retryIds: string[] | null; orderIds?: string[]; deferredIds?: string[] }
export function testDraftKey(ids: string[]): string { return `cocokiki:topo-test:v1:${JSON.stringify([...ids].sort())}`; }
export function loadTestDraft(ids: string[]): TestDraft {
  const saved = readLocal<Partial<TestDraft> | null>(testDraftKey(ids), null);
  const validIds = new Set(ids);
  const answers = saved?.answers && typeof saved.answers === 'object' ? Object.fromEntries(Object.entries(saved.answers).filter(([id, value]) => validIds.has(id) && typeof value === 'string')) : {};
  const orderIds = Array.isArray(saved?.orderIds) ? [...new Set(saved.orderIds.filter(id => validIds.has(id)))] : [];
  const deferredIds = Array.isArray(saved?.deferredIds) ? [...new Set(saved.deferredIds.filter(id => validIds.has(id)))] : [];
  return { answers, submitted: saved?.submitted === true, retryIds: Array.isArray(saved?.retryIds) ? saved.retryIds.filter(id => validIds.has(id)) : null, ...(orderIds.length ? { orderIds } : {}), ...(deferredIds.length ? { deferredIds } : {}) };
}
export function saveTestDraft(ids: string[], draft: TestDraft): boolean { return writeLocal(testDraftKey(ids), draft); }
