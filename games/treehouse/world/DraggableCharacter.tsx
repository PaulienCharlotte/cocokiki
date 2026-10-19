import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface CharacterPosition { x: number; y: number; }

interface DraggableCharacterProps {
  id: 'coco' | 'kiki';
  name: string;
  src: string;
  initialPosition: CharacterPosition;
  worldScale: number;
}

const STORAGE_PREFIX = 'cocokiki:world:character:v2:';

function loadPosition(id: string, fallback: CharacterPosition): CharacterPosition {
  try {
    const saved = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${id}`) ?? 'null') as Partial<CharacterPosition> | null;
    if (typeof saved?.x === 'number' && typeof saved.y === 'number') return { x: saved.x, y: saved.y };
  } catch { /* Keep the designed starting position. */ }
  return fallback;
}

export default function DraggableCharacter({ id, name, src, initialPosition, worldScale }: DraggableCharacterProps) {
  const [position, setPosition] = useState(() => loadPosition(id, initialPosition));
  const drag = useRef<{ pointerX: number; pointerY: number; start: CharacterPosition } | null>(null);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(position));
  }, [id, position]);

  const startDragging = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, start: position };
  };

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    event.stopPropagation();
    setPosition({
      x: Math.max(80, Math.min(2320, drag.current.start.x + (event.clientX - drag.current.pointerX) / worldScale)),
      y: Math.max(100, Math.min(1400, drag.current.start.y + (event.clientY - drag.current.pointerY) / worldScale)),
    });
  };

  const stopDragging = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    drag.current = null;
  };

  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 30 : 10;
    const movement = {
      ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step },
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    setPosition(current => ({ x: current.x + movement.x, y: current.y + movement.y }));
  };

  return <button
    type="button"
    className={`adventure-character adventure-${id}`}
    style={{ left: position.x, top: position.y }}
    aria-label={`${name} verplaatsen`}
    title={`Sleep ${name}`}
    onPointerDown={startDragging}
    onPointerMove={move}
    onPointerUp={stopDragging}
    onPointerCancel={stopDragging}
    onKeyDown={moveWithKeyboard}
  >
    <img src={src} alt={name} draggable={false} />
  </button>;
}
