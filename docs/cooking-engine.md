# Cooking Engine

## Scope and Changed Files

The existing banana artwork, CSS and kitchen remain in use. Fruit yogurt is the first additional production recipe, configured in `data/cooking/fruitYogurt.ts` without recipe-specific components.

- `data/cooking/preparation.ts`, `session.ts`: typed interactions, stable step IDs, attempt state and completion conditions.
- `data/cooking/quantities.ts`, `validation.ts`, `availability.ts`: canonical units, content and asset readiness.
- `data/cooking/catalog.ts`, `types.ts`, `bananaPancakeCooking.ts`: recipe configuration and banana preparation data.
- `components/cooking/CookingExperience.tsx`, `CookingInteraction.tsx`: generic orchestration replacing `BananaPancakeExperience.tsx`.
- `components/cooking/DragToTarget.tsx`, `KitchenScale.tsx`: safe delayed callbacks and configurable measurement units.
- `components/cooking/IngredientDiscoveryFlow.tsx`, `IngredientDiscoveryCard.tsx`, `MathChallengeFlow.tsx`: safe saves, configurable education and missing-content fallbacks; affected TypeScript error fixed.
- `services/localState.ts`, `currency.ts`: one wallet and transaction ledger with atomic related document writes.
- `services/cookingProgress.ts`, `cookingSession.ts`, `recipeInventory.ts`, `shopping.ts`: migration, validation, completion, stock and rewards.
- `pages/CookbookScreen.tsx`, `ShopScreen.tsx`, `TreehouseInterior.tsx`, `components/treehouse/InteractiveKitchen.tsx`: active recipe integration and resumption.
- `services/roomInventory.ts`, `components/shop/DecorShop.tsx`, `components/treehouse/RoomInventoryDrawer.tsx`: separate decoration document, atomic purchases and update subscriptions.
- `App.tsx`, `components/Game.tsx`, `games/red-baby-lua/RedBabyLuaGame.tsx`, `games/red-baby-lua/game/systems/storage.ts`: wallet delta writes and balance subscriptions only; unrelated game visuals unchanged.
- `tests/cookingEngine.test.tsx`, `cookingJourney.test.tsx`, `index.test.ts`, `tsconfig.json`: regression coverage and asset manifest import.

## Completion and Consumption Policy

Stock uses pieces, grams or milliliters, matching shop package units. Kilograms and liters normalize to grams and milliliters. Pieces never convert to mass or volume.

Each attempt has a unique ID, stable step IDs and saved interaction state. Transfers, repeated taps (including cracking and mixing), weighing, heating, timed cooking, flipping and finishing choices are configurable. Timers save an absolute ready time and resume after reload.

Ingredients are deducted only when every preparation step is satisfied and the attempt completes. Validate all stock first; insufficient stock changes nothing. Completion, inventory and the first recipe reward are committed in one localStorage write. Replay starts a new attempt, preserves achievements and requires fresh ingredients. Completion rewards are once per recipe, not once per attempt. Banana completion awards 10 CocoCoins. Previously recorded completions are not retroactively rewarded.

## Persistence and Migration

The existing `cocokiki:currency:v1` key now stores a version-2 envelope containing balance, applied transactions and separately named document snapshots. This is the same wallet, not a second one. The numeric legacy balance and old reward/spending ledger are imported on read and persisted at the next successful write. Legacy progress and decoration keys remain as read-only migration sources; they are not deleted.

Cooking progress and room decoration inventory remain different documents and services. A purchase commits ownership and its wallet debit together. No gameplay module replaces a cached absolute balance.

Legacy banana sessions migrate by step index into stable IDs. Already consumed legacy ingredients receive credit for that attempt, preventing a second deduction. Broken legacy session JSON does not discard valid inventory. Existing unknown ingredient balances are preserved; units are never guessed. The pending yogurt definition now requires strawberry grams rather than comparing package grams to pieces.

