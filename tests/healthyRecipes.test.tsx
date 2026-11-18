import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RECIPES } from '../data/cooking/catalog';
import { GEZONDE_RECEPTEN } from '../data/cooking/healthyRecipes';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../data/cooking/discovery';
import { SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';
import { getRecipeAssetPaths, getRecipeIssues } from '../data/cooking/validation';
import { getRecipeAccess } from '../data/cooking/availability';
import { advanceJourney, answerDiscoveryQuestion, beginDiscoveryStage, collectCurrentIngredient, completeNutrientMemory, continueMathChallenges, createEmptyCookingProgress, showDiscoveryQuestion, showIngredientCollection, startJourney, startMathChallenges, submitMathChallenge } from '../services/cookingProgress';
import { adjustBasket, checkoutBasket, createShoppingSession } from '../services/shopping';
import { beginCookingAttempt, completeCookingAttempt } from '../services/cookingSession';
import { advancePreparation, migrateCookingSession, updateCookingStep } from '../data/cooking/session';
import { emptyStepState } from '../data/cooking/preparation';
import { tickOven } from '../data/cooking/oven';
import { HomeRecipeContent } from '../components/cooking/HomeRecipe';
import CookingInteraction from '../components/cooking/CookingInteraction';
import { COMPACT_COOKTOP_ZONES, COOKTOP_ZONES, cooktopPanFrame, nearestCooktopZone } from '../data/cooking/cooktopScene';

test('een voedingsverband is nodig voor verzamelen en beloont alleen de laatste vraag', () => {
  const recipe = GEZONDE_RECEPTEN.find(recipe => recipe.id === 'apple-oat-bake')!;
  let progress = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
  const config = INGREDIENT_DISCOVERIES_BY_ID.apple;
  assert.equal(config.questions.length, 2);
  assert.equal(config.questions[1].learningGoal, 'nutrition');
  progress = showDiscoveryQuestion(progress, recipe.id);
  const first = answerDiscoveryQuestion(progress, recipe.id, config.questions[0].correctOptionId);
  assert.equal(first.coinDelta, 0);
  progress = collectCurrentIngredient(showIngredientCollection(first.progress, recipe.id), recipe.id);
  assert.ok(!progress.discoveredIngredientIds.includes('apple'));
  assert.equal(progress.journeys[recipe.id]!.discovery.questionIndex, 1);
  const wrong = answerDiscoveryQuestion(progress, recipe.id, 'ander-verband');
  assert.equal(wrong.coinDelta, 0);
  assert.equal(wrong.correct, false);
  const final = answerDiscoveryQuestion(wrong.progress, recipe.id, config.questions[1].correctOptionId);
  assert.equal(final.coinDelta, 2);
  assert.equal(answerDiscoveryQuestion(final.progress, recipe.id, config.questions[1].correctOptionId).coinDelta, 0);
  progress = collectCurrentIngredient(showIngredientCollection(final.progress, recipe.id), recipe.id);
  assert.ok(progress.discoveredIngredientIds.includes('apple'));
});

for (const recipe of GEZONDE_RECEPTEN) {
  test(`${recipe.name}: volledige reis van ontdekken tot serveren`, () => {
    assert.deepEqual(getRecipeIssues(recipe), [], recipe.id);
    assert.equal(getRecipeAccess(recipe).playable, true);
    assert.ok(recipe.preparation!.steps.length >= 12);
    for (const path of getRecipeAssetPaths(recipe)) assert.ok(existsSync(`public${path.split('?')[0]}`), path);
    let progress = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
    for (const ingredient of recipe.ingredients) {
      const config = INGREDIENT_DISCOVERIES_BY_ID[ingredient.ingredientId];
      assert.ok(config, ingredient.ingredientId);
      for (const question of config.questions) {
        progress = showDiscoveryQuestion(progress, recipe.id);
        const result = answerDiscoveryQuestion(progress, recipe.id, question.correctOptionId);
        assert.equal(result.correct, true);
        progress = result.progress;
        progress = showIngredientCollection(progress, recipe.id);
        progress = collectCurrentIngredient(progress, recipe.id);
      }
    }
    progress = advanceJourney(progress, recipe.id, 'nutrient-memory');
    assert.equal(progress.journeys[recipe.id]!.stage, 'nutrient-memory');
    progress = completeNutrientMemory(progress, recipe.id, recipe.education!.nutrientMemory!.activityId);
    progress = startMathChallenges(progress, recipe.id);
    for (const challenge of recipe.education!.math) {
      const answer = challenge.type === 'interactive-weighing' ? challenge.targetGrams : challenge.type === 'recipe-scaling' ? Object.fromEntries(challenge.quantities.map(item => [item.ingredientId, item.target])) : challenge.type === 'quantity-selection' ? challenge.correctQuantity : challenge.actions.map(item => item.id);
      const result = submitMathChallenge(progress, recipe.id, answer);
      assert.equal(result.correct, true, challenge.id);
      progress = continueMathChallenges(result.progress, recipe.id).progress;
    }
    progress = advanceJourney(progress, recipe.id, 'shopping');
    assert.equal(progress.journeys[recipe.id]!.stage, 'shopping');
    let basket = createShoppingSession('recipe', recipe.id);
    for (const item of recipe.ingredients) {
      const product = SHOP_PRODUCTS_BY_ID[item.ingredientId];
      assert.equal(product.unit, item.unit);
      basket = adjustBasket(basket, product.id, Math.ceil(item.amount / product.unitAmount));
    }
    const checkout = checkoutBasket(progress, basket, 10000);
    assert.equal(checkout.status, 'success');
    const stock = { ...checkout.progress.inventory.consumables };
    progress = advanceJourney(checkout.progress, recipe.id, 'cooking');
    progress = beginCookingAttempt(progress, recipe);
    let session = progress.preparationSessions[recipe.id];
    for (const step of recipe.preparation!.steps) {
      assert.equal(session.stepId, step.id);
      const state = emptyStepState();
      if (step.mechanic === 'collect') state.selectedTools = step.tools.map(tool => tool.id);
      if (['repeat', 'drag', 'heat', 'oven'].includes(step.mechanic)) state.count = step.target;
      if (step.mechanic === 'weigh' || step.mechanic === 'measure') state.quantity = step.target;
      if (step.mechanic === 'heat') state.heat = step.target;
      if (step.mechanic === 'timed') { state.phase = 'flip'; state.readyAt = 0; }
      if (step.mechanic === 'oven') {
        let oven = session.oven!;
        if (step.action === 'preheat') { oven = { ...oven, powered: true, temperature: step.oven.targetTemperature, status: 'preheating' }; for (let i = 0; i < 10; i++) oven = tickOven(oven, step.oven, 1); }
        if (step.action === 'bake') { oven = { ...oven, trayPlaced: true, doorOpen: false, chosenMinutes: step.oven.minimumMinutes, status: 'baking' }; for (let i = 0; i < 30; i++) oven = tickOven(oven, step.oven, 1); assert.equal(oven.result, 'good'); }
        if (step.action === 'cool') { oven = { ...oven, trayPlaced: false, powered: false, doorOpen: true, status: 'cooling' }; for (let i = 0; i < 6; i++) oven = tickOven(oven, step.oven, 1); assert.equal(oven.status, 'served'); }
        session = { ...session, oven };
      }
      session = advancePreparation(updateCookingStep(session, state), recipe);
      session = migrateCookingSession(JSON.parse(JSON.stringify(session)), recipe);
    }
    const result = completeCookingAttempt(progress, recipe, session);
    assert.equal(result.ok, true, result.message ?? '');
    assert.equal(result.progress.journeys[recipe.id]!.stage, 'complete');
    for (const ingredient of recipe.ingredients) assert.equal(result.progress.inventory.consumables[ingredient.ingredientId] ?? 0, stock[ingredient.ingredientId] - ingredient.amount);
    const again = completeCookingAttempt(result.progress, recipe, result.progress.preparationSessions[recipe.id]);
    assert.deepEqual(again.progress.inventory, result.progress.inventory, 'opnieuw afronden verbruikt geen extra voorraad');
  });
}

test('volkoren uitleg blijft beschikbaar in de download en als Coco-tip', () => {
  const pasta = GEZONDE_RECEPTEN.find(item => item.id === 'wholewheat-vegetable-pasta')!;
  const html = renderToStaticMarkup(<HomeRecipeContent recipe={pasta} />);
  assert.ok(html.includes('meer vezels dan witte pasta'));
  assert.ok(pasta.cookingTips!.some(tip => tip.text.includes('meer vezels dan witte pasta')));
  assert.ok(!html.includes('Voedingscentrum'));
  assert.ok(!html.includes('target="_blank"'));
});

test('koken toont een hele pan zonder de pannenkoeklaag', () => {
  const omelet = GEZONDE_RECEPTEN.find(item => item.id === 'vegetable-omelette')!;
  const step = omelet.preparation!.steps.find(item => item.id === 'cook')!;
  const html = renderToStaticMarkup(<CookingInteraction step={step} state={{ ...emptyStepState(), phase: 'wait', readyAt: 0 }} onChange={() => {}} onComplete={() => {}} onMiss={() => {}} />);
  assert.ok(html.includes('omelette-raw.webp'));
  assert.ok(!html.includes('cooking-baking__pancake'));
});

test('verwarmen toont eerst het ingrediënt en hervat daarna de bewaarde warmtestand', () => {
  const recipe = GEZONDE_RECEPTEN.find(item => item.id === 'wholewheat-vegetable-pasta')!;
  const step = recipe.preparation!.steps.find(item => item.id === 'heat')!;
  const props = { step, onChange: () => {}, onComplete: () => {}, onMiss: () => {} };
  const before = renderToStaticMarkup(<CookingInteraction {...props} state={emptyStepState()} />);
  assert.ok(before.includes('Pan verplaatsen'));
  assert.ok(before.includes('Zet de pan op een kookzone'));
  assert.ok(!before.includes('Afgemeten olie naar pan'));
  assert.ok(!before.includes('role="slider"'), 'één handeling tegelijk: nog geen warmteknop');
  let session = beginCookingAttempt({ ...startJourney(createEmptyCookingProgress(), recipe) }, recipe).preparationSessions[recipe.id];
  session = { ...session, stepId: step.id, completedStepIds: recipe.preparation!.steps.slice(0, recipe.preparation!.steps.indexOf(step)).map(item => item.id), steps: { [step.id]: { ...emptyStepState(), count: 1, heat: 2, cooktopZone: 'medium' } } };
  const restored = migrateCookingSession(JSON.parse(JSON.stringify(session)), recipe);
  assert.equal(restored.steps[step.id].cooktopZone, 'medium');
  const after = renderToStaticMarkup(<CookingInteraction {...props} state={restored.steps[step.id]} />);
  assert.ok(after.includes('aria-valuetext="Middel"'));
  assert.ok(!after.includes('Afgemeten olie naar pan'), 'olie wordt na hervatten niet opnieuw gevraagd');
  assert.ok(!after.includes('disabled=""'), 'de bewaarde juiste stand kan direct worden aangezet');
});


test('panbodem en kookzone delen exact dezelfde positie in de scène', () => {
  for (const zones of [COOKTOP_ZONES, COMPACT_COOKTOP_ZONES]) {
    for (const zone of zones) {
      const frame = cooktopPanFrame('/assets/library/cooking/kit/pan-empty.webp', zone, zones === COMPACT_COOKTOP_ZONES ? 280 : 400);
      assert.ok(Math.abs(frame.x + frame.width * 130 / 420 - zone.x) < .001);
      assert.ok(Math.abs(frame.y + frame.height / 2 - zone.y) < .001);
      assert.equal(nearestCooktopZone(zone, zones), zone.id);
    }
  }
  assert.equal(nearestCooktopZone({ x: 610, y: 480 }), undefined, 'een pan naast de zones klikt niet vast');
});


test('paprika en tomaat gaan als stukjes de pan in en roeren toont een gevulde pan', () => {
  const pasta = GEZONDE_RECEPTEN.find(item => item.id === 'wholewheat-vegetable-pasta')!;
  for (const id of ['add-pepper', 'add-tomato']) {
    const step = pasta.preparation!.steps.find(item => item.id === id)!;
    const html = renderToStaticMarkup(<CookingInteraction step={step} state={emptyStepState()} onChange={() => {}} onComplete={() => {}} onMiss={() => {}} />);
    assert.ok(html.includes('vegetable-pieces'));
    assert.ok(!html.includes('/games/shop/products/pepper.webp'));
    assert.ok(!html.includes('/games/shop/products/tomato.webp'));
  }
  const step = pasta.preparation!.steps.find(item => item.id === 'fry')!;
  const html = renderToStaticMarkup(<CookingInteraction step={step} state={emptyStepState()} onChange={() => {}} onComplete={() => {}} onMiss={() => {}} />);
  assert.ok(html.includes('vegetable-pieces--pepper'));
  assert.ok(html.includes('Roer de stukjes in de pan'));
  assert.ok(!html.includes('cooking-tap__tool'));
});

test('alle tijdstappen gebruiken dezelfde moderne kookplaat en behouden hun timer', () => {
  for (const recipe of RECIPES) {
    for (const step of recipe.preparation?.steps ?? []) {
      if (step.mechanic !== 'timed') continue;
      const html = renderToStaticMarkup(<CookingInteraction step={step} state={{...emptyStepState(),phase:'wait',readyAt:Date.now()+step.durationMs}} onChange={() => {}} onComplete={() => {}} onMiss={() => {}} />);
      assert.ok(html.includes('cooktop-canvas'), recipe.id);
      assert.ok(html.includes('aria-label="Kooktijd"'));
      assert.ok(!html.includes('cooking-baking__pan'));
    }
  }
});

test('seizoensrecepten zijn leesbaar en downloadbaar zonder kookspel of bestelkeuze', async () => {
  const { SEIZOENSRECEPTEN, inSeizoen } = await import('../data/cooking/seasonalRecipes');
  const { keuzeRecepten } = await import('../services/bakeryOrders');
  const keuzes = keuzeRecepten(createEmptyCookingProgress());
  for (const recipe of SEIZOENSRECEPTEN) {
    assert.deepEqual(getRecipeIssues(recipe), [], recipe.id);
    assert.equal(getRecipeAccess(recipe).playable, false);
    assert.equal(getRecipeAccess(recipe).status, 'Voor thuis');
    assert.ok(!keuzes.some(item => item.id === recipe.id));
    assert.ok(existsSync(`public/recipes/${recipe.id}.html`));
    const html = renderToStaticMarkup(<HomeRecipeContent recipe={recipe} />);
    for (const ingredient of recipe.homeRecipe!.ingredients!) assert.ok(html.includes(ingredient));
    assert.ok(html.includes('Met het seizoen mee'));
    assert.ok(inSeizoen(recipe, 11));
    assert.ok(!inSeizoen(recipe, 7));
  }
});

test('appel snijden toont voortgang en bewaart de blokjes bij het toevoegen', () => {
  const recipe = RECIPES.find(recipe => recipe.id === 'apple-oat-bake')!;
  const step = recipe.preparation!.steps.find(step => step.id === 'chop')!;
  assert.equal(step.mechanic, 'repeat');
  for (const [count, label] of ['Hele appel', 'Appel in helften', 'Appelpartjes', 'Appelblokjes'].entries()) {
    const html = renderToStaticMarkup(<CookingInteraction step={step} state={{ ...emptyStepState(), count }} onChange={() => {}} onComplete={() => {}} onMiss={() => {}} />);
    assert.match(html, new RegExp(`aria-label="${label}"`));
    assert.equal(html.includes('Appelblokjes klaar'), count === 3);
  }
  const add = recipe.preparation!.steps.find(step => step.id === 'add-apple')!;
  const html = renderToStaticMarkup(<CookingInteraction step={add} state={emptyStepState()} onChange={() => {}} onComplete={() => {}} onMiss={() => {}} />);
  assert.match(html, /aria-label="Appelblokjes"/);
  assert.doesNotMatch(html, /src="\/games\/shop\/products\/apple.webp"/);
});
