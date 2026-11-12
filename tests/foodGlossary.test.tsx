import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FOOD_TERMS, FOOD_TERMS_BY_ID, foodTextParts } from '../data/cooking/foodGlossary';
import { PRODUCT_KNOWLEDGE } from '../data/cooking/productKnowledge';
import { INGREDIENTS_BY_ID } from '../data/cooking/catalog';
import { FoodText } from '../components/food/FoodKnowledge';

test('begrippen kunnen zonder ontbrekende links verder worden uitgelegd', () => {
  assert.equal(new Set(FOOD_TERMS.map(term => term.id)).size, FOOD_TERMS.length);
  for (const term of FOOD_TERMS) {
    for (const related of term.related) assert.ok(FOOD_TERMS_BY_ID[related], `${term.id}: ${related}`);
    assert.ok(term.summary && term.explanation && term.example && term.source.startsWith('https://'));
  }
  for (const id of Object.keys(PRODUCT_KNOWLEDGE)) assert.ok(INGREDIENTS_BY_ID[id], id);
});

test('woorden blijven heel en specifieke begrippen winnen van algemene woorden', () => {
  const text = 'Vitamine B12 helpt rode bloedcellen. Bloedcellen zijn geen bloedworst.';
  const parts = foodTextParts(text);
  assert.equal(parts.map(part => part.text).join(''), text);
  assert.deepEqual(parts.filter(part => part.termId).map(part => part.termId), ['vitamin-b12', 'red-blood-cells']);
  const html = renderToStaticMarkup(<FoodText text="Rode bloedcellen vervoeren zuurstof." onTerm={() => undefined} />);
  assert.match(html, /Wat betekent Rode bloedcellen/);
  assert.match(html, /Wat betekent zuurstof/);
  assert.doesNotMatch(html, /role="dialog"/);
});
