import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DECOR_SHOP_PRODUCTS } from '../data/decorCatalog';
import { DAG_LIMIET_PER_SPEL, MUNTEN_PER_SPEELDAG, PRIJS, winkelPrijs } from '../services/economie';
import { answerCoins, bedragMetDaglimiet, rewardAnswer } from '../services/answerRewards';
import { loadCurrency } from '../services/currency';

function bronbestanden(map: string): string[] {
  return readdirSync(map).flatMap(naam => {
    if (naam === 'node_modules' || naam.startsWith('.') || naam === 'dist' || naam === 'tests' || naam === 'docs') return [];
    const pad = join(map, naam);
    return statSync(pad).isDirectory() ? bronbestanden(pad) : /\.(ts|tsx)$/.test(pad) ? [pad] : [];
  });
}

test('geen losse munten in de code: alle bedragen komen uit services/economie.ts', () => {
  const verboden: Array<[RegExp, string]> = [
    [/awardCurrencyOnce\([^)]*,\s*\d+\s*\)/, 'awardCurrencyOnce met een vast getal'],
    [/rewardAnswer\([^)]*,\s*\d+\s*\)/, 'rewardAnswer met een vast getal'],
    [/rewardCoins:\s*\d+/, 'rewardCoins met een vast getal'],
    [/\bbonus:\s*\d+/, 'bonus met een vast getal'],
  ];
  for (const bestand of bronbestanden('.')) {
    if (bestand.endsWith('services/economie.ts')) continue;
    const bron = readFileSync(bestand, 'utf8');
    for (const [patroon, wat] of verboden) assert.doesNotMatch(bron, patroon, `${bestand}: ${wat}`);
  }
});

test('een volle boomhut kost ongeveer 80 tot 120 speeldagen van 20 minuten', () => {
  const meubels = DECOR_SHOP_PRODUCTS.reduce((som, product) => som + product.price, 0);
  let kamers = 0, binnen = 0, balkon = 0;
  for (let i = 0; i < 11; i++) {
    const b = PRIJS.kamerBinnen + PRIJS.kamerStap * binnen, a = PRIJS.kamerBalkon + PRIJS.kamerStap * balkon;
    if (b <= a) { kamers += b; binnen++; } else { kamers += a; balkon++; }
  }
  const dagen = (meubels + kamers + PRIJS.dak.blauw + PRIJS.dak.bloemen) / MUNTEN_PER_SPEELDAG;
  assert.ok(dagen >= 80 && dagen <= 120, `een volle boomhut kost nu ${Math.round(dagen)} speeldagen`);
  // Je eerste meubel kun je na één dag spelen kopen.
  assert.ok(Math.min(...DECOR_SHOP_PRODUCTS.map(p => p.price)) <= MUNTEN_PER_SPEELDAG);
});

test('winkelprijzen: klein decor 20–45, meubels tot hoogstens 250, afgerond op vijf', () => {
  assert.equal(winkelPrijs(10), 20);
  assert.equal(winkelPrijs(25), 40);
  assert.equal(winkelPrijs(85), 145);
  assert.equal(winkelPrijs(150), 250);
  for (const product of DECOR_SHOP_PRODUCTS) assert.equal(product.price % 5, 0, product.id);
});

test('na een half uur hetzelfde spel krijg je de helft, en de eindafrekening vult dat niet aan', () => {
  const geheugen = new Map<string, string>();
  const origineel = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => geheugen.get(k) ?? null, setItem: (k: string, v: string) => geheugen.set(k, v) } });
  try {
    const dag = new Date(2026, 10, 18, 10);
    for (let i = 0; i < DAG_LIMIET_PER_SPEL / 2; i++) rewardAnswer('math:test', 'r1', i, 2, dag);
    assert.equal(loadCurrency(), DAG_LIMIET_PER_SPEL);
    assert.equal(bedragMetDaglimiet('math:test', 2, dag), 1);
    rewardAnswer('math:test', 'r1', 'extra', 2, dag);
    assert.equal(loadCurrency(), DAG_LIMIET_PER_SPEL + 1);
    // De ingehouden munt telt als afgerekend.
    assert.equal(answerCoins('math:test', 'r1', dag), DAG_LIMIET_PER_SPEL + 2);
    // Een ander spel telt apart; morgen begint het opnieuw.
    assert.equal(bedragMetDaglimiet('clock:test', 2, dag), 2);
    assert.equal(bedragMetDaglimiet('math:test', 2, new Date(2026, 10, 19, 10)), 2);
    // Twee keer hetzelfde antwoord betaalt één keer en verhoogt de teller niet.
    const voor = loadCurrency();
    rewardAnswer('math:test', 'r1', 'extra', 2, dag);
    assert.equal(loadCurrency(), voor);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: origineel });
  }
});
