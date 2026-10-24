import React, { useMemo, useState } from 'react';
import { Armchair, Check, ChevronRight, Minus, Plus, ShoppingBasket, Sprout, Trash2, X } from 'lucide-react';
import { DECOR_CATEGORIES, DECOR_PRODUCTS, DECOR_PRODUCTS_BY_ID, DECOR_STORES, type DecorCategory, type DecorStoreId } from '../../data/decorCatalog';
import { loadCurrency, spendCurrencyOnce } from '../../services/currency';
import { addRoomPurchasesOnce, loadRoomInventory, saveRoomInventory } from '../../services/roomInventory';
import DecorAsset from './DecorAsset';

interface DecorShopProps {
  store: DecorStoreId;
  onBack: () => void;
}

type ActiveCategory = 'all' | DecorCategory;

function createTransactionId(store: DecorStoreId): string {
  return `decor:${store}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export default function DecorShop({ store, onBack }: DecorShopProps) {
  const [category, setCategory] = useState<ActiveCategory>('all');
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [basketOpen, setBasketOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState('');
  const [coins, setCoins] = useState(loadCurrency);
  const definition = DECOR_STORES[store];
  const products = useMemo(() => DECOR_PRODUCTS.filter(product => product.store === store && (category === 'all' || product.category === category)), [category, store]);
  const count = Object.values(basket).reduce<number>((total, amount) => total + Number(amount), 0);
  const total = Object.entries(basket).reduce<number>((sum, [id, amount]) => sum + DECOR_PRODUCTS_BY_ID[id].price * Number(amount), 0);
  const Icon = store === 'furniture' ? Armchair : Sprout;

  const adjust = (id: string, delta: number) => {
    setNotice('');
    setBasket(current => {
      const amount = Math.max(0, Math.min(9, (current[id] ?? 0) + delta));
      const next = { ...current };
      if (amount === 0) delete next[id]; else next[id] = amount;
      return next;
    });
  };

  const checkout = () => {
    if (count === 0) return;
    const transactionId = createTransactionId(store);
    const spend = spendCurrencyOnce(transactionId, total);
    if (spend.status === 'insufficient') {
      setCoins(spend.balance);
      setNotice(`Je komt nog ${total - spend.balance} CocoCoins tekort.`);
      return;
    }
    if (spend.status !== 'applied') {
      setNotice('Afrekenen lukte niet. Probeer het opnieuw.');
      return;
    }
    const nextInventory = addRoomPurchasesOnce(loadRoomInventory(), transactionId, basket);
    if (!saveRoomInventory(nextInventory)) {
      setNotice('Je aankoop kon niet worden opgeslagen.');
      return;
    }
    setCoins(spend.balance);
    setBasket({});
    setBasketOpen(false);
    setSuccess(true);
  };

  return <main className={`shop-room decor-shop decor-shop--${store}`}>
    <img className="shop-room__background" src="/games/shop/shop-street.png" alt="Het gezellige winkelplein" />
    <button className="shop-dismiss" type="button" onClick={onBack} aria-label="Terug naar het winkelplein" />
    <section className="shop-catalog decor-shop__catalog" aria-labelledby="decor-shop-title">
      <header className="shop-catalog__header">
        <span className="shop-catalog__mark" aria-hidden="true"><Icon size={21} /></span>
        <div><small>{definition.eyebrow}</small><h1 id="decor-shop-title">{definition.label}</h1></div>
        <div className="shop-catalog__actions"><button className="shop-basket-button" type="button" onClick={() => setBasketOpen(true)} aria-label={`Open mandje met ${count} producten`}><ShoppingBasket /><span>{count}</span><strong>{total}</strong></button></div>
      </header>
      <nav className="shop-categories" aria-label={`${definition.label} categorieën`}>
        {DECOR_CATEGORIES[store].map(option => <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}</button>)}
      </nav>
      <div className="shop-products" role="list" aria-live="polite" aria-label={`${products.length} producten`} tabIndex={0}>
        {products.map(product => <article className="shop-product decor-product" role="listitem" key={product.id}>
          <DecorAsset product={product} className="shop-product__art" />
          <strong>{product.name}</strong><small>{store === 'furniture' ? 'Meubel' : 'Plant'}</small>
          <div className="shop-product__buy"><span><i aria-hidden="true">★</i>{product.price}</span><button type="button" onClick={() => adjust(product.id, 1)} aria-label={`Voeg ${product.name} toe`}><Plus /></button></div>
        </article>)}
      </div>
    </section>

    {basketOpen && <div className="shop-drawer-backdrop" onMouseDown={() => setBasketOpen(false)}>
      <aside className="shop-drawer" role="dialog" aria-modal="true" aria-label="Winkelmandje" onMouseDown={event => event.stopPropagation()}>
        <header><div><small>{count} producten</small><h2>Jouw mandje</h2></div><button type="button" onClick={() => setBasketOpen(false)} aria-label="Sluit mandje"><X /></button></header>
        <div className="shop-drawer__items">
          {count === 0 && <p className="shop-empty">Kies iets moois voor je boomhut.</p>}
          {Object.entries(basket).map(([id, amount]) => { const product = DECOR_PRODUCTS_BY_ID[id]; return <div className="shop-basket-row" key={id}>
            <DecorAsset product={product} /><div><strong>{product.name}</strong><small>{store === 'furniture' ? 'Meubel' : 'Plant'}</small></div>
            <div className="shop-quantity"><button type="button" onClick={() => adjust(id, -1)} aria-label={`Minder ${product.name}`}><Minus /></button><span>{amount}</span><button type="button" onClick={() => adjust(id, 1)} aria-label={`Meer ${product.name}`}><Plus /></button></div>
            <b>{Number(amount) * product.price}</b><button className="shop-remove" type="button" onClick={() => adjust(id, -Number(amount))} aria-label={`Verwijder ${product.name}`}><Trash2 /></button>
          </div>; })}
        </div>
        <footer><div><span>Totaal</span><strong>★ {total}</strong></div><div><span>Beschikbaar</span><b>★ {coins}</b></div><div><span>Na aankoop</span><b className={coins - total < 0 ? 'is-low' : ''}>★ {coins - total}</b></div>
          {notice && <p className="shop-notice" role="alert">{notice}</p>}<button className="shop-checkout" type="button" onClick={checkout} disabled={count === 0}>Afrekenen <ChevronRight /></button>
        </footer>
      </aside>
    </div>}

    {success && <div className="shop-success" role="dialog" aria-modal="true" aria-labelledby="decor-success-title"><div><span aria-hidden="true"><Check /></span><h2 id="decor-success-title">Toegevoegd aan je voorraad</h2><p>Je nieuwe {store === 'furniture' ? 'meubels' : 'planten'} vind je via de voorraadknop in iedere kamer.</p><button type="button" onClick={() => setSuccess(false)}>Verder winkelen</button></div></div>}
  </main>;
}

