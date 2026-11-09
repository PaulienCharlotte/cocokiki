import React, { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '../design-system';
import NutrientMemory from '../components/cooking/NutrientMemory';
import { NUTRIENTS, type NutrientMemoryConfig } from '../data/cooking/nutrients';
import '../components/dreamworld/world-location.css';

export const STANDALONE_NUTRIENT_MEMORY: NutrientMemoryConfig = {
  enabled: true, activityId: 'nutrient-memory', nutrientIds: NUTRIENTS.map(nutrient => nutrient.id), pairCount: 6,
};
export default function NutrientMemoryScreen({ onBack }: { onBack: () => void }) {
  const [round, setRound] = useState(0), [done, setDone] = useState(false);
  return <main className="standalone-nutrients" aria-labelledby="nutrient-title"><section>
    <div className="standalone-nutrients__heading"><Button variant="quiet" size="small" startIcon={<ArrowLeft size={18} />} onClick={onBack}>Terug</Button><h1 id="nutrient-title">Voedingsstoffenmemory</h1></div>
    <React.Fragment key={round}><NutrientMemory config={STANDALONE_NUTRIENT_MEMORY} onComplete={() => setDone(true)} /></React.Fragment>
    {done && <div className="standalone-nutrients__result"><p role="status">Alle paren gevonden!</p><Button startIcon={<RotateCcw size={18} />} onClick={() => { setDone(false); setRound(value => value + 1); }}>Nog een keer</Button></div>}
  </section></main>;
}
