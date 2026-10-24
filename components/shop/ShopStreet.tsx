import React, { useEffect, useRef, useState } from 'react';
import { Armchair, ChevronLeft, ChevronRight, ShoppingBasket, Sprout } from 'lucide-react';
import type { DecorStoreId } from '../../data/decorCatalog';

interface ShopStreetProps {
  onOpenGroceries: () => void;
  onOpenDecor: (store: DecorStoreId) => void;
}

let streetScroll: number | null = null;

export default function ShopStreet({ onOpenGroceries, onOpenDecor }: ShopStreetProps) {
  const viewport = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: true, right: true });
  const update = () => {
    const element = viewport.current;
    if (!element) return;
    streetScroll = element.scrollLeft;
    const maximum = element.scrollWidth - element.clientWidth;
    setEdges({ left: element.scrollLeft <= 2, right: maximum - element.scrollLeft <= 2 });
  };
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const align = () => { element.scrollLeft = Math.min(streetScroll ?? (element.scrollWidth - element.clientWidth) / 2, element.scrollWidth - element.clientWidth); update(); };
    align();
    window.addEventListener('resize', align);
    return () => window.removeEventListener('resize', align);
  }, []);
  return <main ref={viewport} className="shop-street" aria-labelledby="shop-street-title" onScroll={update}>
    <div className="shop-street__scene">
    <img className="shop-street__background" src="/games/shop/shop-street.png" alt="Een winkelplein met een supermarkt, meubelwinkel en plantenwinkel" />
    <h1 id="shop-street-title" className="treehouse-room__title">Kies een winkel</h1>
    <nav className="shop-street__stores" aria-label="Winkels">
      <button className="shop-street__store shop-street__store--groceries" type="button" onClick={onOpenGroceries} aria-label="Supermarkt openen"><ShoppingBasket /><span>Supermarkt</span></button>
      <button className="shop-street__store shop-street__store--furniture" type="button" onClick={() => onOpenDecor('furniture')} aria-label="Meubelwinkel openen"><Armchair /><span>Meubelwinkel</span></button>
      <button className="shop-street__store shop-street__store--plants" type="button" onClick={() => onOpenDecor('plants')} aria-label="Plantenwinkel openen"><Sprout /><span>Plantenwinkel</span></button>
    </nav>
    </div>
    {!(edges.left && edges.right) && <nav className="shop-street__pan" aria-label="Kijk rond op het winkelplein">
      <button type="button" aria-label="Winkelplein naar links" disabled={edges.left} onClick={() => viewport.current?.scrollBy({ left: -window.innerWidth * .75, behavior: 'smooth' })}><ChevronLeft /></button>
      <button type="button" aria-label="Winkelplein naar rechts" disabled={edges.right} onClick={() => viewport.current?.scrollBy({ left: window.innerWidth * .75, behavior: 'smooth' })}><ChevronRight /></button>
    </nav>}
  </main>;
}

