import React from 'react';
import { Armchair, ShoppingBasket, Sprout } from 'lucide-react';
import type { DecorStoreId } from '../../data/decorCatalog';

interface ShopStreetProps {
  onOpenGroceries: () => void;
  onOpenDecor: (store: DecorStoreId) => void;
}

export default function ShopStreet({ onOpenGroceries, onOpenDecor }: ShopStreetProps) {
  return <main className="shop-street" aria-labelledby="shop-street-title">
    <img className="shop-street__background" src="/games/shop/shop-street.png" alt="Een winkelplein met een supermarkt, meubelwinkel en plantenwinkel" />
    <h1 id="shop-street-title" className="treehouse-room__title">Kies een winkel</h1>
    <nav className="shop-street__stores" aria-label="Winkels">
      <button className="shop-street__store shop-street__store--groceries" type="button" onClick={onOpenGroceries} aria-label="Supermarkt openen"><ShoppingBasket /><span>Supermarkt</span></button>
      <button className="shop-street__store shop-street__store--furniture" type="button" onClick={() => onOpenDecor('furniture')} aria-label="Meubelwinkel openen"><Armchair /><span>Meubelwinkel</span></button>
      <button className="shop-street__store shop-street__store--plants" type="button" onClick={() => onOpenDecor('plants')} aria-label="Plantenwinkel openen"><Sprout /><span>Plantenwinkel</span></button>
    </nav>
  </main>;
}

