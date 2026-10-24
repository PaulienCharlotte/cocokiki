import React, { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, BookOpen, Hand, X } from 'lucide-react';
import { motion, type PanInfo } from 'framer-motion';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { EQUIPMENT } from '../../data/cooking/catalog';
import type { CookingProgressState } from '../../data/cooking/types';
import { SHOP_PRODUCTS_BY_ID } from '../../data/shopCatalog';
import BananaPancakeExperience from '../cooking/BananaPancakeExperience';

type FurnitureId = 'fridge' | 'oven' | 'pantry' | 'island' | 'cart';
type StationId = 'worktop' | 'cooktop';

interface InteractiveKitchenProps {
  progress: CookingProgressState;
  sceneRef: RefObject<HTMLDivElement | null>;
}

interface Offset {
  x: number;
  y: number;
}

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
  station: StationId | null;
  stationX: number;
  stationY: number;
}

/** Sleutel van de oude, versleepbare indeling; wordt alleen nog opgeruimd. */
const LEGACY_LAYOUT_STORAGE_KEY = 'cocokiki:kitchen-layout:v1';

const FURNITURE: Array<{
  id: FurnitureId;
  label: string;
  closedImage: string;
  openImage?: string;
  station?: StationId;
}> = [
  { id: 'fridge', label: 'Koelkast', closedImage: ASSET_LIBRARY.treehouse.furnishings.fridge, openImage: ASSET_LIBRARY.treehouse.furnishings.fridgeOpen },
  { id: 'oven', label: 'Kookplaat', closedImage: ASSET_LIBRARY.treehouse.furnishings.oven, openImage: ASSET_LIBRARY.treehouse.furnishings.ovenOpen, station: 'cooktop' },
  { id: 'pantry', label: 'Voorraadkast', closedImage: ASSET_LIBRARY.treehouse.furnishings.pantry, openImage: ASSET_LIBRARY.treehouse.furnishings.pantryOpen },
  { id: 'island', label: 'Kookeiland', closedImage: ASSET_LIBRARY.treehouse.furnishings.island, station: 'worktop' },
  { id: 'cart', label: 'Keukenkar', closedImage: ASSET_LIBRARY.treehouse.furnishings.cart },
];

const STATIONS: Record<StationId, { label: string; image: string }> = {
  worktop: { label: 'Werkblad', image: ASSET_LIBRARY.treehouse.stations.worktop },
  cooktop: { label: 'Kookplaat', image: ASSET_LIBRARY.treehouse.stations.cooktop },
};

function formatQuantity(amount: number): string {
  return amount === 1 ? '1 in voorraad' : `${amount} in voorraad`;
}

export function buildKitchenInventory(progress: CookingProgressState, furnitureId: FurnitureId): KitchenItem[] {
  if (furnitureId === 'cart') {
    return EQUIPMENT
      .filter(item => item.contentStatus === 'ready')
      .map(item => ({ id: item.id, label: item.name, image: item.image, quantityLabel: 'Altijd aanwezig', kind: 'equipment' }));
  }

  if (furnitureId === 'oven' || furnitureId === 'island') return [];

  return Object.entries(progress.inventory.consumables)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({ product: SHOP_PRODUCTS_BY_ID[id], amount }))
    .filter(({ product }) => Boolean(product))
    .filter(({ product }) => furnitureId === 'pantry'
      ? product.category === 'pantry'
      : product.category !== 'pantry')
    .map(({ product, amount }) => ({
      id: product.id,
      label: product.name,
      image: product.image,
      quantityLabel: formatQuantity(amount),
      kind: 'ingredient' as const,
    }));
}

