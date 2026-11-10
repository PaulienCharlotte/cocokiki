import { RECIPES, RECIPES_BY_ID } from '../data/cooking/catalog';
import { getRecipeAccess } from '../data/cooking/availability';
import { BESTELLINGEN, BESTELLINGEN_BY_ID, type Bestelling } from '../data/cooking/orders';
import type { CookingProgressState, OrderProgress, RecipeConfig, RecipeId } from '../data/cooking/types';

/**
 * De regels rond een bestelling. Alles hier is zuiver rekenwerk op de
 * bestelling en het recept, zodat de schermen niets zelf hoeven uit te zoeken
 * en de tests er los bij kunnen.
 */

/** Past dit recept bij de wens? Zo niet, dan hoort `bestelling.afwijzing` erbij. */
export function pastBijBestelling(bestelling: Bestelling, recipe: RecipeConfig): boolean {
  const eis = bestelling.eis;
  if (eis.soort === 'zonder') return !recipe.ingredients.some(item => eis.ingredientIds.includes(item.ingredientId));
  if (eis.soort === 'categorie') return recipe.category === eis.categorie;
  return recipe.preparationMinutes !== null && recipe.preparationMinutes <= eis.minuten;
}

/** De recepten waaruit een kind mag kiezen: wat het nu kan maken. */
export function keuzeRecepten(progress: CookingProgressState): RecipeConfig[] {
  return RECIPES.filter(recipe => getRecipeAccess(recipe, progress).playable);
}

/**
 * Hoe vaak je moet bakken. Eén keer bakken geeft `servings` porties, en je
 * kunt geen halve keer bakken, dus naar boven afronden.
 */
export function keerBakken(bestelling: Bestelling, recipe: RecipeConfig): number {
  if (!recipe.servings || recipe.servings <= 0) return 1;
  return Math.max(1, Math.ceil(bestelling.eters / recipe.servings));
}

/** De antwoorden bij "hoe vaak moet je bakken?": het goede en twee buren. */
export function keerOpties(bestelling: Bestelling, recipe: RecipeConfig): number[] {
  const goed = keerBakken(bestelling, recipe);
  const opties = new Set<number>([goed, goed + 1, goed > 1 ? goed - 1 : goed + 2]);
  return [...opties].sort((a, b) => a - b);
}

/**
 * De bestellingen die nu aan de toonbank kunnen staan: nog niet afgeleverd, en
 * te maken met een recept dat dit kind al mag. Een wens waar nog geen recept
 * bij hoort zou een kind vastzetten, dus die wacht tot het zover is.
 */
export function openBestellingen(progress: CookingProgressState): Bestelling[] {
  const haalbaar = keuzeRecepten(progress);
  return BESTELLINGEN.filter(bestelling => progress.orders?.[bestelling.id]?.status !== 'geleverd'
    && haalbaar.some(recipe => pastBijBestelling(bestelling, recipe)));
}

/** De bestelling waar je nu mee bezig bent, als die er is. */
export function lopendeBestelling(progress: CookingProgressState): { bestelling: Bestelling; voortgang: OrderProgress } | null {
  const id = progress.activeOrderId;
  const voortgang = id ? progress.orders?.[id] : undefined;
  const bestelling = id ? BESTELLINGEN_BY_ID[id] : undefined;
  if (!id || !voortgang || !bestelling || voortgang.status !== 'bezig') return null;
  return { bestelling, voortgang };
}

/** De bestelling die bij dit recept hoort, zolang je er nog mee bezig bent. */
export function bestellingVoorRecept(progress: CookingProgressState, recipeId: RecipeId): { bestelling: Bestelling; voortgang: OrderProgress } | null {
  const lopend = lopendeBestelling(progress);
  return lopend && lopend.voortgang.recipeId === recipeId ? lopend : null;
}

/** De bestelling aannemen. Je hebt nog geen recept gekozen. */
export function neemBestellingAan(progress: CookingProgressState, bestellingId: string, now = new Date().toISOString()): CookingProgressState {
  const bestelling = BESTELLINGEN_BY_ID[bestellingId];
  if (!bestelling || progress.orders?.[bestellingId]?.status === 'geleverd') return progress;
  const next = structuredClone(progress);
  next.orders = { ...next.orders, [bestellingId]: { bestellingId, recipeId: null, status: 'bezig', misgrepen: 0, aantalInEenKeer: true, keerGekozen: null, aangenomenOp: now } };
  next.activeOrderId = bestellingId;
  return next;
}

/** Een recept gekozen. Een misser wordt geteld, maar kost niets. */
export function kiesReceptVoorBestelling(progress: CookingProgressState, recipeId: RecipeId): CookingProgressState {
  const lopend = lopendeBestelling(progress);
  const recipe = RECIPES_BY_ID[recipeId];
  if (!lopend || !recipe || lopend.voortgang.recipeId) return progress;
  const next = structuredClone(progress);
  const voortgang = next.orders![lopend.bestelling.id]!;
  if (!pastBijBestelling(lopend.bestelling, recipe)) {
    voortgang.misgrepen += 1;
    return next;
  }
  voortgang.recipeId = recipeId;
  return next;
}

/** Het aantal keer bakken beantwoord. Pas bij het goede antwoord ga je verder. */
export function kiesAantalVoorBestelling(progress: CookingProgressState, keer: number): CookingProgressState {
  const lopend = lopendeBestelling(progress);
  const recipeId = lopend?.voortgang.recipeId;
  const recipe = recipeId ? RECIPES_BY_ID[recipeId] : undefined;
  if (!lopend || !recipe || lopend.voortgang.keerGekozen) return progress;
  const next = structuredClone(progress);
  const voortgang = next.orders![lopend.bestelling.id]!;
  if (keer !== keerBakken(lopend.bestelling, recipe)) {
    voortgang.aantalInEenKeer = false;
    return next;
  }
  voortgang.keerGekozen = keer;
  return next;
}

/** Afgeleverd. Levert de bonus op als recept en aantal in één keer goed waren. */
export function leverBestellingAf(progress: CookingProgressState, now = new Date().toISOString()): { progress: CookingProgressState; coinDelta: number; bestelling: Bestelling | null } {
  const lopend = lopendeBestelling(progress);
  if (!lopend || !lopend.voortgang.recipeId) return { progress, coinDelta: 0, bestelling: null };
  const next = structuredClone(progress);
  const voortgang = next.orders![lopend.bestelling.id]!;
  voortgang.status = 'geleverd';
  voortgang.geleverdOp = now;
  next.activeOrderId = null;
  const inEenKeer = voortgang.misgrepen === 0 && voortgang.aantalInEenKeer;
  const coinDelta = inEenKeer ? lopend.bestelling.bonus : 0;
  voortgang.bonusGekregen = coinDelta;
  return { progress: next, coinDelta, bestelling: lopend.bestelling };
}

/** De bestelling laten liggen; hij staat daarna weer aan de toonbank. */
export function legBestellingTerug(progress: CookingProgressState): CookingProgressState {
  const lopend = lopendeBestelling(progress);
  if (!lopend) return progress;
  const next = structuredClone(progress);
  delete next.orders![lopend.bestelling.id];
  next.activeOrderId = null;
  return next;
}
