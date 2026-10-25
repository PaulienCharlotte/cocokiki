import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, BookOpen, ShoppingBasket, X } from 'lucide-react';
import { motion, type PanInfo } from 'framer-motion';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { EQUIPMENT, RECIPES_BY_ID } from '../../data/cooking/catalog';
import { getRecipeIssues } from '../../data/cooking/validation';
import type { CookingProgressState } from '../../data/cooking/types';
import { SHOP_PRODUCTS_BY_ID } from '../../data/shopCatalog';
import CookingExperience from '../cooking/CookingExperience';
import { COOKING_PROGRESS_KEY, loadCookingProgress } from '../../services/cookingProgress';
import { subscribeLocalState } from '../../services/localState';

type StationId = 'worktop' | 'cooktop';
type InventoryTab = 'groceries' | 'equipment';
interface KitchenItem {
  id: string;
  label: string;
  image: string;
  quantityLabel: string;
  kind: 'ingredient' | 'equipment';
}
interface WorktopItem extends KitchenItem {
  x: number;
  y: number;
  station: StationId;
  stationX: number;
  stationY: number;
}
const STATIONS: Record<StationId, { label: string; image: string }> = {
  worktop: { label: 'Werkblad', image: ASSET_LIBRARY.treehouse.stations.worktop },
  cooktop: { label: 'Kookplaat', image: ASSET_LIBRARY.treehouse.stations.cooktop },
};

export function buildKitchenInventory(progress: CookingProgressState, tab: InventoryTab): KitchenItem[] {
  if (tab === 'equipment') return EQUIPMENT.filter(item => item.contentStatus === 'ready').map(item => ({
    id: item.id, label: item.name, image: item.image, quantityLabel: 'Altijd aanwezig', kind: 'equipment',
  }));
  return Object.entries(progress.inventory.consumables)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({ product: SHOP_PRODUCTS_BY_ID[id], amount }))
    .filter(({ product }) => Boolean(product))
    .map(({ product, amount }) => ({ id: product.id, label: product.name, image: product.image, quantityLabel: `${amount} in voorraad`, kind: 'ingredient' }));
}

