import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import MathHub from './MathHub';
import { MathHeader } from './MathControls';
import { resultStatus } from './engine';
import MathSession from './MathSession';
import RaceGame from './RaceGame';
import RedactieBladen from './RedactieBladen';
import { BLADEN } from './redactie/bladen';
import { laadBladen, wisBlad } from './redactie/bladVoortgang';
import { finishMathLevel, levelUnlocked, loadMathProgress, nextMathLevel, subscribeMathProgress } from './progress';
import type { MathGameId, MathLevel, MathResult } from './types';
import './math.css';
import './flashcard.css';
import { mathEnvironments } from './assets';
import { useMathSound } from './useMathSound';
import { CURRENCY_CHANGE_EVENT, loadCurrency } from '../../services/currency';
import { analytics } from '../../services/analytics';
const BabyLua = lazy(() => import('../red-baby-lua/RedBabyLuaGame'));

export default function MathModule({ onBack = () => undefined, onHome = onBack, initialGame }: { onBack?: () => void; onHome?: () => void; initialGame?: MathGameId }) {
  const [progress, setProgress] = useState(loadMathProgress);
  const [game, setGame] = useState<MathGameId | null>(initialGame ?? null);
  const [level, setLevel] = useState<MathLevel>(() => initialGame ? nextMathLevel(loadMathProgress(), initialGame) : 1);
  const [attempt, setAttempt] = useState(0);
  // Bij de redactiesommen kies je eerst een huiswerkblad of vrij oefenen.
  const [blad, setBlad] = useState<number | 'vrij' | null>(null);
  const huiswerk = game === 'add-subtract' && typeof blad === 'number' ? BLADEN.find(b => b.nr === blad) : undefined;
  const kiezen = game === 'add-subtract' && blad === null;
  const [outcome, setOutcome] = useState<{ result: MathResult; reward: number; saved: boolean } | null>(null);
  const [coins, setCoins] = useState(loadCurrency);
  const { sound, toggleSound, play } = useMathSound();
  useEffect(() => {
    const sync = () => setCoins(loadCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener(CURRENCY_CHANGE_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => subscribeMathProgress(() => setProgress(loadMathProgress())), []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [game, level, attempt]);
  const finish = useCallback((result: MathResult) => {
    if (!game) return;
    // Een huiswerkblad telt niet mee voor de niveaus: het staat los van de
    // oefenrondes. De stand per blad bewaart de sessie zelf.
    if (huiswerk) { setOutcome({ result, reward: 0, saved: true }); return; }
    const saved = finishMathLevel(game, level, result);
    setProgress(saved.progress); setOutcome({ result, reward: saved.reward, saved: saved.ok });
  }, [game, level, huiswerk]);
  const start = (id: MathGameId, nextLevel: MathLevel) => {
    if (!levelUnlocked(loadMathProgress(), id, nextLevel)) return;
    if (id !== 'race' && id !== 'multiply' && id !== 'maten') analytics().start(`math:${id}`, true);
    setGame(id); setLevel(nextLevel); setAttempt(value => value + 1); setOutcome(null);
    if (id !== game) setBlad(null);
  };
  const kiesBlad = (nr: number) => {
    // Een blad dat af is, begin je opnieuw; anders ga je verder waar je was.
    const klaar = BLADEN.find(b => b.nr === nr);
    if (klaar && Object.keys(laadBladen()[nr] ?? {}).length >= klaar.sommen.length) wisBlad(nr);
    setBlad(nr); setAttempt(value => value + 1); setOutcome(null);
  };
  const [vraag, setVraag] = useState('');
  const hub = () => {
    if (game === 'add-subtract' && blad !== null) { setBlad(null); setOutcome(null); return; }
    if (initialGame) { onBack(); return; }
    setGame(null); setOutcome(null);
  };
  const controls = <MathHeader game={game} level={level} zonderNiveau={game === 'add-subtract' && blad !== 'vrij'} vraag={vraag} progress={progress} coins={coins} sound={sound} onSound={toggleSound} onHome={onHome} onBack={game ? hub : onBack} onLevel={nextLevel => { if (game) start(game, nextLevel); }} />;
  return <div className={`math-module${game ? ` math-adventure math-adventure--${game}` : ''}`} style={game ? { backgroundImage: `linear-gradient(#26382a18, #26382a24), url('${mathEnvironments[game]}')` } : undefined}>
    {/* De oude menubalk staat alleen nog op het spellenmenu; de spellen zelf hebben de zones uit de huisstijl. */}
    {!game && controls}
    {!game ? <MathHub progress={progress} onPlay={id => start(id, nextMathLevel(progress, id))} /> : <main className="math-game">
    {kiezen ? <RedactieBladen onBlad={kiesBlad} onVrij={() => setBlad('vrij')} /> : <React.Fragment key={`${game}:${level}:${blad}:${attempt}`}>{game === 'race' ? <RaceGame level={level} onFinish={finish} onSound={play} sound={sound} onToggleSound={toggleSound} onLevel={nextLevel => start('race', nextLevel)}
      einde={outcome ? { reward: outcome.reward, saved: outcome.saved, onRetrySave: () => finish(outcome.result), onReplay: () => start('race', level), onNext: () => start('race', (level + 1) as MathLevel) } : undefined} /> : game === 'multiply' ? <div className="math-lua"><Suspense fallback={<p role="status">Lua komt eraan…</p>}><BabyLua onHome={hub} mathAdventure={{ level, onComplete: finish, sound }} onLevel={nextLevel => start('multiply', nextLevel)}
      einde={outcome ? { reward: outcome.reward, saved: outcome.saved, passed: resultStatus('multiply', level, outcome.result).passed, onRetrySave: () => finish(outcome.result), onReplay: () => start('multiply', level), onNext: () => start('multiply', (level + 1) as MathLevel) } : undefined} /></Suspense></div> : <MathSession game={game} level={level} blad={huiswerk} onFinish={finish} onSound={play} onVraag={setVraag} sound={sound} onToggleSound={toggleSound} onLevel={nextLevel => start(game, nextLevel)}
      einde={outcome ? { result: outcome.result, reward: outcome.reward, saved: outcome.saved, onRetrySave: () => finish(outcome.result), onReplay: () => { if (huiswerk) kiesBlad(huiswerk.nr); else start(game, level); }, onNext: () => start(game, (level + 1) as MathLevel), onBack: hub } : undefined} />}</React.Fragment>}
    {/* Winkelgekte sluit af in de winkel zelf, zonder wit venster ertussen. */}
  </main>}</div>;
}
