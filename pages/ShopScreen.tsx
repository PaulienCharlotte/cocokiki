import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, ListChecks, Minus, Plus, ShoppingBasket, Trash2, X } from 'lucide-react';
import { INGREDIENTS_BY_ID, RECIPES_BY_ID } from '../data/cooking/catalog';
import type { CookingProgressState, RecipeId } from '../data/cooking/types';
import { SHOP_CATEGORIES, SHOP_PRODUCTS, SHOP_PRODUCTS_BY_ID, type ShopCategory } from '../data/shopCatalog';
import { CURRENCY_CHANGE_EVENT, loadCurrency, spendCurrencyOnce } from '../services/currency';
import { advanceJourney, loadCookingProgress, recipeRequirementsSatisfied, saveCookingProgress } from '../services/cookingProgress';
import { adjustBasket, basketCount, basketTotal, checkoutBasket, createShoppingSession, loadShoppingSession, recipeRequirementStatus, saveShoppingSession, type ShoppingSession } from '../services/shopping';
import type { DecorStoreId } from '../data/decorCatalog';
import ShopStreet from '../components/shop/ShopStreet';
import DecorShop from '../components/shop/DecorShop';

type ActiveCategory = 'all' | ShopCategory;

interface ShopScreenProps {
  recipeId?: RecipeId;
  progress?: CookingProgressState;
  onProgressChange?: (progress: CookingProgressState) => void;
  onExit?: () => void;
  onNavigate?: (path: string) => void;
}