export default function InteractiveKitchen({ progress, sceneRef }: InteractiveKitchenProps) {
  const stationCanvasRef = useRef<HTMLDivElement>(null);
  const [openFurniture, setOpenFurniture] = useState<FurnitureId | null>(null);
  const [activeStation, setActiveStation] = useState<StationId | null>(null);
  const [worktopItems, setWorktopItems] = useState<WorktopItem[]>([]);
  const [cookingProgress, setCookingProgress] = useState(progress);
  const [cookingOpen, setCookingOpen] = useState(false);
  const activeJourney = cookingProgress.activeRecipeId ? cookingProgress.journeys[cookingProgress.activeRecipeId] : undefined;
  const canCookBananaPancakes = cookingProgress.activeRecipeId === 'banana-pancakes' && activeJourney?.stage === 'cooking';

  const openDefinition = FURNITURE.find(item => item.id === openFurniture) ?? null;
  const inventory = useMemo(
    () => openFurniture ? buildKitchenInventory(progress, openFurniture) : [],
    [openFurniture, progress],
  );

  // De keuken ligt vast; een eerder versleepte indeling hoeft niet meer bewaard te blijven.
  useEffect(() => { window.localStorage.removeItem(LEGACY_LAYOUT_STORAGE_KEY); }, []);

  const placeOnWorktop = useCallback((item: KitchenItem) => {
    setWorktopItems(current => {
      if (current.some(entry => entry.id === item.id)) return current;
      const index = current.length;
      return [...current, {
        ...item,
        x: (index % 5) * 58,
        y: Math.floor(index / 5) * 52,
        station: 'worktop',
        stationX: 28 + (index % 4) * 15,
        stationY: 38 + Math.floor(index / 4) * 16,
      }];
    });
  }, []);

  const resolveStation = useCallback((point: { x: number; y: number }): StationId | null => {
    const scene = sceneRef.current;
    if (!scene) return null;
    for (const station of ['cooktop', 'worktop'] as StationId[]) {
      const target = scene.querySelector<HTMLElement>(`[data-kitchen-station="${station}"]`);
      if (!target) continue;
      const bounds = target.getBoundingClientRect();
      if (point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom) return station;
    }
    return null;
  }, [sceneRef]);

  const moveWorktopItem = useCallback((id: string, info: PanInfo) => {
    const station = resolveStation(info.point);
    setWorktopItems(current => current.map(item => item.id === id ? {
      ...item,
      x: item.x + info.offset.x,
      y: item.y + info.offset.y,
      station,
      stationX: station === 'cooktop' ? 62 : item.stationX,
      stationY: station === 'cooktop' ? 50 : item.stationY,
    } : item));
  }, [resolveStation]);

  const moveStationItem = useCallback((id: string, info: PanInfo) => {
    const bounds = stationCanvasRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const stationX = Math.max(8, Math.min(92, ((info.point.x - bounds.left) / bounds.width) * 100));
    const stationY = Math.max(12, Math.min(88, ((info.point.y - bounds.top) / bounds.height) * 100));
    setWorktopItems(current => current.map(item => item.id === id ? { ...item, stationX, stationY } : item));
  }, []);

  return <>
    {canCookBananaPancakes && <button type="button" className="treehouse-recipe-cta" onClick={() => setCookingOpen(true)} aria-label="Verder met bananenpannenkoekjes">
      <img src={ASSET_LIBRARY.cooking.recipes.bananaPancakes} alt="" draggable={false} />
      <span><small>Alles staat klaar</small><strong>Bananenpannenkoekjes</strong></span>
      <i aria-hidden="true"><BookOpen /></i>
    </button>}
    <div className="treehouse-kitchen-furnishings">
      {FURNITURE.map(item => {
        const isOpen = openFurniture === item.id;
        const isStationOpen = activeStation === item.station;
        return <motion.button
          key={item.id}
          type="button"
          className={`treehouse-kitchen-furnishing treehouse-kitchen-furnishing--${item.id}${isOpen ? ' is-open' : ''}`}
          aria-label={`${item.label} openen`}
          aria-expanded={isOpen || isStationOpen}
          data-kitchen-station={item.station}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: .99 }}
          onClick={() => {
            if (item.station) {
              setOpenFurniture(null);
              setActiveStation(item.station);
              return;
            }
            setOpenFurniture(current => current === item.id ? null : item.id);
          }}
        >
          <img src={isOpen && item.openImage ? item.openImage : item.closedImage} alt="" draggable={false} />
        </motion.button>;
      })}
    </div>

    <div className="treehouse-kitchen-worktop" aria-label="Werkblad">
      {worktopItems.map(item => <motion.button
        key={item.id}
        type="button"
        className="treehouse-kitchen-worktop__item"
        aria-label={`${item.label} verslepen`}
        title={item.label}
        drag
        dragConstraints={sceneRef}
        dragMomentum={false}
        animate={{ x: item.x, y: item.y }}
        whileDrag={{ scale: 1.08, cursor: 'grabbing', zIndex: 9 }}
        onDragEnd={(_, info) => moveWorktopItem(item.id, info)}
      >
        <img src={item.image} alt="" draggable={false} />
      </motion.button>)}
    </div>

    {openFurniture && openDefinition && <aside className="treehouse-kitchen-inventory" aria-label={`${openDefinition.label} inhoud`}>
      <header>
        <div>
          <small>Inhoud</small>
          <h2>{openDefinition.label}</h2>
        </div>
        <button type="button" aria-label="Sluiten" onClick={() => setOpenFurniture(null)}><X /></button>
      </header>
      {inventory.length > 0 ? <div className="treehouse-kitchen-inventory__items">
        {inventory.map(item => <motion.button
          key={item.id}
          type="button"
          className="treehouse-kitchen-inventory__item"
          drag
          dragSnapToOrigin
          dragMomentum={false}
          whileDrag={{ scale: 1.08, zIndex: 10 }}
          onDragEnd={() => placeOnWorktop(item)}
          onClick={() => placeOnWorktop(item)}
          aria-label={`${item.label} op het werkblad zetten`}
        >
          <img src={item.image} alt="" draggable={false} />
          <span><strong>{item.label}</strong><small>{item.quantityLabel}</small></span>
        </motion.button>)}
      </div> : <p className="treehouse-kitchen-inventory__empty">Hier staat nog niets klaar.</p>}
      {inventory.length > 0 && <p className="treehouse-kitchen-inventory__hint"><Hand aria-hidden="true" /> Sleep of tik om iets op het werkblad te zetten.</p>}
    </aside>}

    {activeStation && typeof document !== 'undefined' && createPortal(<section className={`treehouse-kitchen-station treehouse-kitchen-station--${activeStation}`} aria-label={`${STATIONS[activeStation].label} bovenaanzicht`}>
      <img className="treehouse-kitchen-station__background" src={STATIONS[activeStation].image} alt="" />
      <header>
        <button type="button" aria-label="Terug naar de keuken" title="Terug naar de keuken" onClick={() => setActiveStation(null)}><ArrowLeft /></button>
        <h2>{STATIONS[activeStation].label}</h2>
      </header>
      <div ref={stationCanvasRef} className="treehouse-kitchen-station__canvas">
        {worktopItems.filter(item => item.station === activeStation).map(item => <motion.button
          key={item.id}
          type="button"
          className={`treehouse-kitchen-station__item treehouse-kitchen-station__item--${item.kind}`}
          style={{ left: `${item.stationX}%`, top: `${item.stationY}%` }}
          aria-label={`${item.label} op ${STATIONS[activeStation].label} verslepen`}
          title={item.label}
          drag
          dragConstraints={stationCanvasRef}
          dragMomentum={false}
          animate={{ x: 0, y: 0 }}
          transition={{ duration: 0 }}
          whileDrag={{ scale: 1.08, cursor: 'grabbing', zIndex: 4 }}
          onDragEnd={(_, info) => moveStationItem(item.id, info)}
        >
          <img src={item.image} alt="" draggable={false} />
        </motion.button>)}
      </div>
    </section>, document.body)}
    {cookingOpen && typeof document !== 'undefined' && createPortal(<BananaPancakeExperience
      progress={cookingProgress}
      onProgressChange={setCookingProgress}
      onClose={() => setCookingOpen(false)}
    />, document.body)}
  </>;
}
