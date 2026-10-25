# Cooking Engine

## Scope and Changed Files

The existing banana artwork, CSS and kitchen remain in use. No new recipe is playable yet.

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

## Remaining Boundaries

- Current interactions cover the banana mechanics, not every possible cooking action. Cutting, oven controls or new gestures require a new shared mechanic with tests, not a recipe-name conditional.
- Educational weighing remains gram-based; preparation weighing supports grams and milliliters.
- Decorative kitchen item placement is not yet the source of preparation scene state. The existing room placement and the recipe attempt remain separate.
- Text remains Dutch recipe data. Future localization can replace text fields through a locale catalog without moving instructions into interaction components.
- Asset readiness checks the generated manifest; deployment must ship its referenced files. Tests also verify banana paths exist on disk.
- Legacy recipe `actions`, `challenges` and shopping metadata remain for compatibility; real readiness comes from supported preparation, education, quantities and assets.

## Verification

Automated coverage includes canonical quantities, incompatible units, all-or-nothing consumption, failed writes, duplicate checkouts, reward configuration changes, legacy migrations, stale revisions, replay, reload and two data-defined recipes. Existing School/clock and other game tests remain in the suite.

Browser checks used `localhost:3002`, separate from the user's `127.0.0.1:3002` storage. Played two complete preparation attempts and the replay discovery/education/shopping route. First purchase: 45 to 33 coins; first completion: 33 to 43. Repeat education paid nothing; second purchase: 43 to 31; second completion stayed at 31. Direct replay showed all ingredients missing, confirming both completed attempts consumed their stock. Reload restored 2/5 mash taps and the cooking timer. Both click-to-transfer and native dragging worked. Verified artwork/layout at 320px, 375px and 1280px; no broken images or horizontal document overflow in the checked views.

Physical touchscreen input and truly simultaneous multi-tab writes were not tested. Browser discovery replay used the existing-known-ingredient skip path; first-time discovery answer/reward paths are covered by automated tests rather than a fresh browser profile run.

TypeScript and production build pass. Vite retains the existing large Phaser/game bundle warning; no dependency was added to address unrelated bundling.