Cooking revisions reject stale snapshots. Duplicate transaction IDs cannot pay or charge twice, or overwrite ownership with stale checkout data. Existing paid rewards retain their original amount even if future reward configuration changes. A failed storage write keeps the old wallet and documents intact and presents retry feedback.

Limitation: localStorage offers no cross-tab compare-and-swap. Sequential stale saves are rejected, but truly simultaneous writes from different tabs are not fully serialized. Use one active gameplay tab. A future multi-tab requirement should add a serialized browser lock/transaction coordinator rather than claiming database-level concurrency.

The shared ledger is retained indefinitely for idempotency; browser storage capacity remains a local-only application limit. Changing the envelope requires updating any external scripts that directly read the old numeric wallet key. Use service APIs instead.

## Add the Next Recipe

1. Add or reuse ingredient and equipment records in `data/cooking/catalog.ts`. Add each purchasable ingredient to `data/shopCatalog.ts` with package quantity, canonical unit and price.
2. Supply complete ingredient education in `data/cooking/discovery.ts`, including answer options and valid correct-option IDs. Ingredient discovery rewards are shared by ingredient across recipes.
3. Add educational challenge data using the existing quantity-selection, recipe-scaling, interactive-weighing or sequence-ordering union. Put it in the recipe's `education.math`; the legacy recipe-to-math map is compatibility data, not the runtime source.
4. Define a `PreparationConfig` with a positive version, `consumption: 'on-completion'`, finished artwork and ordered steps. Give every step a unique permanent ID. Choose `collect`, `drag`, `repeat`, `weigh`, `heat`, `timed` or `optional`; configure assets, targets, labels and mechanics-specific fields. Egg cracking and mixing are repeat steps with different imagery and tap counts. Timed steps include the flip action.
5. Add the `RecipeConfig` to the catalog with ingredient quantities, equipment IDs, education, preparation, unlock threshold and modest first-completion reward. No new recipe-specific React component or RecipeId union edit is needed.
6. Put artwork under `public/assets/library`, then run `npm run assets:inventory`. Verify `getRecipeIssues(recipe)` returns no issues before setting `contentStatus: 'ready'`. Missing or unsupported content must remain pending.
7. Add tests for recipe readiness, quantity/package compatibility, all completion conditions, insufficient stock, replay, reload, first reward and another active recipe. The synthetic second recipe in `tests/cookingEngine.test.tsx` demonstrates reuse without publishing another recipe.
8. Run `npm test`, `npx tsc --noEmit`, `npm run build`, then play the complete journey on mobile and desktop.

Keep live step IDs stable. Reordering retains state; newly added IDs become incomplete. Breaking semantic changes to an existing step need a deliberate migration, not just a version bump.

## Fruit Yogurt Integration

`fruit-yogurt` unlocks after one distinct completed recipe. One serving requires 150 ml yogurt, 75 g strawberries and one whole banana. It uses three transfers, five mixing taps and a serve transfer; all are existing mechanics. Four existing education types cover 150 ml, weighing 75 g, doubling to 300 ml and ordering the actions. Quantity selection now optionally configures `step` and `unit`, retaining the old defaults for banana pancakes.

Supplied RGBA PNGs are copied unchanged into `public/assets/library/cooking/fruit-yogurt`: banana slices 1333x1180, strawberries 1347x1168 and yogurt bowl 1309x1201. The existing `public/games/cooking/fruit-yogurt.png` (1536x1024) already depicts yogurt, strawberries and banana and is reused for serving/completion. The existing wooden spoon is reused; no image generation or new gesture was needed. The supplied fruit is already sliced; there is no cutting interaction.

Yogurt shop packages are now 500 ml at the existing 10-CocoCoin price. Strawberries retain 250 g and their seasonal pricing, and bananas remain pieces. Inventory `quantitySchemaVersion: 2` distinguishes the new milliliter stock. Migration moves old `yogurt` gram balances to `yogurt-grams` once and leaves acquisition/checkout history intact. Historical gram stock remains visible in kitchen inventory but does not satisfy milliliter requirements; children need a new ml package for this recipe. No density conversion or new storage key is introduced. New purchases and reloaded stock keep the version marker.

