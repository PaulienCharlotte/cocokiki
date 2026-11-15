import test from 'node:test';
import assert from 'node:assert/strict';
import { answerNursery, beginNursery, checkoutNursery, finishNursery, loadNursery, nurseryEarned, nurseryQuestion, nurseryTotal, positionNursery, prepareNurseryRoom, resizeNursery, revealNursery, toggleNurseryItem } from '../services/nurseryProject';
import { readDocument } from '../services/localState';
import { loadCurrency } from '../services/currency';
import { ROOM_INVENTORY_KEY } from '../services/roomInventory';
function stored(run: (block: (b: boolean) => void) => void) {
 const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'); const data = new Map<string, string>(); let blocked = false;
 Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { if (blocked) throw Error('vol'); data.set(key, value); } } });
 try { run(b => { blocked = b; }); } finally { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else Reflect.deleteProperty(globalThis, 'localStorage'); }
}
function solve(helped = false) { const s = loadNursery(), q = nurseryQuestion(s)!; if (helped) assert.ok(revealNursery(s.revision)); assert.equal(answerNursery(loadNursery().revision, String(q.answer).replace('.', ',')), 'correct'); }
function furnish() {
 assert.ok(positionNursery(loadNursery().revision, 'crib', 19, 84));
 assert.ok(positionNursery(loadNursery().revision, 'dresser', 68, 84));
 assert.ok(positionNursery(loadNursery().revision, 'lamp', 91, 84));
}
test('Luna-project doorloopt meten, eigen budget, narekenen en afleveren met maximaal 100 munten', () => stored(() => {
 const inventory = readDocument(ROOM_INVENTORY_KEY);
 assert.equal(finishNursery(0), false); assert.ok(beginNursery());
 assert.equal(answerNursery(loadNursery().revision, '260'), 'wrong');
 solve(); solve();
 assert.equal(loadNursery().stage, 'shop'); assert.equal(checkoutNursery(loadNursery().revision), false);
 for (const id of ['crib', 'dresser', 'lamp'] as const) assert.ok(toggleNurseryItem(loadNursery().revision, id));
 assert.equal(nurseryTotal(loadNursery()), 365); assert.equal(loadCurrency(), 24);
 const stale = loadNursery().revision;
 assert.ok(toggleNurseryItem(stale, 'shelf')); assert.equal(toggleNurseryItem(stale, 'chair'), false);
 assert.equal(toggleNurseryItem(loadNursery().revision, 'chair'), false); // 520 boven budget
 assert.ok(toggleNurseryItem(loadNursery().revision, 'shelf'));
 assert.ok(checkoutNursery(loadNursery().revision)); solve(); solve(); solve();
 assert.equal(loadCurrency(), 60); assert.equal(finishNursery(loadNursery().revision), false);
 furnish(); assert.ok(finishNursery(loadNursery().revision));
 assert.equal(loadNursery().stage, 'complete'); assert.equal(nurseryEarned(), 100); assert.equal(loadCurrency(), 100);
 assert.equal(finishNursery(loadNursery().revision), false); assert.equal(beginNursery(), false);
 assert.equal(readDocument(ROOM_INVENTORY_KEY), inventory);
}));
test('hulp blijft opgeslagen en geeft ook bij aflevering geen beloning voor die rekenstappen', () => stored(block => {
 block(true); assert.equal(beginNursery(), false); block(false); assert.equal(loadNursery().stage, 'brief'); assert.ok(beginNursery());
 const s = loadNursery(); assert.ok(revealNursery(s.revision)); assert.ok(loadNursery().helped.includes('height'));
 block(true); assert.equal(answerNursery(loadNursery().revision, '2,6'), 'save-failed'); block(false);
 assert.equal(loadNursery().stage, 'height'); solve(true); solve(true);
 for (const id of ['crib', 'dresser', 'lamp'] as const) assert.ok(toggleNurseryItem(loadNursery().revision, id));
 assert.ok(checkoutNursery(loadNursery().revision)); solve(true); solve(true); solve(true); furnish();
 assert.ok(finishNursery(loadNursery().revision)); assert.equal(loadCurrency(), 0);
}));
test('inrichten zonder rekenstappen, overlappende meubels en verouderde handelingen betalen niets', () => stored(() => {
 assert.equal(positionNursery(0, 'crib', 20, 84), false); assert.ok(beginNursery()); solve(); solve();
 for (const id of ['crib', 'dresser', 'lamp'] as const) assert.ok(toggleNurseryItem(loadNursery().revision, id));
 assert.ok(checkoutNursery(loadNursery().revision)); solve(); solve(); solve();
 for (const id of ['crib', 'dresser', 'lamp'] as const) assert.ok(positionNursery(loadNursery().revision, id, 30, 84));
 assert.equal(finishNursery(loadNursery().revision), false); assert.equal(loadCurrency(), 60);
 const rev = loadNursery().revision; furnish(); assert.equal(positionNursery(rev, 'crib', 40, 84), false);
}));

test('één geholpen stap levert ook in de afsluitbonus niets op', () => stored(() => {
 assert.ok(beginNursery()); solve(true); solve();
 for (const id of ['crib', 'dresser', 'lamp'] as const) assert.ok(toggleNurseryItem(loadNursery().revision, id));
 assert.ok(checkoutNursery(loadNursery().revision)); solve(); solve(); solve();
 assert.equal(loadCurrency(), 48); furnish(); assert.ok(finishNursery(loadNursery().revision)); assert.equal(loadCurrency(), 80);
}));


test('projectmeubels staan direct klaar; schalen bewaart maat en controleert overlap', () => stored(() => {
 assert.ok(beginNursery()); solve(); solve();
 for (const id of ['crib', 'dresser', 'lamp'] as const) assert.ok(toggleNurseryItem(loadNursery().revision, id));
 assert.ok(checkoutNursery(loadNursery().revision)); solve(); solve(); solve();
 assert.ok(prepareNurseryRoom());
 assert.equal(Object.keys(loadNursery().positions).length, 3);
 const revision = loadNursery().revision;
 assert.ok(prepareNurseryRoom()); assert.equal(loadNursery().revision, revision);
 assert.ok(resizeNursery(revision, 'lamp', 1));
 assert.equal(loadNursery().positions.lamp!.scale, 1.15);
 assert.equal(resizeNursery(revision, 'lamp', -1), false);
 assert.ok(positionNursery(loadNursery().revision, 'lamp', 1000, 0));
 assert.equal(loadNursery().positions.lamp!.scale, 1.15);
 assert.equal(loadNursery().positions.lamp!.y, 70);
 for (let i = 0; i < 30; i++) assert.ok(resizeNursery(loadNursery().revision, 'lamp', -1));
 assert.equal(loadNursery().positions.lamp!.scale, .6);
 for (let i = 0; i < 30; i++) assert.ok(resizeNursery(loadNursery().revision, 'lamp', 1));
 assert.equal(loadNursery().positions.lamp!.scale, 3);
 furnish(); assert.equal(finishNursery(loadNursery().revision), false);
}));