export default function ShopScreen({ recipeId, progress: externalProgress, onProgressChange, onExit, onNavigate }: ShopScreenProps) {
  const mode = recipeId ? 'recipe' : 'free';
  const [activeStore, setActiveStore] = useState<'groceries' | DecorStoreId | null>(recipeId ? 'groceries' : null);
  const [category, setCategory] = useState<ActiveCategory>('all');
  const [session, setSession] = useState<ShoppingSession>(() => loadShoppingSession(mode, recipeId ?? null));
  const [progress, setProgress] = useState<CookingProgressState>(() => externalProgress ?? loadCookingProgress());
  const [coins, setCoins] = useState(loadCurrency);
  const [basketOpen, setBasketOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const products = useMemo(() => category === 'all' ? SHOP_PRODUCTS : SHOP_PRODUCTS.filter(product => product.category === category), [category]);
  const total = basketTotal(session);
  const count = basketCount(session);
  const requirements = recipeId ? recipeRequirementStatus(progress, recipeId, session) : [];
  const completedRequirements = requirements.filter(item => item.collected).length;
  const journeyRecipeId = recipeId ?? progress.activeRecipeId;
  const journey = journeyRecipeId ? progress.journeys[journeyRecipeId] : undefined;
  const journeyReady = !!journeyRecipeId && recipeRequirementsSatisfied(progress, journeyRecipeId);

  useEffect(() => {
    const onCurrency = (event: Event) => setCoins((event as CustomEvent<number>).detail ?? loadCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, onCurrency);
    return () => window.removeEventListener(CURRENCY_CHANGE_EVENT, onCurrency);
  }, []);

  const updateSession = (next: ShoppingSession) => {
    setSession(next);
    saveShoppingSession(next);
    setNotice('');
  };
  const commitProgress = (next: CookingProgressState) => {
    saveCookingProgress(next);
    setProgress(next);
    onProgressChange?.(next);
  };
  const checkout = () => {
    const prepared = checkoutBasket(progress, session, coins);
    if (prepared.status === 'empty') return setNotice('Je mandje is leeg.');
    if (prepared.status === 'insufficient') return setNotice(`Je hebt nog wat CocoCoins nodig! Je komt ${prepared.total - coins} tekort.`);
    if (prepared.status === 'invalid') return setNotice('Dit mandje kan niet worden afgerekend.');
    const spend = spendCurrencyOnce(`shopping:${session.id}`, prepared.total);
    if (spend.status === 'insufficient') return setNotice(`Je hebt nog wat CocoCoins nodig! Je komt ${prepared.total - spend.balance} tekort.`);
    if (spend.status !== 'applied' && spend.status !== 'duplicate') return setNotice('Afrekenen lukte niet. Probeer het opnieuw.');
    const purchased = prepared.status === 'duplicate' ? progress : prepared.progress;
    commitProgress(purchased);
    setCoins(spend.balance);
    setBasketOpen(false);
    setCheckoutComplete(true);
    const nextSession = createShoppingSession(mode, recipeId ?? null);
    saveShoppingSession(nextSession);
    setSession(nextSession);
  };
  const returnToJourney = () => {
    if (!journeyRecipeId || !journey) return;
    const next = journey.stage === 'shopping' && journeyReady
      ? advanceJourney(progress, journeyRecipeId, 'cooking')
      : progress;
    if (next !== progress) commitProgress(next);
    setCheckoutComplete(false);
    if (journeyReady && onNavigate) onNavigate('/treehouse/kitchen');
    else if (!recipeId) {
      if (onNavigate) onNavigate('/treehouse/cookbook?resume=1');
      else window.location.assign('/treehouse/cookbook?resume=1');
    }
  };
  const seasonLabel = session.priceSnapshot.season === 'summer' ? 'In het seizoen' : 'Seizoensproduct';

  if (!activeStore) return <ShopStreet onOpenGroceries={() => setActiveStore('groceries')} onOpenDecor={setActiveStore} />;
  if (activeStore !== 'groceries') return <DecorShop store={activeStore} onBack={() => setActiveStore(null)} />;

  return <main className="shop-room">
    <img className="shop-room__background" src="/games/destinations/shop-interior.png" alt="Een gezellige winkel vol ingrediënten" />
    {!recipeId && <button className="decor-shop__back" type="button" onClick={() => setActiveStore(null)}><ChevronRight className="shop-back-chevron" /> Winkelplein</button>}
    <section className={`shop-catalog${recipeId && recipeRequirementsSatisfied(progress, recipeId) ? ' has-recipe-ready' : ''}`} aria-labelledby="shop-title">
      <header className="shop-catalog__header">
        <span className="shop-catalog__mark" aria-hidden="true"><ShoppingBasket size={20} /></span>
        <div><small>{recipeId ? 'Receptboodschappen' : 'Vrij winkelen'}</small><h1 id="shop-title">Winkel</h1></div>
        <div className="shop-catalog__actions">
          {recipeId && <button className="shop-icon-button" type="button" onClick={() => setListOpen(value => !value)} aria-label="Open boodschappenlijst"><ListChecks /></button>}
          <button className="shop-basket-button" type="button" onClick={() => setBasketOpen(true)} aria-label={`Open mandje met ${count} producten`}><ShoppingBasket /><span>{count}</span><strong>{total}</strong></button>
        </div>
      </header>

      {recipeId && recipeRequirementsSatisfied(progress, recipeId) && <div className="shop-recipe-ready">
        <span><Check /></span><p><strong>Alles in voorraad</strong><small>Je kunt verder met het recept.</small></p>
        <button type="button" onClick={returnToJourney}>Naar keuken <ChevronRight /></button>
      </div>}

      {recipeId && listOpen && <aside className="shopping-list" aria-label="Jouw boodschappenlijstje">
        <header><strong>Jouw boodschappenlijstje</strong><button type="button" onClick={() => setListOpen(false)} aria-label="Sluiten"><X /></button></header>
        <div className="shopping-list__progress"><span style={{ width: `${requirements.length ? completedRequirements / requirements.length * 100 : 0}%` }} /></div>
        {requirements.map(item => <div className={item.collected ? 'is-complete' : ''} key={item.ingredientId}>
          <span>{item.collected ? <Check /> : null}</span><img src={INGREDIENTS_BY_ID[item.ingredientId].image} alt="" />
          <p><strong>{INGREDIENTS_BY_ID[item.ingredientId].name}</strong><small>{item.displayAmount}</small></p>
        </div>)}
      </aside>}

      <nav className="shop-categories" aria-label="Productcategorieën">
        {SHOP_CATEGORIES.map(option => <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}</button>)}
      </nav>
      <div className="shop-products" role="list" aria-live="polite" aria-label={`${products.length} producten`} tabIndex={0}>
        {products.map(item => <article className="shop-product" role="listitem" key={item.id}>
          {item.id === 'strawberry' && <span className="shop-product__badge">{seasonLabel}</span>}
          <img className="shop-product__art" src={item.image} alt="" /><strong>{item.name}</strong><small>{item.packageLabel}</small>
          <div className="shop-product__buy"><span><i aria-hidden="true">★</i>{session.priceSnapshot.prices[item.id]}</span><button type="button" onClick={() => updateSession(adjustBasket(session, item.id, 1))} aria-label={`Voeg ${item.name} toe`}><Plus /></button></div>
        </article>)}
      </div>
    </section>

    {basketOpen && <div className="shop-drawer-backdrop" onMouseDown={() => setBasketOpen(false)}>
      <aside className="shop-drawer" role="dialog" aria-modal="true" aria-label="Winkelmandje" onMouseDown={event => event.stopPropagation()}>
        <header><div><small>{count} producten</small><h2>Jouw mandje</h2></div><button type="button" onClick={() => setBasketOpen(false)} aria-label="Sluit mandje"><X /></button></header>
        <div className="shop-drawer__items">
          {count === 0 && <p className="shop-empty">Kies iets lekkers uit de winkel.</p>}
          {(Object.entries(session.basket) as Array<[string, number]>).map(([id, packages]) => { const item = SHOP_PRODUCTS_BY_ID[id]; return <div className="shop-basket-row" key={id}>
            <img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{item.packageLabel}</small></div>
            <div className="shop-quantity"><button type="button" onClick={() => updateSession(adjustBasket(session, id, -1))} aria-label={`Minder ${item.name}`}><Minus /></button><span>{packages}</span><button type="button" onClick={() => updateSession(adjustBasket(session, id, 1))} aria-label={`Meer ${item.name}`}><Plus /></button></div>
            <b>{packages * session.priceSnapshot.prices[id]}</b><button className="shop-remove" type="button" onClick={() => updateSession(adjustBasket(session, id, -packages))} aria-label={`Verwijder ${item.name}`}><Trash2 /></button>
          </div>; })}
        </div>
        <footer><div><span>Totaal</span><strong>★ {total}</strong></div><div><span>Beschikbaar</span><b>★ {coins}</b></div><div><span>Na aankoop</span><b className={coins - total < 0 ? 'is-low' : ''}>★ {coins - total}</b></div>
          {notice && <p className="shop-notice" role="alert">{notice}</p>}<button className="shop-checkout" type="button" onClick={checkout} disabled={count === 0}>Afrekenen <ChevronRight /></button>
          {notice.includes('tekort') && <a className="shop-earn-link" href="/challenges">Oefen en verdien CocoCoins</a>}
        </footer>
      </aside>
    </div>}

    {checkoutComplete && <div className="shop-success" role="dialog" aria-modal="true" aria-labelledby="shop-success-title"><div><span aria-hidden="true"><Check /></span><h2 id="shop-success-title">Goed gewinkeld!</h2>
      {journeyRecipeId && journey ? <>
        <p>{journeyReady ? `Alles voor ${RECIPES_BY_ID[journeyRecipeId].name} zit in je voorraad.` : 'Je boodschappen staan in je voorraad.'}</p>
        <button type="button" onClick={returnToJourney}>{journeyReady ? 'Ga naar de keuken' : 'Terug naar je recept'} <ChevronRight /></button>
        <button className="shop-success__secondary" type="button" onClick={() => setCheckoutComplete(false)}>Verder winkelen</button>
      </> : <><p>Je boodschappen staan in je voorraad.</p><button type="button" onClick={() => setCheckoutComplete(false)}>Verder winkelen</button></>}
    </div></div>}
    {recipeId && <button className="shop-exit" type="button" onClick={onExit}>Stoppen</button>}
  </main>;
}
