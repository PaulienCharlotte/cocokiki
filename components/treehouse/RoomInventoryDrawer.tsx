import React, { useEffect, useMemo, useState } from 'react';
import { PackageOpen, X } from 'lucide-react';
import { DECOR_PRODUCTS_BY_ID } from '../../data/decorCatalog';
import { loadRoomInventory, ROOM_INVENTORY_CHANGE_EVENT, type RoomInventoryState } from '../../services/roomInventory';
import DecorAsset from '../shop/DecorAsset';

export default function RoomInventoryDrawer() {
  const [open, setOpen] = useState(false);
  const [inventory, setInventory] = useState<RoomInventoryState>(loadRoomInventory);
  const products = useMemo(() => Object.entries(inventory.owned)
    .map(([id, amount]) => ({ product: DECOR_PRODUCTS_BY_ID[id], amount }))
    .filter(item => Boolean(item.product)), [inventory]);

  useEffect(() => {
    const update = (event: Event) => setInventory((event as CustomEvent<RoomInventoryState>).detail ?? loadRoomInventory());
    window.addEventListener(ROOM_INVENTORY_CHANGE_EVENT, update);
    return () => window.removeEventListener(ROOM_INVENTORY_CHANGE_EVENT, update);
  }, []);

  return <>
    <button className="room-inventory-trigger" type="button" onClick={() => setOpen(true)} aria-label="Mijn kameritems openen">
      <PackageOpen aria-hidden="true" /><span>Voorraad</span>
      {products.length > 0 && <b>{products.reduce((total, item) => total + item.amount, 0)}</b>}
    </button>
    {open && <div className="room-inventory-backdrop" onMouseDown={() => setOpen(false)}>
      <aside className="room-inventory-drawer" role="dialog" aria-modal="true" aria-labelledby="room-inventory-title" onMouseDown={event => event.stopPropagation()}>
        <header><div><small>Mijn spullen</small><h2 id="room-inventory-title">Voorraad</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Sluiten"><X /></button></header>
        {products.length > 0 ? <div className="room-inventory-grid">
          {products.map(({ product, amount }) => <article key={product.id}><DecorAsset product={product} /><strong>{product.name}</strong><small>{amount} beschikbaar</small></article>)}
        </div> : <div className="room-inventory-empty"><PackageOpen /><p>Nog geen kameritems.</p><small>Meubels en planten die je koopt verschijnen hier.</small></div>}
      </aside>
    </div>}
  </>;
}

