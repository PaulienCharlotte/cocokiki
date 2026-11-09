import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('grocery layout bounds its recipe strip, product rows and checkout independently', () => {
  const css = readFileSync('components/shop/shop-layout.css', 'utf8');
  const screen = readFileSync('pages/ShopScreen.tsx', 'utf8');
  assert.match(screen, /import '\.\.\/components\/shop\/shop-layout\.css'/);
  assert.match(css, /\.shop-room \.shop-catalog\s*\{[^}]*max-width: 100%/);
  assert.match(css, /\.shop-room \.shopping-strip__items\s*\{[^}]*min-width: 0[^}]*overflow-x: auto/);
  assert.match(css, /\.shop-room \.shop-products\s*\{[^}]*grid-auto-rows: max-content/);
  assert.match(css, /\.shop-room \.shop-drawer__items\s*\{[^}]*min-height: 0[^}]*overflow-y: auto/);
  assert.match(css, /\.shop-room \.shop-drawer__checkout\s*\{[^}]*max-height: 50svh[^}]*overflow-y: auto/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.equal((css.match(/\{/g) ?? []).length, (css.match(/\}/g) ?? []).length);
  assert.doesNotMatch(css, /font-size:\s*(?:\d|clamp)/);
});
