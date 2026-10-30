import React, { useEffect, useRef, useState } from 'react';
import type { IslandActivity, IslandId } from '../../platform/dreamworld';
import { loadIslandIconPositions, saveIslandIconPosition, type IslandIconPosition } from '../../services/islandIconLayout';

export default function MovableGameIcon({ island, activity, onNavigate, editing, onEdit }: {
  key?: string; island: IslandId; activity: IslandActivity; onNavigate: (path: string) => void; editing: boolean; onEdit: () => void;
}) {
  const [position, setPosition] = useState<IslandIconPosition | undefined>(() => loadIslandIconPositions(island)[activity.id]);
  const [moving, setMoving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const press = useRef<{ id: number; x: number; y: number; active: boolean; offsetX: number; offsetY: number; original?: IslandIconPosition; point?: IslandIconPosition } | null>(null);
  const suppressClick = useRef(false);
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => () => clearTimer(), []);

  const finish = (cancelled: boolean) => {
    clearTimer();
    const current = press.current;
    if (current?.active) {
      suppressClick.current = true;
      if (cancelled) setPosition(current.original);
      else if (current.point) saveIslandIconPosition(island, activity.id, current.point);
    }
    press.current = null;
    setMoving(false);
  };

  return <button type="button" className={`dream-location${moving ? ' is-moving' : ''}`}
    style={{ '--location-x': `${activity.x}%`, '--location-y': `${activity.y}%`, ...(position ? { left: `${position.x}%`, top: `${position.y}%` } : {}) } as React.CSSProperties}
    aria-label={`${activity.label} openen`} title={activity.label}
    onContextMenu={event => event.preventDefault()}
    onPointerDown={event => {
      if (event.button !== 0 || press.current) return;
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      suppressClick.current = false;
      press.current = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false, offsetX: event.clientX - rect.left - rect.width / 2, offsetY: event.clientY - rect.top - rect.height / 2, original: position };
      clearTimer();
      const activate = () => {
        if (!press.current || !element.isConnected) return;
        press.current.active = true;
        suppressClick.current = true;
        element.setPointerCapture(press.current.id);
        setMoving(true);
        onEdit();
      };
      if (editing) activate();
      else timer.current = setTimeout(activate, 500);
    }}
    onPointerMove={event => {
      const current = press.current;
      if (!current || current.id !== event.pointerId) return;
      if (!current.active) {
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 10) { clearTimer(); suppressClick.current = true; }
        return;
      }
      const scene = event.currentTarget.parentElement!.getBoundingClientRect();
      const icon = event.currentTarget.getBoundingClientRect();
      const halfWidth = Math.min(50, icon.width / scene.width * 50);
      const halfHeight = Math.min(50, icon.height / scene.height * 50);
      const point = {
        x: Math.max(halfWidth, Math.min(100 - halfWidth, (event.clientX - scene.left - current.offsetX) / scene.width * 100)),
        y: Math.max(halfHeight, Math.min(100 - halfHeight, (event.clientY - scene.top - current.offsetY) / scene.height * 100)),
      };
      current.point = point;
      setPosition(point);
    }}
    onPointerUp={event => { if (press.current?.id === event.pointerId) finish(false); }}
    onPointerCancel={() => finish(true)}
    onLostPointerCapture={() => { if (press.current) finish(true); }}
    onPointerLeave={() => { if (!press.current?.active) { clearTimer(); press.current = null; } }}
    onKeyDown={event => { if (event.key === 'Escape') finish(true); }}
    onClick={event => { if (!editing && (event.detail === 0 || !suppressClick.current)) onNavigate(activity.path); }}>
    <img src={activity.image} alt="" draggable={false} />
  </button>;
}
