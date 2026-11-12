import VegetablePieces from './VegetablePieces';
import React, { useEffect, useRef, useState } from 'react';
import { COMPACT_COOKTOP_ZONES, COOKTOP_ZONES, cooktopPanFrame, type CooktopZoneId, nearestCooktopZone } from '../../data/cooking/cooktopScene';

interface Props {
  panAsset: string;
  zoneId?: CooktopZoneId;
  additionAsset: string;
  additionLabel: string;
  added: boolean;
  oil: boolean;
  warming: boolean;
  contents?: 'pepper' | 'tomato' | 'vegetables';
  ingredient?: 'pepper' | 'tomato';
  turn?: number;
  pouring?: boolean;
  overlayAsset?: string;
  onStir?: () => void;
  onPlace: (id: CooktopZoneId) => void;
  onAdd: () => void;
}
export default function CooktopCanvas({ panAsset, zoneId, additionAsset, additionLabel, added, oil, warming, onPlace, onAdd, contents, ingredient, turn = 0, pouring, overlayAsset, onStir }: Props) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setCompact(entries[0].contentRect.width < 500));
    if (wrapper.current) observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);
  const zones = compact ? COMPACT_COOKTOP_ZONES : COOKTOP_ZONES;
  const additionStart = compact ? { x: 80, y: 600 } : { x: 110, y: 510 };
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ kind: 'pan' | 'addition'; dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const stirAngle = useRef<number | null>(null);
  const [panPoint, setPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [additionPoint, setAdditionPoint] = useState<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState('');
  const zone = zones.find(item => item.id === zoneId);
  const center = panPoint ?? zone ?? (compact ? { x: 380, y: 590 } : { x: 610, y: 480 });
  const frame = cooktopPanFrame(panAsset, center, compact ? 280 : 400);
  const point = (event: React.PointerEvent<SVGGElement>) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
  };
  const start = (kind: 'pan' | 'addition', event: React.PointerEvent<SVGGElement>) => {
    if (warming) return;
    const p = point(event);
    const position = kind === 'pan' ? center : additionStart;
    dragged.current = false;
    stirAngle.current = Math.atan2(p.y - center.y, p.x - center.x);
    drag.current = { kind, dx: p.x - position.x, dy: p.y - position.y, startX: p.x, startY: p.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
  };
  const move = (event: React.PointerEvent<SVGGElement>) => {
    const current = drag.current;
    if (!current) return;
    const p = point(event);
    if (Math.hypot(p.x - current.startX, p.y - current.startY) < 10 && !current.moved) return;
    current.moved = dragged.current = true;
    if (current.kind === 'pan' && onStir) {
      const angle = Math.atan2(p.y - center.y, p.x - center.x);
      const previous = stirAngle.current ?? angle;
      const delta = Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
      if (Math.abs(delta) > .65) { stirAngle.current = angle; onStir(); }
      return;
    }
    const next = { x: Math.max(compact ? 90 : 130, Math.min(compact ? 460 : 780, p.x - current.dx)), y: Math.max(compact ? 110 : 145, Math.min(compact ? 600 : 480, p.y - current.dy)) };
    if (current.kind === 'pan') setPanPoint(next); else setAdditionPoint({ x: p.x - current.dx, y: p.y - current.dy });
  };
  const finish = (event: React.PointerEvent<SVGGElement>) => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    const p = point(event);
    if (current.moved) {
      if (current.kind === 'pan' && !onStir) {
        const chosen = nearestCooktopZone({ x: p.x - current.dx, y: p.y - current.dy }, zones);
        if (chosen) { onPlace(chosen); setFeedback('De pan staat op de kookzone.'); }
        else setFeedback('Zet de bodem van de pan op een kookzone.');
      } else if (current.kind === 'addition' && Math.hypot(p.x - center.x, p.y - center.y) < 150) { onAdd(); setFeedback('Toegevoegd.'); }
      else if (current.kind === 'addition') setFeedback('Laat los boven de pan. Aantikken mag ook.');
    }
    setPanPoint(null); setAdditionPoint(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancel = () => { drag.current = null; setPanPoint(null); setAdditionPoint(null); };
  const place = (id: CooktopZoneId) => { if (warming) return; onPlace(id); setFeedback('De pan staat op de kookzone.'); };
  const keyboardPlace = (event: React.KeyboardEvent<SVGGElement>) => {
    const i = zones.findIndex(item => item.id === zoneId);
    if (['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const next = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? (i + 2) % 3 : ['ArrowRight', 'ArrowDown'].includes(event.key) ? (i + 1) % 3 : 2;
      place(zones[next].id);
    }
  };
  return <div ref={wrapper} className="cooktop-canvas">
    <svg ref={svg} viewBox={compact ? "0 0 620 720" : "0 0 1000 620"} className="cooktop-canvas__drawing" aria-label="Kookplaat met drie kookzones">
      <rect className="cooktop-canvas__board" x={compact ? 10 : 30} y="30" width={compact ? 600 : 940} height={compact ? 650 : 550} rx="20" />
      {zones.map(item => <g key={item.id} role="button" tabIndex={warming ? -1 : 0} aria-label={`Pan op ${item.label.toLowerCase()} zetten`} aria-pressed={zoneId === item.id} aria-disabled={warming}
        className={`cooktop-zone${zoneId === item.id ? ' is-selected' : ''}${warming && zoneId === item.id ? ' is-warming' : ''}`} onClick={() => place(item.id)} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); place(item.id); } }}>
        <circle cx={item.x} cy={item.y} r={item.radius} />
        <circle cx={item.x} cy={item.y} r={item.radius - 8} />
        <path d={`M${item.x - 8} ${item.y}h16 M${item.x} ${item.y - 8}v16`} />
      </g>)}
      <g className="cooktop-canvas__pan" role="button" tabIndex={warming ? -1 : 0} aria-label={onStir ? "Roer de stukjes in de pan" : "Pan verplaatsen"} aria-disabled={warming}
        onPointerDown={event => start('pan', event)} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel}
        onClick={() => { if (!dragged.current) { if (onStir) onStir(); else place('large'); } }} onKeyDown={event => { if (onStir && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onStir(); } else keyboardPlace(event); }}>
        <rect {...frame} className="cooktop-canvas__pan-hit" />
        <image href={panAsset} {...frame} preserveAspectRatio="xMidYMid meet" />
        {contents && <g className={pouring ? 'cooktop-canvas__pour' : undefined}><VegetablePieces kind={contents} x={center.x} y={center.y} radius={compact ? 60 : 85} turn={turn} /></g>}
        {overlayAsset && <image href={overlayAsset} x={center.x - 90} y={center.y - 90} width="180" height="180" pointerEvents="none" />}
        {added && oil && <ellipse className="cooktop-canvas__oil" cx={center.x} cy={center.y} rx="35" ry="23" />}
      </g>
      {zoneId && !added && <g role="button" tabIndex={0} aria-label={`${additionLabel} naar pan`} className="cooktop-canvas__addition"
        onPointerDown={event => start('addition', event)} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel}
        onClick={() => { if (!dragged.current) onAdd(); }} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); onAdd(); } }}>
        <rect x={(additionPoint?.x ?? additionStart.x) - 65} y={(additionPoint?.y ?? additionStart.y) - 65} width="130" height="140" rx="12" />
        {ingredient ? <VegetablePieces kind={ingredient} x={additionPoint?.x ?? additionStart.x} y={additionPoint?.y ?? additionStart.y} radius={40} />
          : <image href={additionAsset} x={(additionPoint?.x ?? additionStart.x) - 42} y={(additionPoint?.y ?? additionStart.y) - 55} width="84" height="100" />}
        <text x={additionPoint?.x ?? additionStart.x} y={(additionPoint?.y ?? additionStart.y) + 63} textAnchor="middle">{ingredient === 'pepper' ? 'Paprika' : ingredient === 'tomato' ? 'Tomaat' : additionLabel === 'Afgemeten olie' ? 'Olie' : additionLabel}</text>
      </g>}
    </svg>
    <span className="sr-only" role="status">{feedback}</span>
  </div>;
}