New/updated files: `data/cooking/fruitYogurt.ts`, `catalog.ts`, `discovery.ts`, `mathChallenges.ts` (compatibility export), `types.ts`, `validation.ts`, `data/shopCatalog.ts`, `services/cookingProgress.ts`, `components/cooking/MathChallengeFlow.tsx`, `RecipeOverviewDialog.tsx`, `components/treehouse/InteractiveKitchen.tsx` (quantity labels), the three supplied PNGs and generated asset inventory. Tests are in `tests/fruitYogurt.test.tsx`, with existing catalog/unlock/equipment assertions updated for newly ready content.

Verification: 105 tests pass, including the existing banana regressions; TypeScript and production build pass. The browser journey on the separate localhost origin covered all discovery answers, all four math challenges, checkout, all five preparation steps, native dragging, click transfers, reload/resume and completion at mobile/desktop sizes. Balance: 31 to 41 after new discoveries (known banana paid zero), 71 after education, 28 after shopping, 38 after the first completion. Remaining stock was visibly 350 ml yogurt and 175 g strawberries, with the banana consumed. The cookbook recorded the recipe as made and muffins as pending, while the existing banana attempt remained resumable. Checked 320/375/1280px views; no broken images or document overflow in the checked preparation view. Replay/idempotency and insufficient-stock failures are covered by automated tests; physical touchscreen input was not tested.

There is no blocking artwork gap. An optional future illustration is a top-down blue bowl containing all three combined ingredients for the mixing scene; currently mixing reuses the supplied plain-yogurt bowl and spoon, then serving/completion shows the existing finished dish. The final artwork includes a decorative grain topping; it is not a fourth inventory requirement. No cutting interaction is implied: the fruit starts washed and sliced.

## Remaining Boundaries

- Current interactions cover the banana and yogurt mechanics, not every possible cooking action. Cutting, oven controls or new gestures require a new shared mechanic with tests, not a recipe-name conditional.
- Educational weighing remains gram-based; preparation weighing supports grams and milliliters.
- Decorative kitchen item placement is not yet the source of preparation scene state. The existing room placement and the recipe attempt remain separate.
- Text remains Dutch recipe data. Future localization can replace text fields through a locale catalog without moving instructions into interaction components.
- Asset readiness checks the generated manifest; deployment must ship its referenced files. Tests also verify banana paths exist on disk.
- Legacy recipe `actions`, `challenges` and shopping metadata remain for compatibility; real readiness comes from supported preparation, education, quantities and assets.

## Educational Foundation Upgrade

### Journey and Migration

The sequence is now recipe -> discovery -> `nutrient-memory` -> math -> shopping -> preparation -> completion. `activeRecipeId` only selects the current recipe; it is not the list of unfinished journeys. Every recipe's stage and preparation session remain independent. The kitchen lists every active cooking-stage recipe, and the cookbook has a Bereiden filter and explicit ready-for-cooking badges. Selecting one never restarts another.

Each journey can store `nutrientMemory: { activityId, status }` with pending/completed/skipped status. A full recipe restart resets memory to pending, including previously completed recipes, but retains reward claims. Previously saved journeys already at math, shopping, preparation or completion are grandfathered as skipped, without changing their stage or stock. The overview's extra options allow voluntary memory practice in a transient copy; practicing cannot write progress, spend stock or award money. Memory has no additional coin reward, and existing cooking reward amounts are unchanged.

Interrupted required memory restarts only its deck, not earlier completed journey stages. Only activity completion is persisted. The existing cooking progress document and atomic wallet envelope are reused; no new localStorage key, inventory or wallet exists. Failed saves show a retry and never commit partial progress. Discovery answer positions are seeded by the saved journey start and rotated across questions; they stay stable during a question and reload while answer checking still uses option IDs.

### Nutrient Library and Configuration

