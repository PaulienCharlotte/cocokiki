import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Eye, Lightbulb, Timer } from 'lucide-react';
import { Location } from '../types';
import { locationProgressKey } from '../data/learning';
import { locationFact } from '../data/topography/facts';
import InteractiveMap from './InteractiveMap';
import SpeechBubble from './ui/SpeechBubble';
import RoundResult from './RoundResult';
import { learningReward } from '../services/learningReward';
import { useActivityAnalytics } from '../services/useActivityAnalytics';

interface Props {
  mode: 'find' | 'spell' | 'master';
  areaId: string;
  locations: Location[];
  mapLocations: Location[];
  timerEnabled: boolean;
  onAnswer: (id: string, correct: boolean, points: number) => void;
  onContinue: () => void;
  onRepeat: () => void;
  onRetry: (ids: string[]) => void;
  onExit: () => void;
}
const normalize = (value: string) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").toLocaleLowerCase('nl').replace(/\s+/g, ' ');

export default function GameEngine({ mode, areaId, locations, mapLocations, timerEnabled, onAnswer, onContinue, onRepeat, onRetry, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<'find' | 'spell'>(mode === 'spell' ? 'spell' : 'find');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [detour, setDetour] = useState<Location | null>(null);
  const [factDismissed, setFactDismissed] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [hint, setHint] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [seconds, setSeconds] = useState(15);
  const locked = useRef(false);
  const hadError = useRef(false);
  const answerRevealed = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const target = locations[index];
  useActivityAnalytics(`topo:${mode}`, 0, !target);

  useEffect(() => { heading.current?.focus(); }, [index, step]);
  const finish = (success: boolean, message: string) => {
    if (locked.current || !target) return;
    locked.current = true;
    const clean = success && !hadError.current && !hint;
    onAnswer(locationProgressKey(target), clean, learningReward(Number(success), answerRevealed.current));
    if (clean) setCorrect(c => c + 1);
    else setWrongIds(ids => [...ids, target.id]);
    setResolved(true); setReveal(true); setFactDismissed(false); setFeedback(message);
  };

  useEffect(() => {
    if (!timerEnabled || resolved || !target) return;
    const timeout = window.setTimeout(() => {
      if (seconds <= 1) finish(false, 'Tijd voorbij. Dit is ' + target.name + '.');
      else setSeconds(value => value - 1);
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [seconds, resolved, target, timerEnabled, step]);

  const check = (value: string) => {
    if (!target || locked.current) return;
    if (value === target.id) {
      setDetour(null);
      setFactDismissed(false);
      if (mode === 'master' && step === 'find') {
        setStep('spell'); setSeconds(15); setFeedback('Goed gevonden! Nu nog de naam.'); setReveal(false);
      } else finish(true, ['Goed gevonden!', 'Mooie reis!', 'Daar is hij!'][index % 3] + ' Dit is ' + target.name + '.');
    } else {
      hadError.current = true;
      const clicked = mapLocations.find(l => l.id === value);
      const direction = clicked ? (Math.abs(target.lat - clicked.lat) > Math.abs(target.lng - clicked.lng)
        ? target.lat > clicked.lat ? 'noordelijker' : 'zuidelijker'
        : target.lng > clicked.lng ? 'oostelijker' : 'westelijker') : '';
      setFeedback(clicked
        ? 'Nee, dit is ' + clicked.name + '. ' + target.name + ' ligt iets ' + direction + '.'
        : 'Nog niet. Probeer de naam nog eens.');
      setDetour(clicked ?? null);
      setFactDismissed(false);
    }
  };
  const next = () => {
    setIndex(i => i + 1); setStep(mode === 'spell' ? 'spell' : 'find'); setAnswer('');
    setResolved(false); setHint(false); setReveal(false); setFeedback(''); setDetour(null); setFactDismissed(false); setSeconds(15);
    locked.current = false; hadError.current = false; answerRevealed.current = false;
  };
  useEffect(() => {
    if (mode !== 'find' || !resolved) return;
    const timeout = window.setTimeout(next, 1400);
    return () => window.clearTimeout(timeout);
  }, [index, mode, resolved]);
  if (!target) return <RoundResult total={locations.length} correct={correct} onContinue={onContinue} onRepeat={onRepeat} onExit={onExit} onRetry={wrongIds.length ? () => onRetry(wrongIds) : undefined} />;
  const fact = locationFact(target).fact;
  const detourFact = detour ? locationFact(detour).fact : undefined;
  const visibleFact = mode !== 'find' && !factDismissed
    ? resolved && fact
      ? { name: target.name, text: fact, kind: 'success' as const }
      : detour && detourFact
        ? { name: detour.name, text: detourFact, kind: 'detour' as const }
        : null
    : null;

  // Briefing 19 nov: kaart als speelveld, Seb stelt de vraag in zijn wolk linksonder,
  // voortgang als bolletjes, hint en "toon antwoord" in de gereedschapsbalk links.
  const vraag = step === 'find' ? 'Waar ligt ' + (target.type === 'province' ? 'de provincie ' : target.type === 'country' ? 'het land ' : '') + target.name + '?' : 'Hoe heet de gemarkeerde plek?';
  const hintTekst = step === 'spell' ? 'De naam begint met ' + target.name.slice(0, 2) + '. (' + target.name.length + ' tekens)' : 'Ik wijs de plek aan op de kaart. Deze plek oefen je zonder munten.';
  const wolk = visibleFact ? `${visibleFact.name}: ${visibleFact.text}`
    : feedback ? feedback
    : hint && !resolved ? hintTekst
    : vraag;
  return <div className="practice-layout topo-speelveld">
    <div className="practice-map">
      <InteractiveMap selectedProvince={areaId} locations={mapLocations} activeGameLocation={target.id} gameMode={step === 'spell' ? 'spell' : 'find'} showLabels={false} isRevealed={reveal} revealAnswer={resolved} onLocationClick={loc => { if (step === 'find') check(loc.id); }} />
    </div>
    <div className="topo-stippen ck-glas" role="img" aria-label={`Plek ${index + 1} van ${locations.length}`}>
      {locations.map((item, i) => <span key={item.id} className={`ck-stip${i < index + Number(resolved) ? ' ck-stip--klaar' : ''}${i === index && !resolved ? ' ck-stip--nu' : ''}`} />)}
      {timerEnabled && <span className={seconds <= 5 ? 'timer urgent' : 'timer'}><Timer size={16} />{seconds} s</span>}
    </div>
    {!resolved && <nav className="ck-zone-gereedschap ck-glas topo-gereedschap" aria-label="Gereedschap">
      <button type="button" className={`ck-gereedschap${hint ? ' is-aan' : ''}`} aria-label="Hint van Seb" title="Hint van Seb" disabled={hint} onClick={() => { setHint(true); hadError.current = true; if (step === 'find') { answerRevealed.current = true; setReveal(true); } }}><Lightbulb size={22} /></button>
      <button type="button" className="ck-gereedschap" aria-label="Toon het antwoord" title="Toon het antwoord" onClick={() => finish(false, 'Dit is ' + target.name + '.')}><Eye size={22} /></button>
    </nav>}
    {step === 'spell' && !resolved && <form onSubmit={e => { e.preventDefault(); if (answer.trim()) check(normalize(answer) === normalize(target.name) ? target.id : 'wrong'); }} className="answer-form topo-invul ck-glas">
      <input aria-label="Naam van de plek" placeholder="Naam van de plek" value={answer} onChange={e => setAnswer(e.target.value)} disabled={resolved} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
      <button type="submit" className="ck-knop ck-knop--hoofd" aria-label="Antwoord controleren" disabled={!answer.trim()}><Check size={20} /></button>
    </form>}
    <h2 ref={heading} tabIndex={-1} className="sr-only">{vraag}</h2>
    <SpeechBubble vast character="seb" tone={resolved && !feedback.startsWith('Dit is') ? 'goed' : 'default'}>
      {wolk}
      {resolved && mode !== 'find' && <button type="button" className="ck-knop ck-knop--hoofd topo-volgende" onClick={next}>{index + 1 === locations.length ? 'Bekijk de route' : 'Volgende plek'}<ArrowRight size={18} /></button>}
    </SpeechBubble>
    <div className="sr-only" role="status">{feedback}</div>
  </div>;
}
