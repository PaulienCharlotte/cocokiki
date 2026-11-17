import React, { useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from '../design-system';
import ContinentMap from '../components/geography/ContinentMap';
import LocationMemoryGame from '../components/LocationMemoryGame';
import { FLAG_CONTINENTS, FLAG_MEMORY_PAIRS, nextFlagRound, type FlagContinent } from '../data/flagCatalog';
import type { MemoryPair } from '../data/learning';
import { PROGRESS_KEY, readProgress, recordAnswer, writeLocal } from '../services/localProgress';
import { awardCurrencyOnce } from '../services/currency';
import { analytics } from '../services/analytics';
import '../components/dreamworld/wereld-scherm.css';
import './flags-memory.css';

export { FLAG_MEMORY_PAIRS } from '../data/flagCatalog';

export default function FlagsMemory({ onBack }: { onBack: () => void }) {
  const [continent, setContinent] = useState<FlagContinent | null>(null);
  const [pairs, setPairs] = useState<MemoryPair[]>([]);
  const [round, setRound] = useState(0);
  const [roundId, setRoundId] = useState(() => crypto.randomUUID());
  const answer = useCallback((id: string, correct: boolean, points: number) => {
    writeLocal(PROGRESS_KEY, recordAnswer(readProgress(), id, correct));
    awardCurrencyOnce(`flags-memory:${roundId}:${id}`, points);
  }, [roundId]);
  const start = (next: MemoryPair[]) => {
    analytics().start('flags-memory', true);
    setPairs(next); setRound(value => value + 1); setRoundId(crypto.randomUUID());
  };
  const choose = (id: FlagContinent) => { setContinent(id); start(nextFlagRound(id, readProgress())); };
  // In de huisstijl: Sebs ontdekkingskamer is de wereld. Het keuzescherm is
  // een aanklikbare continentenkaart; het spel speelt in
  // dezelfde kamer met de vaste zones.
  const kamer = <img className="world-location__background" src="/dreamworld/topo-interior.webp" alt="" />;
  if (!continent) return <main className="ck-scherm wereld-scherm dream-flags-memory flags-map-screen" data-wereld="wereld" aria-label="Vlaggenmemory">
    {kamer}
    <div className="ck-houtbord wereld-naambord" aria-hidden="true">Vlaggenmemory</div>
    <section className="flag-continents" aria-labelledby="flag-continents-title">
      <h1 id="flag-continents-title" className="sr-only">Vlaggenmemory</h1>
      <ContinentMap onChoose={choose} />
    </section>
  </main>;
  const deel = FLAG_CONTINENTS.find(item => item.id === continent)?.label;
  return <main className="ck-scherm flags-spel dream-flags-memory" data-wereld="wereld" aria-label="Vlaggenmemory">
    {kamer}
    <React.Fragment key={round}><LocationMemoryGame analyticsId="flags-memory" mode="memory" pairs={pairs} choicePool={FLAG_MEMORY_PAIRS} onAnswer={answer}
      gids="seb"
      // Het werelddeel staat in het statuseiland; tik erop om een ander te kiezen.
      statusExtra={<IconButton label="Terug naar de werelddelen" className="flags-spel__deel" icon={<><ArrowLeft size={22} /></>} onClick={() => setContinent(null)} />}
      onContinue={() => start(nextFlagRound(continent, readProgress()))}
      onRepeat={() => start(pairs)} onRetry={ids => start(pairs.filter(pair => ids.includes(pair.id)))} onExit={() => setContinent(null)} /></React.Fragment>
  </main>;
}
