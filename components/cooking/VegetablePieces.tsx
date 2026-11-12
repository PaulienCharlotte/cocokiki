import React from 'react';

/** Kleine herkenbare stukjes: dezelfde vormen bij het strooien en in de pan. */
export default function VegetablePieces({ kind, x, y, radius = 90, turn = 0 }: { kind: 'pepper' | 'tomato' | 'vegetables'; x: number; y: number; radius?: number; turn?: number }) {
  return <g className={`vegetable-pieces vegetable-pieces--${kind}`} transform={`translate(${x} ${y}) rotate(${turn})`} aria-hidden="true">
    {Array.from({ length: 18 }, (_, i) => {
      const angle = i * 2.399963;
      const r = Math.sqrt((i + .5) / 18) * radius;
      const tomato = kind === 'tomato' || kind === 'vegetables' && i % 3 === 0;
      return <g key={i} transform={`translate(${Math.cos(angle) * r} ${Math.sin(angle) * r * .85}) rotate(${i * 43})`}>
        {tomato ? <><path className="vegetable-piece__tomato" d="M-15-11Q18-16 17 10Q2 20-15-11Z" /><path className="vegetable-piece__flesh" d="M-8-6Q12-9 11 8Q2 10-8-6Z" /><ellipse className="vegetable-piece__seed" cx="4" cy="2" rx="2" ry="4" /></>
          : <><path className="vegetable-piece__pepper" d="M-11-10Q0-14 12-8L10 10Q-1 14-12 7Z" /><path className="vegetable-piece__shine" d="M-8-6Q0-9 8-5" /></>}
      </g>;
    })}
  </g>;
}
