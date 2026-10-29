import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lightbulb, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import { COUNTRY_FLAGS } from '../../data/flags';
import AnalogClock from './AnalogClock';
import { ClockCompletion } from './ClockControls';
import { cityTime, correctWorldTime, createWorldTimeQuestion, relativeDayText, timeDifferenceText, WORLD_CITIES, WORLD_LEVEL_LABELS, worldTimeHint } from './worldTimeEngine';
import type { ClockLevel } from './types';
import './world-times.css';

interface Props { initialLevel: ClockLevel; completedLevels: ClockLevel[]; onBack: () => void; onComplete: (level: ClockLevel, roundId: string) => number }

function WorldClock() {
  const [base, setBase] = useState(Date.now);
  const [offset, setOffset] = useState(0);
  const [cities, setCities] = useState(['amsterdam', 'new-york', 'tokyo']);
  useEffect(() => {
    if (offset !== 0) return;
    const timer = window.setInterval(() => setBase(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [offset]);
  const instant = base + offset * 3600000;
  const reference = cityTime(instant, WORLD_CITIES.find(city => city.id === cities[0])!);
  const shift = (value: number) => { const next = Math.max(-24, Math.min(24, value)); if (next === 0) setBase(Date.now()); setOffset(next); };
  return <section aria-label="Interactieve wereldklok">
    <div className="world-times__clocks">{cities.map((id, index) => {
      const city = WORLD_CITIES.find(item => item.id === id)!;
      const time = cityTime(instant, city);
      return <div className="world-times__city" key={index}>
        <label><span className="sr-only">Stad {index + 1}</span><select aria-label={`Stad ${index + 1}`} value={id} onChange={event => setCities(current => current.map((value, slot) => slot === index ? event.target.value : value))}>{WORLD_CITIES.map(item => <option key={item.id} value={item.id} disabled={cities.includes(item.id) && item.id !== id}>{item.name}</option>)}</select></label>
        <span className="world-times__flag" aria-hidden="true">{COUNTRY_FLAGS[city.country]}</span>
        <AnalogClock time={time} color={(['wood', 'green', 'blue'] as const)[index]} />
        <strong className="world-times__digital">{time.digital}</strong>
        <span>{time.date}</span><small>{index ? `${time.offset === reference.offset ? 'Dezelfde tijd als' : `${timeDifferenceText(time.offset - reference.offset)} dan`} ${WORLD_CITIES.find(item => item.id === cities[0])!.name}` : city.country}</small>
      </div>;
    })}</div>
    <div className="world-times__travel">
      <IconButton label="Een uur terug" icon={<Minus size={20} />} disabled={offset <= -24} onClick={() => shift(offset - 1)} />
      <label>Reistijd <output>{offset === 0 ? 'Nu' : timeDifferenceText(offset * 60)}</output><input aria-label="Reistijd verschuiven" aria-valuetext={offset === 0 ? 'Nu' : timeDifferenceText(offset * 60)} type="range" min={-24} max={24} step={.25} value={offset} onChange={event => shift(Number(event.target.value))} /></label>
      <IconButton label="Een uur vooruit" icon={<Plus size={20} />} disabled={offset >= 24} onClick={() => shift(offset + 1)} />
      <Button variant="quiet" size="small" startIcon={<RotateCcw size={18} />} onClick={() => { setBase(Date.now()); setOffset(0); }}>Nu</Button>
    </div>
  </section>;
}

export default function WorldTimes({ initialLevel, completedLevels, onBack, onComplete }: Props) {
  const [mode, setMode] = useState<'clock' | 'practice'>('clock');
  const [level, setLevel] = useState(initialLevel);
  const [question, setQuestion] = useState(() => createWorldTimeQuestion(initialLevel, 0));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [day, setDay] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hint, setHint] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const roundId = useRef(crypto.randomUUID()), answered = useRef(false), advancing = useRef(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (mode === 'practice') questionHeading.current?.focus(); }, [question, mode]);
  const reset = (nextLevel = level) => {
    setLevel(nextLevel); setQuestion(createWorldTimeQuestion(nextLevel, 0)); setIndex(0);
    setAnswer(''); setDay(0); setFeedback(null); setHint(false); setReward(null);
    roundId.current = crypto.randomUUID(); answered.current = false; advancing.current = false;
  };
  const source = cityTime(question.instant, question.from), target = cityTime(question.instant, question.to);
  const next = () => {
    if (!answered.current || advancing.current) return;
    advancing.current = true;
    if (index === 4) { setReward(onComplete(level, roundId.current)); return; }
    setIndex(value => value + 1); setQuestion(createWorldTimeQuestion(level, index + 1));
    setAnswer(''); setDay(0); setFeedback(null); setHint(false); answered.current = false; advancing.current = false;
  };
  return <main className="clock-game world-times" aria-labelledby="world-times-title">
    <header className="world-times__header"><Button variant="quiet" size="small" startIcon={<ArrowLeft size={18} />} onClick={onBack}>Spellen</Button><h1 id="world-times-title">Wereldtijden</h1></header>
    <div className="world-times__modes" role="group" aria-label="Wereldtijden kiezen">
      <Button variant={mode === 'clock' ? 'secondary' : 'quiet'} aria-pressed={mode === 'clock'} onClick={() => setMode('clock')}>Wereldklok</Button>
      <Button variant={mode === 'practice' ? 'secondary' : 'quiet'} aria-pressed={mode === 'practice'} onClick={() => setMode('practice')}>Oefenen</Button>
    </div>
    {mode === 'clock' ? <WorldClock /> : <section className="world-times__practice" aria-label="Tijdverschillen oefenen">
      <label className="world-times__level">Niveau<select aria-label="Wereldtijden niveau" value={level} onChange={event => reset(Number(event.target.value) as ClockLevel)}>{([1,2,3,4,5] as ClockLevel[]).map(value => <option key={value} value={value}>{value} · {WORLD_LEVEL_LABELS[value]}{completedLevels.includes(value) ? ' ✓' : ''}</option>)}</select></label>
      <progress value={index + Number(feedback === 'correct')} max={5} aria-label="Opgeloste wereldtijden" />
      <div className="world-times__journey"><div><strong>{COUNTRY_FLAGS[question.from.country]} {question.from.name}</strong><AnalogClock time={source} color="green" /><b className="world-times__digital">{source.digital}</b><small>{source.date}</small></div><ArrowRight size={24} aria-hidden="true" /><div><span className="world-times__flag" aria-hidden="true">{COUNTRY_FLAGS[question.to.country]}</span><h2 ref={questionHeading} tabIndex={-1}>Hoe laat is het in {question.to.name}?</h2><p>{target.offset === source.offset ? 'Dezelfde tijd als' : `${timeDifferenceText(target.offset - source.offset)} dan`} {question.from.name}.</p></div></div>
      <form className="world-times__answer" onSubmit={event => {
        event.preventDefault(); if (!answer || answered.current) return;
        if (correctWorldTime(question, answer, day)) { answered.current = true; setFeedback('correct'); }
        else { setFeedback('wrong'); setHint(true); }
      }}>
        <label>Tijd in {question.to.name}<input type="time" aria-label={`Tijd in ${question.to.name}`} required value={answer} disabled={answered.current} onInput={event => { setAnswer(event.currentTarget.value); setFeedback(null); }} onChange={event => { setAnswer(event.target.value); setFeedback(null); }} /></label>
        <label>Welke dag?<select aria-label="Welke dag?" value={day} disabled={answered.current} onChange={event => { setDay(Number(event.target.value)); setFeedback(null); }}>{[-1,0,1].map(value => <option key={value} value={value}>{relativeDayText(value)}</option>)}</select></label>
        {feedback === 'correct' ? <Button type="button" endIcon={<ArrowRight size={18} />} onClick={next}>{index === 4 ? 'Ronde afronden' : 'Volgende plek'}</Button> : <Button type="submit" disabled={!answer} startIcon={<Check size={18} />}>Controleer</Button>}
      </form>
      <div role="status" className="world-times__feedback">{feedback === 'correct' ? `Goed! In ${question.to.name} is het ${target.digital}. ${relativeDayText(target.day - source.day)}.` : feedback === 'wrong' ? 'Nog niet helemaal. Gebruik de tip en probeer het nog eens.' : ''}</div>
      <Button variant="quiet" size="small" startIcon={<Lightbulb size={18} />} aria-expanded={hint} onClick={() => setHint(value => !value)}>Tip</Button>
      {hint && <p className="world-times__hint">{worldTimeHint(question)}</p>}
      {reward !== null && <ClockCompletion reward={reward} onReplay={() => reset()} onHub={onBack} />}
    </section>}
  </main>;
}