export default function InteractiveKitchen({ progress, sceneRef, onNavigate }: { progress: CookingProgressState; sceneRef: RefObject<HTMLDivElement | null>; onNavigate?: (path: string) => void }) {
  const stationCanvasRef = useRef<HTMLDivElement>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [tab, setTab] = useState<InventoryTab>('groceries');
  const [activeStation, setActiveStation] = useState<StationId | null>(null);
  const [worktopItems, setWorktopItems] = useState<WorktopItem[]>([]);
  const [cookingProgress, setCookingProgress] = useState(progress);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  useEffect(() => subscribeLocalState(() => setCookingProgress(loadCookingProgress()), COOKING_PROGRESS_KEY), []);
  const activeJourney = cookingProgress.activeRecipeId ? cookingProgress.journeys[cookingProgress.activeRecipeId] : undefined;
  const recipe = cookingProgress.activeRecipeId ? RECIPES_BY_ID[cookingProgress.activeRecipeId] : undefined;
  const openRecipe = openRecipeId ? RECIPES_BY_ID[openRecipeId] : undefined;
  const canCook = recipe && getRecipeIssues(recipe).length === 0 && activeJourney?.stage === 'cooking';
  const inventory = buildKitchenInventory(cookingProgress, tab);

  const placeOnWorktop = useCallback((item: KitchenItem) => {
    setWorktopItems(current => current.some(entry => entry.id === item.id) ? current : [...current, {
      ...item, x: (current.length % 5) * 58, y: Math.floor(current.length / 5) * 52,
      station: 'worktop', stationX: 28 + (current.length % 4) * 15, stationY: 38 + Math.floor(current.length / 4) * 16,
    }]);
  }, []);

  const moveWorktopItem = (id: string, info: PanInfo) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const target = (['cooktop', 'worktop'] as StationId[]).find(station => {
      const bounds = scene.querySelector(`[data-kitchen-station="${station}"]`)?.getBoundingClientRect();
      return bounds && info.point.x >= bounds.left && info.point.x <= bounds.right && info.point.y >= bounds.top && info.point.y <= bounds.bottom;
    });
    setWorktopItems(current => current.map(item => item.id === id ? {
      ...item, x: item.x + info.offset.x, y: item.y + info.offset.y, station: target ?? item.station,
      stationX: target === 'cooktop' ? 62 : item.stationX, stationY: target === 'cooktop' ? 50 : item.stationY,
    } : item));
  };

  const moveStationItem = (id: string, info: PanInfo) => {
    const bounds = stationCanvasRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setWorktopItems(current => current.map(item => item.id === id ? {
      ...item, stationX: Math.max(8, Math.min(92, (info.point.x - bounds.left) / bounds.width * 100)),
      stationY: Math.max(12, Math.min(88, (info.point.y - bounds.top) / bounds.height * 100)),
    } : item));
  };

  return <>
    <button className="kitchen-groceries-trigger" type="button" aria-label="Mijn boodschappen openen" title="Boodschappen" aria-expanded={inventoryOpen} aria-controls="kitchen-inventory" onClick={() => setInventoryOpen(true)}>
      <ShoppingBasket aria-hidden="true" />
    </button>
    {canCook && <button type="button" className="treehouse-recipe-cta" onClick={() => setOpenRecipeId(recipe.id)} aria-label={`Verder met ${recipe.name.toLowerCase()}`}>
      <img src={recipe.image} alt="" draggable={false} />
      <span><small>Alles staat klaar</small><strong>{recipe.name}</strong></span>
      <i aria-hidden="true"><BookOpen /></i>
    </button>}
    <div className="kitchen-fixed-stations">
      {(['worktop', 'cooktop'] as StationId[]).map(station => <button key={station} type="button" className={`kitchen-fixed-station kitchen-fixed-station--${station}`} data-kitchen-station={station} aria-label={`${station === 'worktop' ? 'Kookeiland' : 'Kookplaat'} openen`} onClick={() => setActiveStation(station)} />)}
    </div>
    <div className="treehouse-kitchen-worktop" aria-label="Werkblad">
      {worktopItems.map(item => <motion.button key={item.id} type="button" className="treehouse-kitchen-worktop__item" aria-label={`${item.label} verslepen`} title={item.label}
        drag dragConstraints={sceneRef} dragMomentum={false} animate={{ x: item.x, y: item.y }} whileDrag={{ scale: 1.08, cursor: 'grabbing', zIndex: 9 }} onDragEnd={(_, info) => moveWorktopItem(item.id, info)}>
        <img src={item.image} alt="" draggable={false} />
      </motion.button>)}
    </div>
    {inventoryOpen && typeof document !== 'undefined' && createPortal(<div className="room-inventory-backdrop" onMouseDown={() => setInventoryOpen(false)}>
      <aside id="kitchen-inventory" className="room-inventory-drawer kitchen-inventory-drawer" role="dialog" aria-modal="true" aria-labelledby="kitchen-inventory-title" onMouseDown={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') setInventoryOpen(false); }}>
        <header><div><small>Mijn voorraad</small><h2 id="kitchen-inventory-title">Boodschappen</h2></div><button autoFocus type="button" aria-label="Sluiten" onClick={() => setInventoryOpen(false)}><X /></button></header>
        <nav className="recipe-categories" aria-label="Keukenvoorraad"><button type="button" aria-pressed={tab === 'groceries'} onClick={() => setTab('groceries')}>Boodschappen</button><button type="button" aria-pressed={tab === 'equipment'} onClick={() => setTab('equipment')}>Keukengerei</button></nav>
        <div className="treehouse-kitchen-inventory__items">
          {inventory.map(item => <motion.button key={item.id} type="button" className="treehouse-kitchen-inventory__item" drag dragSnapToOrigin dragMomentum={false} whileDrag={{ scale: 1.08, zIndex: 10 }} onDragEnd={() => placeOnWorktop(item)} onClick={() => placeOnWorktop(item)} aria-label={`${item.label} op het werkblad zetten`}>
            <img src={item.image} alt="" draggable={false} /><span><strong>{item.label}</strong><small>{item.quantityLabel}{worktopItems.some(entry => entry.id === item.id) ? ' · Op werkblad' : ''}</small></span>
          </motion.button>)}
          {inventory.length === 0 && <p className="room-inventory-empty">Nog geen boodschappen.</p>}
        </div>
      </aside>
    </div>, document.body)}
    {activeStation && typeof document !== 'undefined' && createPortal(<section className={`treehouse-kitchen-station treehouse-kitchen-station--${activeStation}`} aria-label={`${STATIONS[activeStation].label} bovenaanzicht`}>
      <img className="treehouse-kitchen-station__background" src={STATIONS[activeStation].image} alt="" />
      <header><button type="button" aria-label="Terug naar de keuken" title="Terug naar de keuken" onClick={() => setActiveStation(null)}><ArrowLeft /></button><h2>{STATIONS[activeStation].label}</h2></header>
      <div ref={stationCanvasRef} className="treehouse-kitchen-station__canvas">
        {worktopItems.filter(item => item.station === activeStation).map(item => <motion.button key={item.id} type="button" className={`treehouse-kitchen-station__item treehouse-kitchen-station__item--${item.kind}`} style={{ left: `${item.stationX}%`, top: `${item.stationY}%` }} aria-label={`${item.label} op ${STATIONS[activeStation].label} verslepen`} title={item.label}
          drag dragConstraints={stationCanvasRef} dragMomentum={false} animate={{ x: 0, y: 0 }} transition={{ duration: 0 }} whileDrag={{ scale: 1.08, cursor: 'grabbing', zIndex: 4 }} onDragEnd={(_, info) => moveStationItem(item.id, info)}>
          <img src={item.image} alt="" draggable={false} />
        </motion.button>)}
      </div>
    </section>, document.body)}
    {openRecipe && typeof document !== 'undefined' && createPortal(<CookingExperience recipe={openRecipe} progress={cookingProgress} onProgressChange={setCookingProgress} onClose={() => { setOpenRecipeId(null); setCookingProgress(loadCookingProgress()); }} onShop={() => onNavigate ? onNavigate('/shop') : window.location.assign('/shop')} />, document.body)}
  </>;
}
