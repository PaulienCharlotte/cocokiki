import React, { useMemo } from 'react';

const COLORS = ['#f5c875', '#a8bfa0', '#f5b5a6', '#c9a7db', '#b9ddf2', '#7fa776'];

/**
 * Confetti valt over het gerecht heen bij een afronding. Puur decoratief, dus
 * verborgen voor schermlezers; met beperkte beweging valt er niets.
 */
export default function Confetti({ pieces = 26 }: { pieces?: number }) {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const flakes = useMemo(() => Array.from({ length: pieces }, (_, index) => ({
    id: index,
    left: Math.round((index / pieces) * 100 + (Math.random() * 7 - 3.5)),
    delay: Math.round(Math.random() * 1400),
    duration: 2400 + Math.round(Math.random() * 1600),
    drift: Math.round(Math.random() * 60 - 30),
    spin: Math.round(Math.random() * 540 - 270),
    color: COLORS[index % COLORS.length],
    round: index % 3 === 0,
  })), [pieces]);

  if (reducedMotion) return null;

  return <span className="confetti" aria-hidden="true">
    {flakes.map(flake => <i
      key={flake.id}
      className={flake.round ? 'is-round' : ''}
      style={{
        left: `${flake.left}%`,
        background: flake.color,
        animationDelay: `${flake.delay}ms`,
        animationDuration: `${flake.duration}ms`,
        '--confetti-drift': `${flake.drift}px`,
        '--confetti-spin': `${flake.spin}deg`,
      } as React.CSSProperties}
    />)}
  </span>;
}
