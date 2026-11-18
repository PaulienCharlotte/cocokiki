import React, { useEffect, useRef, useState } from 'react';
import { GripHorizontal } from 'lucide-react';

const PLEK_KEY = 'cocokiki:inricht-menu-plek:v1';
type Plek = { x: number; y: number };

function leesPlek(): Plek | null {
  try {
    const plek = JSON.parse(localStorage.getItem(PLEK_KEY) ?? 'null');
    return plek && Number.isFinite(plek.x) && Number.isFinite(plek.y) ? plek : null;
  } catch { return null; }
}

/** Houd het menu altijd helemaal in beeld, ook na het draaien van een tablet. */
function binnenBeeld(plek: Plek, el: HTMLElement | null): Plek {
  const breed = el?.offsetWidth ?? 64;
  const hoog = el?.offsetHeight ?? 320;
  return {
    x: Math.min(Math.max(8, plek.x), window.innerWidth - breed - 8),
    y: Math.min(Math.max(8, plek.y), window.innerHeight - hoog - 8),
  };
}

/**
 * Het zijmenu bij het inrichten: links, net als de gereedschapszone in de
 * spellen. Met de greep bovenaan sleep je het weg als het in de weg zit;
 * het onthoudt waar je het neerzet.
 */
export default function InrichtMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [plek, setPlek] = useState<Plek | null>(leesPlek);
  const sleep = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (!plek) return;
    const pas = () => setPlek(huidig => huidig && binnenBeeld(huidig, ref.current));
    pas();
    window.addEventListener('resize', pas);
    return () => window.removeEventListener('resize', pas);
  }, [plek === null]);

  const start = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    sleep.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const beweeg = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!sleep.current) return;
    setPlek(binnenBeeld({ x: event.clientX - sleep.current.dx, y: event.clientY - sleep.current.dy }, ref.current));
  };
  const los = () => {
    if (!sleep.current) return;
    sleep.current = null;
    try { if (plek) localStorage.setItem(PLEK_KEY, JSON.stringify(plek)); } catch { /* alleen gemak */ }
  };
  // Met de pijltjestoetsen kan het ook, zonder muis.
  const toets = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const stap = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[event.key];
    if (!stap) return;
    event.preventDefault();
    const rect = ref.current!.getBoundingClientRect();
    const volgende = binnenBeeld({ x: rect.left + stap[0], y: rect.top + stap[1] }, ref.current);
    setPlek(volgende);
    try { localStorage.setItem(PLEK_KEY, JSON.stringify(volgende)); } catch { /* alleen gemak */ }
  };

  return <div
    ref={ref}
    className={`room-placement-toolbar ck-glas${plek ? ' is-verplaatst' : ''}`}
    role="toolbar"
    aria-orientation="vertical"
    aria-label={label}
    style={plek ? { left: plek.x, top: plek.y } : undefined}
  >
    <button type="button" className="room-placement-toolbar__greep" aria-label="Menu verplaatsen" title="Sleep om te verplaatsen"
      onPointerDown={start} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los} onKeyDown={toets}>
      <GripHorizontal aria-hidden="true" />
    </button>
    {children}
  </div>;
}
