import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { boundedSchoolPoint, defaultSchoolLayout, loadSchoolLayout, saveSchoolLayoutMode, type SchoolIconId, type SchoolLayoutMode } from '../services/schoolLayout';

export default function useSchoolLayout() {
  const [layout, setLayout] = useState(loadSchoolLayout);
  const currentLayout = useRef(layout);
  const [mode, setMode] = useState<SchoolLayoutMode>(() => typeof window !== 'undefined' && window.innerWidth <= 760 ? 'mobile' : 'desktop');
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState<SchoolIconId | null>(null);
  const [error, setError] = useState('');
  const area = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ id: SchoolIconId; pointer: number; x: number; y: number; cx: number; cy: number; width: number; height: number; active: boolean; cancelled: boolean; before: typeof layout; mode: SchoolLayoutMode } | null>(null);
  const suppressClick = useRef(false);
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const update = (next: typeof layout) => { currentLayout.current = next; setLayout(next); };
  const persist = (next: typeof layout, targetMode = mode) => setError(saveSchoolLayoutMode(targetMode, next[targetMode]) ? '' : 'Opslaan lukte niet. Probeer nog eens.');
  const cancel = () => { clearTimer(); if (drag.current) update(drag.current.before); drag.current = null; setMoving(null); suppressClick.current = true; };
  useEffect(() => {
    const resize = () => { cancel(); setMode(window.innerWidth <= 760 ? 'mobile' : 'desktop'); };
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { cancel(); setEditing(false); } };
    window.addEventListener('resize', resize); window.addEventListener('keydown', escape);
    return () => { clearTimer(); window.removeEventListener('resize', resize); window.removeEventListener('keydown', escape); };
  }, []);
  return {
    area, editing, moving, error,
    toggle: () => { clearTimer(); drag.current = null; setMoving(null); if (editing) persist(currentLayout.current); setEditing(value => !value); },
    reset: () => { const next = { ...currentLayout.current, [mode]: defaultSchoolLayout()[mode] }; update(next); persist(next); },
    iconProps: (id: SchoolIconId, navigate: () => void) => ({
      style: { '--icon-x': `${layout[mode][id].x * 100}%`, '--icon-y': `${layout[mode][id].y * 100}%` } as import('react').CSSProperties,
      onContextMenu: (event: import('react').MouseEvent) => event.preventDefault(),
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0 || drag.current) return;
        clearTimer(); suppressClick.current = false;
        const rect = event.currentTarget.getBoundingClientRect();
        drag.current = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, width: rect.width, height: rect.height, active: editing, cancelled: false, before: currentLayout.current, mode };
        event.currentTarget.setPointerCapture(event.pointerId);
        if (editing) setMoving(id);
        else timer.current = setTimeout(() => { if (drag.current && !drag.current.cancelled) { drag.current.active = true; setEditing(true); setMoving(id); suppressClick.current = true; } }, 450);
      },
      onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
        const active = drag.current;
        if (!active || active.pointer !== event.pointerId) return;
        const dx = event.clientX - active.x, dy = event.clientY - active.y;
        if (!active.active) { if (Math.hypot(dx, dy) > 10) { clearTimer(); active.cancelled = true; suppressClick.current = true; } return; }
        const bounds = area.current?.getBoundingClientRect();
        if (!bounds) return;
        const point = boundedSchoolPoint(active.cx + dx - bounds.left, active.cy + dy - bounds.top, bounds.width, bounds.height, active.width, active.height);
        update({ ...currentLayout.current, [active.mode]: { ...currentLayout.current[active.mode], [id]: point } });
      },
      onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
        clearTimer(); const active = drag.current;
        if (!active || active.pointer !== event.pointerId) return;
        drag.current = null; setMoving(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        if (active.active) { suppressClick.current = true; persist(currentLayout.current, active.mode); }
      },
      onPointerCancel: cancel,
      onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => { if (drag.current?.pointer === event.pointerId) cancel(); },
      onClick: (event: import('react').MouseEvent) => { if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; } if (!editing) navigate(); },
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!editing) { if (event.key === 'F2') { event.preventDefault(); setEditing(true); } return; }
        const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const direction = directions[event.key], bounds = area.current?.getBoundingClientRect();
        if (!direction || !bounds) return;
        event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(), delta = event.shiftKey ? 20 : 4;
        const point = boundedSchoolPoint(rect.left + rect.width / 2 - bounds.left + direction[0] * delta, rect.top + rect.height / 2 - bounds.top + direction[1] * delta, bounds.width, bounds.height, rect.width, rect.height);
        const next = { ...currentLayout.current, [mode]: { ...currentLayout.current[mode], [id]: point } }; update(next); persist(next);
      },
    }),
  };
}
