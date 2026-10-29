import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, LocateFixed, Minus, Plus } from 'lucide-react';
import { IconButton } from '../../design-system';
import { clampWorldView, worldImageSize, type WorldView } from '../../services/worldViewport';
import type { MapSpot } from '../../platform/dreamworld';

export interface ViewerLocation { id: string; label: string; spot: MapSpot; path: string; comingSoon?: boolean; icon?: React.ReactNode }
interface Props { image: string; alt: string; ratio: number; locations: ViewerLocation[]; onNavigate: (path: string) => void }
const rememberedViews = new Map<string, WorldView>();

/** Beeld en raakvlakken delen altijd dezelfde transformatie en afmetingen. */
export default function WorldMapViewer({ image, alt, ratio, locations, onNavigate }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [view, setView] = useState<WorldView>(() => rememberedViews.get(image) ?? { scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ id: number; x: number; y: number; view: WorldView; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const debug = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('hotspots');
  const { width, height } = worldImageSize(size.width, size.height, ratio);
  const constrain = (next: WorldView) => clampWorldView(next, size.width, size.height, width, height);
  useEffect(() => { rememberedViews.set(image, view); }, [image, view]);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (size.width > 1) setView(current => clampWorldView(current, size.width, size.height, width, height)); }, [size.width, size.height, width, height]);
  const focus = (spot: MapSpot) => setView(current => constrain({ ...current, x: (.5 - spot.x) * width * current.scale, y: (.5 - spot.y) * height * current.scale }));
  const zoom = (delta: number) => setView(current => constrain({ ...current, scale: current.scale + delta }));
  const pan = (direction: -1 | 1) => setView(current => constrain({ ...current, x: current.x - direction * size.width * .7 }));
  const canPanLeft = constrain({ ...view, x: view.x + 1 }).x > view.x;
  const canPanRight = constrain({ ...view, x: view.x - 1 }).x < view.x;

  return <div ref={viewport} className={`dream-map${debug ? ' dream-map--debug' : ''}${dragging ? ' is-dragging' : ''}`} aria-label="Dreamworld-kaart"
    onPointerDown={event => {
      if (event.button !== 0 || (event.target as HTMLElement).closest('.dream-map__controls, .dream-map__pan')) return;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view, moved: false };
      suppressClick.current = false;
    }}
    onPointerMove={event => {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 8) return;
      start.moved = true; suppressClick.current = true; setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      setView(constrain({ ...start.view, x: start.view.x + dx, y: start.view.y + dy }));
    }}
    onPointerUp={event => { if (gesture.current?.id === event.pointerId) { gesture.current = null; setDragging(false); } }}
    onPointerCancel={() => { gesture.current = null; suppressClick.current = true; setDragging(false); }}
    onKeyDown={event => {
      if ((event.target as HTMLElement).closest('button')) return;
      const deltas: Record<string, [number, number]> = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] };
      if (deltas[event.key]) { event.preventDefault(); const [x, y] = deltas[event.key]; setView(current => constrain({ ...current, x: current.x + x, y: current.y + y })); }
    }} tabIndex={0}>
    <div className="dream-map__image-plane" style={{ width, height, '--map-icon-scale': 1 / view.scale, transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.scale})` } as React.CSSProperties}>
      <img src={image} alt={alt} draggable={false} fetchPriority="high" />
      <nav aria-label="Eilanden in Dreamworld">
        {locations.map(location => <button type="button" key={location.id} className="dream-hotspot" aria-label={`${location.label} openen`} title={`${location.label}${location.comingSoon ? ' · Binnenkort' : ''}`}
          style={{ left: `${(location.spot.x - location.spot.width / 2) * 100}%`, top: `${(location.spot.y - location.spot.height / 2) * 100}%`, width: `${location.spot.width * 100}%`, height: `${location.spot.height * 100}%` }}
          onFocus={event => { if (event.currentTarget.matches(':focus-visible')) focus(location.spot); }}
          onClick={() => { if (!suppressClick.current) onNavigate(location.path); }}>
          {location.icon}
        </button>)}
      </nav>
    </div>
    <div className="dream-map__controls" aria-label="Kaartweergave">
      <IconButton label="Uitzoomen" icon={<Minus />} onClick={() => zoom(-.25)} disabled={view.scale <= 1} />
      <IconButton label="Hele wereld centreren" icon={<LocateFixed />} onClick={() => setView({ scale: 1, x: 0, y: 0 })} />
      <IconButton label="Inzoomen" icon={<Plus />} onClick={() => zoom(.25)} disabled={view.scale >= 2.5} />
    </div>
    <nav className="dream-map__pan" aria-label="Beweeg over de wereldkaart">
      <IconButton label="Kaart naar links" icon={<ArrowLeft />} disabled={!canPanLeft} onClick={() => pan(-1)} />
      <IconButton label="Kaart naar rechts" icon={<ArrowRight />} disabled={!canPanRight} onClick={() => pan(1)} />
    </nav>
  </div>;
}
