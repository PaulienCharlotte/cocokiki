import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import MathHub from './MathHub';
import { MathCompletion, MathHeader } from './MathControls';
import MathSession from './MathSession';
import RaceGame from './RaceGame';
import { finishMathLevel, levelUnlocked, loadMathProgress, nextMathLevel, subscribeMathProgress } from './progress';
import type { MathGameId, MathLevel, MathResult } from './types';
import './math.css';
import './flashcard.css';
import { mathEnvironments } from './assets';
import { useMathSound } from './useMathSound';
import { CURRENCY_CHANGE_EVENT, loadCurrency } from '../../services/currency';
const BabyLua = lazy(() => import('../red-baby-lua/RedBabyLuaGame'));

export default function MathModule({ onBack = () => undefined, onHome = onBack, initialGame }: { onBack?: () => void; onHome?: () => void; initialGame?: MathGameId }) {
  const [progress, setProgress] = useState(loadMathProgress);
  const [game, setGame] = useState<MathGameId | null>(initialGame ?? null);
  const [level, setLevel] = useState<MathLevel>(() => initialGame ? nextMathLevel(loadMathProgress(), initialGame) : 1);
  const [attempt, setAttempt] = useState(0);
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
    const saved = finishMathLevel(game, level, result);
    setProgress(saved.progress); setOutcome({ result, reward: saved.reward, saved: saved.ok });
  }, [game, level]);
  const start = (id: MathGameId, nextLevel: MathLevel) => {
    if (!levelUnlocked(loadMathProgress(), id, nextLevel)) return;
    setGame(id); setLevel(nextLevel); setAttempt(value => value + 1); setOutcome(null);
  };
  const hub = () => { if (initialGame) { onBack(); return; } setGame(null); setOutcome(null); };
  const controls = <MathHeader game={game} level={level} progress={progress} coins={coins} sound={sound} onSound={toggleSound} onHome={onHome} onBack={game ? hub : onBack} onLevel={nextLevel => { if (game) start(game, nextLevel); }} />;
  return <div className={`math-module${game ? ` math-adventure math-adventure--${game}` : ''}`} style={game ? { backgroundImage: `linear-gradient(#26382a18, #26382a24), url('${mathEnvironments[game]}')` } : undefined}>
    {game !== 'multiply' && controls}
    {!game ? <MathHub progress={progress} onPlay={id => start(id, nextMathLevel(progress, id))} /> : <main className="math-game">
    <React.Fragment key={`${game}:${level}:${attempt}`}>{game === 'race' ? <RaceGame level={level} onFinish={finish} onSound={play} /> : game === 'multiply' ? <div className="math-lua"><Suspense fallback={<p role="status">Lua komt eraan…</p>}><BabyLua onHome={hub} setupControls={controls} mathAdventure={{ level, onComplete: finish, sound }} /></Suspense></div> : <MathSession game={game} level={level} onFinish={finish} onSound={play} />}</React.Fragment>
    {outcome && <MathCompletion game={game} level={level} result={outcome.result} reward={outcome.reward} saved={outcome.saved} onRetrySave={() => finish(outcome.result)} onReplay={() => start(game, level)} onNext={() => start(game, (level + 1) as MathLevel)} onBack={hub} />}
  </main>}</div>;
}
