import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Leaf, LibraryBig, Stethoscope } from 'lucide-react';
import { type TreehouseRoomId } from '../data/treehouse';
import { createEmptyCookingProgress, loadCookingProgress, startJourney } from '../services/cookingProgress';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import InteractiveKitchen from '../components/treehouse/InteractiveKitchen';
import RoomInventoryDrawer from '../components/treehouse/RoomInventoryDrawer';
import { ownedRooms, loadRoomExpansions, ROOM_EXPANSIONS_KEY } from '../services/roomExpansions';
import { subscribeLocalState } from '../services/localState';
import '../components/treehouse/expansion.css';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PlantFamilyPanel from '../components/plants/PlantFamilyPanel';

interface TreehouseInteriorProps {
  room: TreehouseRoomId;
  onNavigate: (path: string) => void;
}

export default function TreehouseInterior({ room, onNavigate }: TreehouseInteriorProps) {
  const [plantsOpen, setPlantsOpen] = useState(false);
  const viewportRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ left: true, right: false });
  const [expansions, setExpansions] = useState(loadRoomExpansions);
  useEffect(() => subscribeLocalState(() => setExpansions(loadRoomExpansions()), ROOM_EXPANSIONS_KEY), []);
  const rooms = ownedRooms(expansions);
  const roomIndex = rooms.findIndex(item => item.id === room);
  const definition = rooms[roomIndex];
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
    if (maximum <= 2) {
      setScrollEdges({ left: true, right: true });
      return;
    }
    setScrollEdges({
      left: viewport.scrollLeft <= 2,
      right: viewport.scrollLeft >= maximum - 2,
    });
  }, []);

  const panRoom = useCallback((direction: -1 | 1) => {
    const edge = direction === -1 ? scrollEdges.left : scrollEdges.right;
    const adjacent = rooms[roomIndex + direction];
    if (edge && adjacent) { onNavigate(`${adjacent.path}?entry=${direction === 1 ? 'left' : 'right'}`); return; }
    viewportRef.current?.scrollBy({
      left: direction * Math.max(220, window.innerWidth * 0.7),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [scrollEdges, rooms, roomIndex, onNavigate]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const centerRoom = () => {
      const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const entry = new URLSearchParams(window.location.search).get('entry');
      viewport.scrollLeft = entry === 'left' ? 0 : entry === 'right' ? maximum : maximum / 2;
      updateScrollEdges();
    };
    const frame = window.requestAnimationFrame(centerRoom);
    window.addEventListener('resize', centerRoom);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', centerRoom);
    };
  }, [room, updateScrollEdges]);

  if (!definition) return <main className="treehouse-room-unavailable"><h1>Deze kamer is nog niet gebouwd</h1><button onClick={() => onNavigate('/treehouse')}>Naar mijn boomhut</button></main>;
  return <main
    ref={viewportRef}
    className={`treehouse-interior treehouse-interior--${room}`}
    aria-labelledby="treehouse-interior-title"
    onScroll={updateScrollEdges}
  >
    <div ref={sceneRef} className="treehouse-interior__scene">
      <img className="treehouse-interior__background" src={definition.background} alt={definition.alt} />
      <h1 id="treehouse-interior-title" className="treehouse-room__title">{definition.label}</h1>

      {room === 'kitchen' && <InteractiveKitchen progress={progress} sceneRef={sceneRef} onNavigate={onNavigate} />}
      <RoomInventoryDrawer room={room} sceneRef={sceneRef} />
    </div>

    {room === 'kitchen' && <button className="kitchen-cookbook-trigger" type="button" onClick={() => onNavigate('/treehouse/cookbook')} aria-label="Mijn Kookboek openen" title="Mijn Kookboek">
      <BookOpen aria-hidden="true" /><span>Kookboek</span>
    </button>}
    {room === 'kitchen' && <button className="kitchen-cookbook-trigger kitchen-encyclopedia-trigger" type="button" onClick={() => onNavigate('/treehouse/encyclopedia')} aria-label="Mijn Encyclopedie openen" title="Mijn Encyclopedie"><LibraryBig aria-hidden="true" /><span>Encyclopedie</span></button>}

    {/* Planten horen bij het terras, net zoals koken bij de keuken hoort. */}
    {room === 'terrace' && <button className="kitchen-cookbook-trigger" type="button" onClick={() => setPlantsOpen(true)} aria-label="Mijn Planten openen" title="Mijn Planten">
      <Leaf aria-hidden="true" /><span>Mijn Planten</span>
    </button>}
    {room === 'terrace' && <button className="kitchen-cookbook-trigger kitchen-encyclopedia-trigger" type="button" onClick={() => onNavigate('/plantendokter')} aria-label="Plantendokter openen" title="Plantendokter">
      <Stethoscope aria-hidden="true" /><span>Plantendokter</span>
    </button>}
    {room === 'terrace' && <button className="kitchen-cookbook-trigger terrace-encyclopedia-trigger" type="button" onClick={() => onNavigate('/treehouse/encyclopedia')} aria-label="Mijn Encyclopedie openen" title="Mijn Encyclopedie">
      <LibraryBig aria-hidden="true" /><span>Encyclopedie</span>
    </button>}
    {plantsOpen && <PlantFamilyPanel onClose={() => setPlantsOpen(false)} />}

    <div className="treehouse-interior__pan-controls" aria-label="Kijk rond en ga naar de kamer ernaast">
      <button type="button" title={scrollEdges.left ? rooms[roomIndex - 1]?.label ?? 'Einde van de boomhut' : 'Kijk naar links'} aria-label={scrollEdges.left && rooms[roomIndex - 1] ? `Naar ${rooms[roomIndex - 1].label}` : 'Kijk naar links'} disabled={scrollEdges.left && !rooms[roomIndex - 1]} onClick={() => panRoom(-1)}>
        <ArrowLeft /><span className="sr-only">Links</span>
      </button>
      <button type="button" title={scrollEdges.right ? rooms[roomIndex + 1]?.label ?? 'Einde van de boomhut' : 'Kijk naar rechts'} aria-label={scrollEdges.right && rooms[roomIndex + 1] ? `Naar ${rooms[roomIndex + 1].label}` : 'Kijk naar rechts'} disabled={scrollEdges.right && !rooms[roomIndex + 1]} onClick={() => panRoom(1)}>
        <ArrowRight /><span className="sr-only">Rechts</span>
      </button>
    </div>

  </main>;
}
