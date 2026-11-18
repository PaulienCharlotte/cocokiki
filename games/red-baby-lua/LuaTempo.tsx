import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import CocoCoin from '../../components/platform/CocoCoin';
import { awardCurrencyOnce } from '../../services/currency';
import { learningReward } from '../../services/learningReward';
import type { TableChoice } from './game/types';
import { MAX_TAFEL, TEMPO_DURATION_MS, tempoAnswer, tempoQuestion, type TempoSoort } from './tempo';
import './lua-tempo.css';

/**
 * De tempotoets. Met `direct` begint de minuut meteen: soort en tafels zijn
 * dan al gekozen op het startscherm van Baby Lua.
 */
export default function LuaTempo({ table, onClose, soort: beginSoort = 'keer', direct = false }: { table: TableChoice; onClose: () => void; soort?: TempoSoort; direct?: boolean }) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  // Zelf kiezen: keer, delen of door elkaar, en welke tafels (tot 20).
  const [soort, setSoort] = useState<TempoSoort>(beginSoort);
  const [tafels, setTafels] = useState<number[]>(() => table === 'mix' ? Array.from({ length: 10 }, (_, i) => i + 1) : Array.isArray(table) ? table : [table]);
  const kies = (t: number) => setTafels(lijst => lijst.includes(t) ? lijst.filter(x => x !== t) : [...lijst, t].sort((x, y) => x - y));
  const [question, setQuestion] = useState(() => tempoQuestion(table));
  const [answer, setAnswer] = useState('');
  const [remaining, setRemaining] = useState(60);
  const [scores, setScores] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [notice, setNotice] = useState('');
  const [paid, setPaid] = useState<number | null>(null);
  const scoreRef = useRef(scores), deadline = useRef(0), ended = useRef(true), transaction = useRef('');
  const input = useRef<HTMLInputElement>(null);
  const pay = useCallback(() => {
    const reward = learningReward(scoreRef.current.correct);
    if (!reward) { setPaid(0); return; }
    const result = awardCurrencyOnce(transaction.current, reward);
    if (result.applied) setPaid(reward);
  }, []);
  const finish = useCallback(() => {
    if (ended.current) return;
    ended.current = true; setPhase('done'); setRemaining(0); pay();
  }, [pay]);
  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = () => { setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))); if (Date.now() >= deadline.current) finish(); };
    const timer = window.setInterval(tick, 100); return () => window.clearInterval(timer);
  }, [phase, finish]);
  useEffect(() => { if (phase === 'playing') input.current?.focus(); }, [phase, question]);
  const start = () => {
    const empty = { correct: 0, wrong: 0, skipped: 0 }; scoreRef.current = empty; setScores(empty); setPaid(null); setNotice('');
    transaction.current = `lua:tempo:${crypto.randomUUID()}`; deadline.current = Date.now() + TEMPO_DURATION_MS; ended.current = false;
    setQuestion(tempoQuestion(tafels, Math.random, undefined, soort)); setAnswer(''); setRemaining(60); setPhase('playing');
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (direct) start(); }, []);
  const advance = (kind: 'correct' | 'wrong' | 'skipped') => {
    if (ended.current) return;
    if (Date.now() >= deadline.current) { finish(); return; }
    const next = { ...scoreRef.current, [kind]: scoreRef.current[kind] + 1 }; scoreRef.current = next; setScores(next);
    setNotice(kind === 'correct' ? 'Goed!' : kind === 'wrong' ? `Het was ${question.answer}.` : 'Overgeslagen.');
    setQuestion(tempoQuestion(tafels, Math.random, question, soort)); setAnswer('');
  };
  return <section className="lua-tempo" aria-labelledby="tempo-title">
    <header className="lua-tempo__header ck-glas"><IconButton label="Terug naar Baby Lua" icon={<ArrowLeft />} onClick={onClose} /><h1 id="tempo-title">Lua’s tempotoets</h1><strong aria-label={`${remaining} seconden over`}>{remaining}s</strong></header>
    <div className="lua-tempo__paper">
      {phase === 'ready' ? <><h2>Eén minuut rekenen!</h2>
          <div className="lua-tempo__keuze" role="radiogroup" aria-label="Wat wil je oefenen?">
            {([['keer', 'Keer ×'], ['delen', 'Delen :'], ['mix', 'Door elkaar']] as const).map(([id, naam]) => <button key={id} type="button" role="radio" aria-checked={soort === id} className={soort === id ? 'is-gekozen' : undefined} onClick={() => setSoort(id)}>{naam}</button>)}
          </div>
          <p className="lua-tempo__vraag">Welke tafels?</p>
          <div className="lua-tempo__tafels" role="group" aria-label="Tafels">
            {Array.from({ length: MAX_TAFEL }, (_, i) => i + 1).map(t => <button key={t} type="button" aria-pressed={tafels.includes(t)} className={tafels.includes(t) ? 'is-gekozen' : undefined} onClick={() => kies(t)}>{t}</button>)}
          </div>
          <Button size="large" startIcon={<Play />} onClick={start} disabled={tafels.length === 0}>Start de minuut</Button></>
        : phase === 'done' ? <><h2>Tijd! Goed geoefend.</h2><p><strong>{scores.correct}</strong> goed · {scores.wrong} fout · {scores.skipped} overgeslagen</p><p><CocoCoin /> {paid === null ? 'Je beloning is nog niet opgeslagen.' : `${paid} CocoCoins verdiend`}</p>{paid === null && <Button onClick={pay}>Beloning opslaan</Button>}<Button startIcon={<RotateCcw />} onClick={start}>Nog een minuut</Button><Button variant="quiet" onClick={onClose}>Terug naar Lua</Button></>
        : <><p className="lua-tempo__score">{scores.correct} goed</p><progress max={60} value={remaining} aria-label="Tijd over" />
          <form onSubmit={event => { event.preventDefault(); const result = tempoAnswer(question, answer, Date.now(), deadline.current); if (result === 'expired') finish(); else if (result !== 'empty') advance(result); }}>
            <label className="lua-tempo__sum" htmlFor="tempo-answer">{question.links} {question.teken === '÷' ? ':' : '×'} {question.rechts} =</label>
            <input id="tempo-answer" ref={input} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" aria-label="Jouw antwoord" value={answer} onChange={event => setAnswer(event.target.value.replace(/\D/g, '').slice(0, 3))} />
            <Button type="submit" disabled={!answer}>Antwoord</Button>
            <Button variant="quiet" startIcon={<SkipForward />} onClick={() => advance('skipped')}>Som overslaan</Button>
          </form><p className="lua-tempo__notice" role="status">{notice || 'Veel plezier!'}</p></>}
    </div>
  </section>;
}