`data/cooking/nutrients.ts` owns eight reusable definitions with ID, name, short description, biological function, multiple food examples, difficulty and optional icon path. Recipes reference IDs, never copy definitions. Food can reference multiple nutrient IDs; encyclopedia entries also reuse this central library. Memory matches nutrient to biological function, not a food to one health benefit.

Example recipe education (keep the existing math property):

```ts
education: {
  math: existingChallenges,
  nutrientMemory: {
    enabled: true,
    activityId: 'recipe-nutrients-v1',
    nutrientIds: ['calcium', 'protein', 'vitamin-c', 'fiber'],
    pairCount: 4,
  },
}
```

Supported pair counts are 3, 4 and 6, defaulting to four. Supply enough distinct, known IDs. Deck creation, matches, mismatch reset and completion live in the independent `nutrientMemory.ts` model. Function cards omit the leading nutrient name so matching requires reading the function, rather than spotting the same word twice. The central library keeps the complete sentence. The React component uses large native buttons (pointer, touch-compatible clicks and keyboard), readable text, reduced-motion CSS and delayed mismatch reset. Card positions shuffle each new memory activity. Optional missing nutrient icons are hidden, not mandatory readiness failures. Recipe preparation and finished artwork remain subject to existing mandatory validation. Invalid activity IDs, unknown/duplicate nutrients, insufficient content, unsupported counts or bad tip references return actionable validation codes; development logs identify broken ready recipes, and rendering preserves saves instead of attempting broken content.

### Coco Tips

Recipes declare `cookingTips`, with unique ID, title, text, `character: 'coco'`, and either a valid `triggerStepId` (shown after that step completes) or `displayMode: 'completion'`. The default mode is contextual. Banana's soft-pancake tip follows `cook`; yogurt's pure-fruit tip follows `mix-fruit`. The supplied Coco chef illustration is reused unchanged. Follow `docs/food-philosophy.md` when writing tips.

The generic preparation controller presents a dismissible native modal `CookingTipCard` after a safe completed interaction, with a blurred backdrop and keyboard focus containment. Continue, close or Escape dismiss it. It does not interrupt an active transfer and suppresses tips while a timed wait is active. `seenTipIds` and `dismissedTipIds` are stored on the attempt, so reload never automatically repeats the tip, and a new attempt can show it again. Tip-only saves explicitly disable reward reconciliation and never alter consumables. The weigher currently displays only the amount, not ingredient artwork, to avoid clipped source images. Heating and frying scenes use a quiet neutral surface instead of stacking controls over the illustrated hob.

Example:

```ts
cookingTips: [{
  id: 'serve-warm', character: 'coco', triggerStepId: 'cook',
  title: 'Warm serveren', text: 'Dek de stapel kort af met een tweede bord.',
}],
```

### Home Recipes and Encyclopedia

`homeRecipe` contains introduction, complete real-world steps, safety, serving tip and allergens; quantities, servings and equipment come from the recipe itself. `HomeRecipeContent` renders both the in-game complete recipe and the printable HTML export. Run `npm run recipes:export` after editing recipe content; `prebuild` also runs it automatically. Files are `public/recipes/banana-pancakes.html` and `public/recipes/fruit-yogurt.html`. The files are self-contained, downloadable, printable and can be printed to PDF through the browser. No PDF backend or export dependency is used.

Both Kookboek and Encyclopedie have fixed kitchen controls, reachable while panning. Their back navigation returns to the kitchen. The living room no longer contains the food encyclopedia. Collected ingredient entries include origin, production regions, season, nutrient information and food knowledge. Weighing keeps a stationary ingredient behind a clipped bowl front instead of scaling it over the rim; both learning and preparation share this correction.

### Future Recipes

Add nutrient IDs and pair count under education, retaining math data; give the activity a permanent unique ID. Add tips referencing stable preparation step IDs or the completion mode. Add homeRecipe text and regenerate exports. No recipe-specific component is needed for these features. A new biological activity with different rules belongs outside the preparation engine.

