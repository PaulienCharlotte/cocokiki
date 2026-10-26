import React, { useEffect, useRef, useState } from 'react';
import { Check, Leaf } from 'lucide-react';
import type { NutrientMemoryConfig } from '../../data/cooking/nutrients';
import { createNutrientDeck, hideMismatchedCards, memoryComplete, revealNutrientCard, type MemoryState } from '../../data/cooking/nutrientMemory';
import { memoryBoardIds } from '../../services/memoryBoards';

export default function NutrientMemory({ config, onComplete }: { config: NutrientMemoryConfig; onComplete: () => void }) {
  const [deck] = useState(() => createNutrientDeck(config));
  const [state, setState] = useState<MemoryState>({ openIds: [], matchedIds: [] });
  const announced = useRef(false);
  const done = memoryComplete(state, deck);
  const pairIds = [...new Set<string>(deck.map(card => card.nutrientId))];
  const activeIds = new Set(memoryBoardIds(pairIds, state.matchedIds.length / 2, 3));
  useEffect(() => {
    if (state.openIds.length !== 2) return;
    const timer = window.setTimeout(() => setState(hideMismatchedCards), 1600);
    return () => window.clearTimeout(timer);
  }, [state.openIds]);
  useEffect(() => {
    if (done && !announced.current) { announced.current = true; onComplete(); }
  }, [done, onComplete]);
  if (!deck.length) return <p role="alert">Deze memory heeft nog niet genoeg geldige voedingsstoffen.</p>;
  return <section aria-label="Voedingsstoffenmemory" className="nutrient-memory">
    <p className="nutrient-memory__score" role="status">{state.matchedIds.length / 2} van {config.pairCount ?? 4} paren{state.openIds.length === 2 ? ' · Deze horen niet bij elkaar. Probeer opnieuw.' : state.matchedIds.length ? ' · Goed gevonden!' : ''}</p>
    <div className="nutrient-memory__grid">
      {deck.filter(card => activeIds.has(card.nutrientId)).map((card, index) => {
        const matched = state.matchedIds.includes(card.id);
        const revealed = matched || state.openIds.includes(card.id);
        return <button key={card.id} type="button" className={`nutrient-memory__card${revealed ? ' is-revealed' : ''}${matched ? ' is-matched' : ''}`} aria-label={revealed ? card.text : `Kaart ${index + 1} omdraaien`} aria-pressed={revealed} disabled={matched || (!revealed && state.openIds.length === 2)} onClick={() => setState(current => revealNutrientCard(current, deck, card.id))}>
          {revealed ? <><small>{card.kind === 'nutrient' ? 'Voedingsstof' : 'Functie'}</small>{card.iconAsset && <img src={card.iconAsset} alt="" onError={event => { event.currentTarget.hidden = true; }} />}<span>{card.text}</span>{matched && <Check aria-hidden="true" />}</> : <Leaf aria-hidden="true" />}
        </button>;
      })}
    </div>
  </section>;
}
