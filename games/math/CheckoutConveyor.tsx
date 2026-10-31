import React from 'react';
import type { MathQuestion } from './types';

export default function CheckoutConveyor({ question, progress, running, falling }: {
  key?: number; question: MathQuestion; progress: number; running: boolean; falling: boolean;
}) {
  return <div className={`checkout-conveyor${running ? ' is-running' : ''}${falling ? ' is-falling' : ''}`}>
    <div className="checkout-conveyor__belt" aria-hidden="true"><img src="/games/school/math/adventures/checkout-belt.webp" alt="" draggable={false} /><div className="checkout-conveyor__treads" /></div>
    {running && <div className="checkout-conveyor__goods" style={{ left: `${12 + progress * 73}%` }}>
      {question.checkout?.products.map(product => <div className="checkout-conveyor__product" key={product.id}>
        <img src={product.image} alt={product.name} draggable={false} />
      </div>)}
    </div>}
  </div>;
}