Tests cover both existing recipes, multi-recipe resumption, answer-order balance, all memory difficulties, mismatch/match/completion, mandatory first-time progression, old-save migration, voluntary practice/replay skips, tip triggers/dismiss/reload, unchanged wallet and stock, validation and printable recipe files. Physical touchscreen input is not claimed.

### Original Foundation Verification (Before Tip Redesign)

116 tests pass; `npx tsc --noEmit`, recipe exports and the production build pass. Existing Phaser bundle-size warnings remain. Browser testing used the separate localhost test storage, not the user's 127.0.0.1 progress. Both ready recipes appeared simultaneously in the kitchen. Memory was played to completion with mouse and keyboard, including mismatches and locked third-card selection, without changing the balance. Checked 320px/375px mobile, 768px tablet and 1280px desktop views; the checked memory view had no horizontal document or card-text overflow.

Both the yogurt five-step and pancake eleven-step preparations were replayed to completion. Yogurt's tip appeared after mixing, was dismissed and stayed dismissed after reload. Pancake's tip appeared only after the timed baking step; serving and completion worked while the tip stayed open. The shared weigher showed a stationary ingredient inside the bowl. The balance stayed at 23 after the 15-coin grocery purchase and throughout both previously rewarded recipe replays. First-time memory gating and safe old-save migration are covered by automated tests; the browser memory run was voluntary practice. Physical touchscreen and simultaneous multi-tab writes were not tested.

The preparation queue is not an ingredient reservation system: two recipes may need the same stock. Stock is rechecked on completion, and a recipe with missing ingredients shows the shopping message without partial deductions. This retains the existing consumption policy.

No furniture or plant shop implementation was edited for this upgrade. UI additions are in `components/cooking/foundation.css` rather than the shared shop/world stylesheet. New components are `CookingTipCard`, `NutrientMemory`, `NutrientMemoryFlow` and `HomeRecipe`; knowledge and pure models live in `data/cooking/nutrients.ts`, `nutrientMemory.ts`, `tips.ts` and `discoveryOptions.ts`. Existing cookbook, kitchen, progress, validation and navigation modules integrate them. `scripts/exportHomeRecipes.mjs` shares the React home-recipe renderer; `prebuild` regenerates its printable files automatically. No new dependency was added.

### Tip Redesign and Economy Follow-Up

The later tip redesign replaces the inline tip with the modal described above,
removes scale contents and restores memory on a full recipe restart. The profile
menu now shows only its functional profile action. Inventory drawers expose
confirmed sales via `services/inventorySales.ts`; catalog assets remain untouched.
School clock games reward each completed practice round with an idempotent round
token and keep existing first-level reward IDs. See `docs/food-philosophy.md` for
the amounts and resale rounding policy. New tests cover sale conservation,
failed writes, full restart and first/practice/duplicate clock payouts.

## Verification

Automated coverage includes canonical quantities, incompatible units, all-or-nothing consumption, failed writes, duplicate checkouts, reward configuration changes, legacy migrations, stale revisions, replay, reload and two data-defined recipes. Existing School/clock and other game tests remain in the suite.

Browser checks used `localhost:3002`, separate from the user's `127.0.0.1:3002` storage. Played two complete preparation attempts and the replay discovery/education/shopping route. First purchase: 45 to 33 coins; first completion: 33 to 43. Repeat education paid nothing; second purchase: 43 to 31; second completion stayed at 31. Direct replay showed all ingredients missing, confirming both completed attempts consumed their stock. Reload restored 2/5 mash taps and the cooking timer. Both click-to-transfer and native dragging worked. Verified artwork/layout at 320px, 375px and 1280px; no broken images or horizontal document overflow in the checked views.

Physical touchscreen input and truly simultaneous multi-tab writes were not tested. Browser discovery replay used the existing-known-ingredient skip path; first-time discovery answer/reward paths are covered by automated tests rather than a fresh browser profile run.

TypeScript and production build pass. Vite retains the existing large Phaser/game bundle warning; no dependency was added to address unrelated bundling.
