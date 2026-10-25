import React, { useRef, useState, type RefObject } from 'react';

/** Pointer capture handles touch and mouse; native click/Enter is the parallel input path. */
export default function DragChoice({ value, label, selected, disabled, targetRef, onChoose, onDrop, children }: {
  value: number; label?: string; selected?: boolean; disabled?: boolean; targetRef: RefObject<HTMLElement | null>; onChoose: (value: number) => void; onDrop: (value: number, x: number, y: number) => void; children?: React.ReactNode;
}) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const moving = offset.x !== 0 || offset.y !== 0;
  return <button type="button" className={`math-drag-tile${selected ? ' is-selected' : ''}${moving ? ' is-dragging' : ''}`} disabled={disabled}
    aria-label={label ?? `Getal ${value}`} aria-pressed={selected} style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    onPointerDown={event => {
      if (event.button !== 0 || disabled || origin.current) return;
      suppressClick.current = false;
      origin.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const start = origin.current;
      if (!start || start.id !== event.pointerId) return;
      const x = event.clientX - start.x, y = event.clientY - start.y;
      if (Math.hypot(x, y) > 7) setOffset({ x, y });
    }} onPointerUp={event => {
      const start = origin.current;
      if (!start || start.id !== event.pointerId) return;
      const dragged = Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7;
      origin.current = null; setOffset({ x: 0, y: 0 });
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (dragged) {
        suppressClick.current = true;
        const rect = targetRef.current?.getBoundingClientRect();
        if (rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) onDrop(value, event.clientX, event.clientY);
      }
    }} onPointerCancel={() => { origin.current = null; suppressClick.current = true; setOffset({ x: 0, y: 0 }); }}
    onLostPointerCapture={() => { if (origin.current) { origin.current = null; suppressClick.current = true; setOffset({ x: 0, y: 0 }); } }}
    onClick={event => { if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; } onChoose(value); }}>
    {children ?? value}
  </button>;
}
