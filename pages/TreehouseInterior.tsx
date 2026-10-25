import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { TREEHOUSE_ROOMS_BY_ID, type TreehouseRoomId } from '../data/treehouse';
import { createEmptyCookingProgress, loadCookingProgress, startJourney } from '../services/cookingProgress';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import InteractiveKitchen from '../components/treehouse/InteractiveKitchen';
import RoomInventoryDrawer from '../components/treehouse/RoomInventoryDrawer';

interface TreehouseInteriorProps {
  room: TreehouseRoomId;
  onNavigate: (path: string) => void;
}

export default function TreehouseInterior({ room, onNavigate }: TreehouseInteriorProps) {
  const viewportRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ left: true, right: false });
  const definition = TREEHOUSE_ROOMS_BY_ID[room];
  const progress = useMemo(() => {
    if (import.meta.env.DEV && room === 'kitchen' && new URLSearchParams(window.location.search).get('cookingDemo') === '1') {
      const demo = startJourney(createEmptyCookingProgress(), RECIPES_BY_ID['banana-pancakes']);
      demo.activeRecipeId = 'banana-pancakes';
      demo.journeys['banana-pancakes']!.stage = 'cooking';
      demo.inventory.consumables = { banana: 1, eggs: 2, oats: 40 };
      demo.inventory.equipmentIds = ['bowl', 'fork', 'pan', 'spatula'];
      return demo;
    }
    return loadCookingProgress();
  }, [room]);

  const updateScrollEdges = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maximum = viewport.scrollWidth - viewport.clientWidth;
    if (maximum <= 48) {
      setScrollEdges({ left: true, right: true });
      return;
    }
    setScrollEdges({
      left: viewport.scrollLeft <= 2,
      right: viewport.scrollLeft >= maximum - 2,
    });
  }, []);

  const panRoom = useCallback((direction: -1 | 1) => {
    viewportRef.current?.scrollBy({
      left: direction * Math.max(220, window.innerWidth * 0.7),
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const centerRoom = () => {
      viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
      updateScrollEdges();
    };
    const frame = window.requestAnimationFrame(centerRoom);
    window.addEventListener('resize', centerRoom);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', centerRoom);
    };
  }, [room, updateScrollEdges]);

  return <main
    ref={viewportRef}
    className={`treehouse-interior treehouse-interior--${room}`}
    aria-labelledby="treehouse-interior-title"
    onScroll={updateScrollEdges}
  >
    <div ref={sceneRef} className="treehouse-interior__scene">
      <img className="treehouse-interior__background" src={definition.background} alt={definition.alt} />
      <h1 id="treehouse-interior-title" className="treehouse-room__title">{definition.label}</h1>

      {room === 'living-room' && <nav className="treehouse-interior__collections" aria-label="Mijn verzamelingen">
        <button type="button" onClick={() => onNavigate('/treehouse/encyclopedia')} aria-label="Mijn Encyclopedie openen">
          <img src={ASSET_LIBRARY.treehouse.collections.encyclopedia} alt="" /><span><BookOpen />Mijn Encyclopedie</span>
        </button>
      </nav>}

      {room === 'kitchen' && <InteractiveKitchen progress={progress} sceneRef={sceneRef} onNavigate={onNavigate} />}
      <RoomInventoryDrawer room={room} sceneRef={sceneRef} />
    </div>

    {room === 'kitchen' && <button className="kitchen-cookbook-trigger" type="button" onClick={() => onNavigate('/treehouse/cookbook')} aria-label="Mijn Kookboek openen" title="Mijn Kookboek">
      <BookOpen aria-hidden="true" /><span>Kookboek</span>
    </button>}

    <div className="treehouse-interior__pan-controls" aria-label="Kijk rond in de kamer" style={scrollEdges.left && scrollEdges.right ? { display: 'none' } : undefined}>
      <button type="button" aria-label="Kijk naar links" disabled={scrollEdges.left} onClick={() => panRoom(-1)}>
        <img src={ASSET_LIBRARY.treehouse.icons.arrowLeft} alt="" />
      </button>
      <button type="button" aria-label="Kijk naar rechts" disabled={scrollEdges.right} onClick={() => panRoom(1)}>
        <img src={ASSET_LIBRARY.treehouse.icons.arrowRight} alt="" />
      </button>
    </div>

  </main>;
}
