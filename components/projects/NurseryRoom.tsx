import React, { useEffect, useRef, useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { IconButton } from '../../design-system';
import type { NurseryItemId } from '../../data/projects/nursery';
import { MIN_PLACEMENT_SCALE, MAX_PLACEMENT_SCALE } from '../../services/roomInventory';
import { actiefProject, nurseryPoint, positionNursery, prepareNurseryRoom, resizeNursery, type NurseryState } from '../../services/nurseryProject';

interface Props { state: NurseryState; onSave: (ok: boolean) => void }
interface Drag {
  id: NurseryItemId; pointer: number; revision: number; element: HTMLButtonElement;
  startX: number; startY: number; x: number; y: number; scale: number;
  bounds: DOMRect; moved: boolean; next: ReturnType<typeof nurseryPoint>;
}

export default function NurseryRoom({ state, onSave }: Props) {
  const [selected, setSelected] = useState<NurseryItemId | null>(null);
  const scene = useRef<HTMLDivElement>(null), drag = useRef<Drag | null>(null), frame = useRef<number | null>(null);
  const complete = state.stage === 'complete';
  useEffect(() => { if (!complete && state.basket.some(id => !state.positions[id])) onSave(prepareNurseryRoom()); }, [state.revision, complete]);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  const stop = (cancel = false) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const d = drag.current; drag.current = null;
    if (!d) return;
    d.element.style.left = `${d.x}%`; d.element.style.top = `${d.y}%`;
    d.element.classList.remove('is-dragging');
    if (!cancel && d.moved) onSave(positionNursery(d.revision, d.id, d.next.x, d.next.y));
  };
  const item = actiefProject().items.find(i => i.id === selected), point = selected && state.positions[selected];
  return <>
    <div ref={scene} className="nursery-room" aria-label={actiefProject().titel} onPointerDown={e => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('nursery-room__background')) setSelected(null); }}>
      <img className="nursery-room__background" src={actiefProject().kamer} alt="" draggable={false} />
      {actiefProject().items.filter(i => state.positions[i.id]).map(item => {
        const p = state.positions[item.id]!;
        return <button type="button" key={item.id} className={`nursery-room__item--${item.id}`} disabled={complete} aria-label={`${item.name} verplaatsen`} aria-pressed={selected === item.id} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${item.width * (p.scale ?? 1)}%`, zIndex: selected === item.id ? 100 : Math.round(p.y) }}
          onFocus={() => setSelected(item.id)} onClick={() => setSelected(item.id)}
          onPointerDown={e => {
            if (complete || !scene.current) return;
            e.preventDefault(); e.currentTarget.focus({ preventScroll: true }); setSelected(item.id);
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { id: item.id, pointer: e.pointerId, revision: state.revision, element: e.currentTarget, startX: e.clientX, startY: e.clientY, x: p.x, y: p.y, scale: p.scale ?? 1, bounds: scene.current.getBoundingClientRect(), moved: false, next: nurseryPoint(item.id, p.x, p.y, p.scale) };
          }}
          onPointerMove={e => {
            const d = drag.current; if (!d || d.pointer !== e.pointerId) return;
            if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 3) return;
            d.moved = true; d.element.classList.add('is-dragging');
            d.next = nurseryPoint(d.id, d.x + (e.clientX - d.startX) / d.bounds.width * 100, d.y + (e.clientY - d.startY) / d.bounds.height * 100, d.scale);
            // Alleen de zichtbare positie verandert per frame; opslag gebeurt bij loslaten.
            if (frame.current === null) frame.current = requestAnimationFrame(() => { frame.current = null; if (drag.current !== d) return; d.element.style.left = `${d.next.x}%`; d.element.style.top = `${d.next.y}%`; });
          }} onPointerUp={() => stop()} onPointerCancel={() => stop(true)} onLostPointerCapture={() => stop(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setSelected(null); return; }
            const delta = e.shiftKey ? 2 : .5;
            const move = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] }[e.key];
            if (move) { e.preventDefault(); onSave(positionNursery(state.revision, item.id, p.x + move[0], p.y + move[1])); }
          }}><svg viewBox={`${item.frame[0]} ${item.frame[1]} ${item.frame[2]} ${item.frame[3]}`} width={item.frame[2]} height={item.frame[3]} aria-hidden="true"><image href={item.image} width={item.frame[4]} height={item.frame[5]} /></svg></button>;
      })}
    </div>
    {!complete && item && point && <div className="nursery-adjust" role="toolbar" aria-label={`${item.name} aanpassen`}>
      <IconButton label={`${item.name} kleiner maken`} title="Kleiner" icon={<Minus />} disabled={(point.scale ?? 1) <= MIN_PLACEMENT_SCALE} onClick={() => onSave(resizeNursery(state.revision, item.id, -1))} />
      <IconButton label={`${item.name} groter maken`} title="Groter" icon={<Plus />} disabled={(point.scale ?? 1) >= MAX_PLACEMENT_SCALE} onClick={() => onSave(resizeNursery(state.revision, item.id, 1))} />
      <IconButton label="Klaar met aanpassen" title="Klaar" icon={<Check />} onClick={() => setSelected(null)} />
    </div>}
  </>;
}
