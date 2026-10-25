import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Minus, PackageOpen, PackagePlus, Plus, RotateCcw, RotateCw, X } from 'lucide-react';
import { DECOR_PRODUCTS_BY_ID, type DecorProduct } from '../../data/decorCatalog';
import type { TreehouseRoomId } from '../../data/treehouse';
import { availableRoomQuantity, loadRoomInventory, MAX_PLACEMENT_SCALE, MIN_PLACEMENT_SCALE, moveRoomItem, placeRoomItem, resizeRoomItem, returnRoomItem, ROOM_INVENTORY_CHANGE_EVENT, ROOM_INVENTORY_KEY, saveRoomInventory, turnRoomItem, type RoomInventoryState } from '../../services/roomInventory';
import DecorAsset from '../shop/DecorAsset';
import InventorySellButton from './InventorySellButton';
import { subscribeLocalState } from '../../services/localState';

interface Props {
  room: TreehouseRoomId;
  sceneRef: RefObject<HTMLDivElement | null>;
}
interface DragState {
  product: DecorProduct;
  placementId?: string;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
}


export default function RoomInventoryDrawer({ room, sceneRef }: Props) {
  const [open, setOpen] = useState(false);
  const [inventory, setInventory] = useState<RoomInventoryState>(loadRoomInventory);
  const [selected, setSelected] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ product: DecorProduct; x: number; y: number; returnable: boolean } | null>(null);
  const [overReturn, setOverReturn] = useState(false);
  const [notice, setNotice] = useState('');
  const drag = useRef<DragState | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const products = Object.keys(inventory.owned).map(id => ({ product: DECOR_PRODUCTS_BY_ID[id], amount: availableRoomQuantity(inventory, id) })).filter(item => item.product && item.amount > 0);

  const commit = useCallback((update: (state: RoomInventoryState) => RoomInventoryState) => {
    const current = loadRoomInventory();
    const next = update(current);
    if (next === current) return;
    if (!saveRoomInventory(next)) { setNotice('Opslaan lukte niet. Probeer opnieuw.'); return; }
    setInventory(next);
    setNotice('');
  }, []);

  const coordinates = useCallback((x: number, y: number) => {
    const bounds = sceneRef.current?.getBoundingClientRect();
    return bounds ? { x: (x - bounds.left) / bounds.width * 100, y: (y - bounds.top) / bounds.height * 100 } : null;
  }, [sceneRef]);

  const place = useCallback((product: DecorProduct, x: number, y: number) => {
    const point = coordinates(x, y);
    if (!point) return;
    const id = crypto.randomUUID();
    commit(current => placeRoomItem(current, { id, productId: product.id, room, view: 0, scale: 1, ...point }));
    setSelected(id);
  }, [commit, coordinates, room]);

  const isReturnTarget = useCallback((x: number, y: number) => [triggerRef.current, returnRef.current].some(element => {
    const rect = element?.getBoundingClientRect();
    return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }), []);

  useEffect(() => {
    setInventory(loadRoomInventory());
    setSelected(null);
    setOpen(false);
    drag.current = null;
    setGhost(null);
  }, [room]);

  useEffect(() => {
    const update = (event: Event) => setInventory((event as CustomEvent<RoomInventoryState>).detail ?? loadRoomInventory());
    const unsubscribe = subscribeLocalState(() => setInventory(loadRoomInventory()), ROOM_INVENTORY_KEY);
    const sync = (event: StorageEvent) => { if (event.key === ROOM_INVENTORY_KEY) setInventory(loadRoomInventory()); };
    window.addEventListener(ROOM_INVENTORY_CHANGE_EVENT, update);
    window.addEventListener('storage', sync);
    return () => { unsubscribe(); window.removeEventListener(ROOM_INVENTORY_CHANGE_EVENT, update); window.removeEventListener('storage', sync); };
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [open]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const active = drag.current;
      if (!active || event.pointerId !== active.pointerId) return;
      if (!active.active && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 6) return;
      event.preventDefault();
      if (!active.active) {
        active.active = true;
        sceneRef.current?.setPointerCapture(event.pointerId);
        setOpen(false);
      }
      setGhost({ product: active.product, x: event.clientX, y: event.clientY, returnable: Boolean(active.placementId) });
      setOverReturn(Boolean(active.placementId) && isReturnTarget(event.clientX, event.clientY));
    };
    const end = (event: PointerEvent) => {
      const active = drag.current;
      if (!active || event.pointerId !== active.pointerId) return;
      drag.current = null;
      if (event.type !== 'pointercancel') {
        if (active.placementId) {
          if (active.active && isReturnTarget(event.clientX, event.clientY)) commit(current => returnRoomItem(current, active.placementId!));
          else if (active.active) {
            const point = coordinates(event.clientX, event.clientY);
            if (point) commit(current => moveRoomItem(current, active.placementId!, point.x, point.y));
          }
          setSelected(active.placementId);
        } else {
          const validDrop = event.clientY > 75 && event.clientX >= 0 && event.clientX <= window.innerWidth && event.clientY <= window.innerHeight;
          if (!active.active || validDrop) place(active.product, active.active ? event.clientX : window.innerWidth / 2, active.active ? event.clientY : window.innerHeight * .72);
          setOpen(false);
        }
      }
      if (sceneRef.current?.hasPointerCapture(event.pointerId)) sceneRef.current.releasePointerCapture(event.pointerId);
      setGhost(null);
      setOverReturn(false);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
  }, [commit, coordinates, isReturnTarget, place, sceneRef]);

  const begin = (event: React.PointerEvent<HTMLButtonElement>, product: DecorProduct, placementId?: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current = { product, placementId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false };
    if (placementId) setSelected(placementId);
  };

  const currentPlacements = inventory.placements.filter(item => item.room === room);
  const overlay = <>
    {open && <div className="room-inventory-backdrop room-decor-backdrop" onMouseDown={() => setOpen(false)}>
      <aside className="room-inventory-drawer" role="dialog" aria-modal="true" aria-labelledby="room-inventory-title" onMouseDown={event => event.stopPropagation()}>
        <header><div><small>Mijn spullen</small><h2 id="room-inventory-title">Voorraad</h2></div><button ref={closeRef} type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Sluiten"><X /></button></header>
        {products.length > 0 ? <div className="room-inventory-grid">
          {products.map(({ product, amount }) => <article key={product.id}>
            <button className="room-inventory-place" type="button" aria-label={`${product.name} in kamer plaatsen`} onPointerDown={event => begin(event, product)} onClick={event => { if (event.detail === 0) { place(product, window.innerWidth / 2, window.innerHeight * .72); setOpen(false); } }}><DecorAsset product={product} /></button>
            <strong>{product.name}</strong><small>{amount} beschikbaar</small>
            <InventorySellButton kind="decor" productId={product.id} name={product.name} price={product.price} />
          </article>)}
        </div> : <div className="room-inventory-empty"><PackageOpen /><p>{Object.keys(inventory.owned).length ? 'Alles staat in je boomhut.' : 'Nog geen kameritems.'}</p></div>}
      </aside>
    </div>}
    {ghost && <>
      <div className="room-decor-ghost" style={{ left: ghost.x, top: ghost.y }}><DecorAsset product={ghost.product} /></div>
      {ghost.returnable && <div ref={returnRef} className={`room-return-target${overReturn ? ' is-over' : ''}`}><PackageOpen /><span>Terug in voorraad</span></div>}
    </>}
  </>;

  return <>
    <div className="room-decor-layer" aria-label="Kamerinrichting">
      {currentPlacements.map(item => {
        const product = DECOR_PRODUCTS_BY_ID[item.productId];
        const isSelected = selected === item.id;
        return <div key={item.id} className={`room-placed-object${isSelected ? ' is-selected' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${product.roomWidth * item.scale}%`, zIndex: isSelected ? 110 : product.category === 'rugs' ? 1 : 2 + Math.round(item.y) }}>
          <button type="button" className="room-placed-object__move" aria-label={`${product.name} verplaatsen`} title={product.name} onPointerDown={event => begin(event, product, item.id)} onFocus={() => setSelected(item.id)} onKeyDown={event => {
            if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); commit(current => returnRoomItem(current, item.id)); }
            const delta = event.shiftKey ? 5 : 1;
            const directions: Record<string, [number, number]> = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] };
            if (directions[event.key]) { event.preventDefault(); const [x, y] = directions[event.key]; commit(current => moveRoomItem(current, item.id, item.x + x, item.y + y)); }
          }}><DecorAsset product={product} view={item.view} /></button>

          {isSelected && <div className="room-placed-object__tools" aria-label={`${product.name} aanpassen`}>
            {product.views > 1 && <>
              <button type="button" title="Draai naar links" aria-label={`${product.name} naar links draaien`} onClick={() => commit(current => turnRoomItem(current, item.id, -1))}><RotateCcw /></button>
              <button type="button" title="Draai naar rechts" aria-label={`${product.name} naar rechts draaien`} onClick={() => commit(current => turnRoomItem(current, item.id, 1))}><RotateCw /></button>
            </>}
            <button type="button" title="Kleiner" aria-label={`${product.name} kleiner maken`} disabled={item.scale <= MIN_PLACEMENT_SCALE} onClick={() => commit(current => resizeRoomItem(current, item.id, -1))}><Minus /></button>
            <button type="button" title="Groter" aria-label={`${product.name} groter maken`} disabled={item.scale >= MAX_PLACEMENT_SCALE} onClick={() => commit(current => resizeRoomItem(current, item.id, 1))}><Plus /></button>
            <button type="button" title="Terug in voorraad" aria-label={`${product.name} terug in voorraad`} onClick={() => commit(current => returnRoomItem(current, item.id))}><PackagePlus /></button>
          </div>}
        </div>;
      })}
    </div>
    <button ref={triggerRef} className={`room-inventory-trigger${overReturn ? ' is-drop-target' : ''}`} type="button" onClick={() => setOpen(true)} aria-label="Mijn kameritems openen" title="Voorraad" aria-expanded={open}>
      <PackageOpen aria-hidden="true" /><span>Voorraad</span>
      {products.length > 0 && <b>{products.reduce((total, item) => total + item.amount, 0)}</b>}
    </button>
    {notice && <p className="room-decor-notice" role="alert">{notice}</p>}
    {typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay}
  </>;
}
