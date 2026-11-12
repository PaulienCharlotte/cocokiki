import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../../design-system';
import { afgerondeRedactieronde, noteerRedactieAntwoord, type RedactieAntwoorden } from './redactie/navigatie';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SpeechBubble from '../../components/ui/SpeechBubble';
import { createQuestionDeck, validAnswer } from './engine';
import ChoiceChallenge from './ChoiceChallenge';
import DistributionChallenge from './DistributionChallenge';
import PuzzleChallenge, { cookieOrder } from './PuzzleChallenge';
import BalanceChallenge from './BalanceChallenge';
import { mathAssets } from './assets';
import { QUESTION_TRANSITION_MS } from './config';
import type { MathGameId, MathLevel, MathResult } from './types';
import { maakRedactiedeck, steunVoorNiveau } from './redactie/catalogus';
import type { Redactiesom } from './redactie/types';
import RedactieChallenge from './RedactieChallenge';
import { maakMatendeck, type Maatvraag } from './maten/vragen';
import MatenChallenge from './MatenChallenge';
import MathHelp from './MathHelp';
import { techniqueHint } from './techniqueHint';

import { useActivityAnalytics } from '../../services/useActivityAnalytics';
import { analytics } from '../../services/analytics';

export default function MathSession({ game, level, onFinish, onSound = () => undefined, onVraag }: { game: Exclude<MathGameId, 'race'>; level: MathLevel; onFinish: (result: MathResult) => void; onSound?: (correct: boolean) => void; onVraag?: (vraag: string) => void }) {
  useActivityAnalytics(game === 'maten' ? null : `math:${game}`);
  const [questions] = useState(() => game === 'add-subtract' ? maakRedactiedeck(level) : game === 'maten' ? maakMatendeck(level) : createQuestionDeck(game, level));
  const [index, setIndex] = useState(0);
  const [bezocht, setBezocht] = useState([0]);
  const redactieAntwoorden = useRef<RedactieAntwoorden>({});
  const [selected, setSelected] = useState<number>();
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hint, setHint] = useState(false);
  const stats = useRef({ correct: 0, total: 10, score: 0, mistakes: 0, solved: 0, roundId: crypto.randomUUID() });
  const hadMistake = useRef(false), answered = useRef(false), finished = useRef(false);
  const finishRef = useRef(onFinish); finishRef.current = onFinish;
  const workspace = useRef<HTMLElement>(null), keyboard = useRef(false);
  const question = questions[index];
  // Bij de honingpotten zegt het plaatje het al: daar blijft de achtergrond
  // zichtbaar en komt Lua's wolk pas als je om een tip vraagt.
  const toneel = game === 'balance';
  // De balk bovenin leent de vraag, zodat de rekenmachine hem kan tonen.
  const vraagRef = useRef(onVraag); vraagRef.current = onVraag;
  useEffect(() => { vraagRef.current?.(question.prompt); }, [question.prompt]);
  // Bij een redactiesom mag je een som fout afsluiten: je ziet pas achteraf
  // waar het misliep, en je gaat zelf verder als je het nagekeken hebt.
  const foutenMogen = game === 'add-subtract';
  useEffect(() => { if (index && keyboard.current) workspace.current?.querySelector<HTMLButtonElement>(foutenMogen ? '.math-challenge > div:not([hidden]) button:not(:disabled)' : '.math-challenge button:not(:disabled)')?.focus(); }, [index]);
  const blader = (doel: number) => {
    if (doel < 0 || doel >= questions.length || finished.current) return;
    const gemaakt = Object.hasOwn(redactieAntwoorden.current, doel);
    answered.current = gemaakt; hadMistake.current = false;
    setIndex(doel); setSelected(undefined); setHint(false);
    setFeedback(gemaakt ? redactieAntwoorden.current[doel] ? 'correct' : 'wrong' : null);
    setBezocht(previous => previous.includes(doel) ? previous : [...previous, doel]);
  };
  const volgende = useCallback(() => {
    if (game === 'add-subtract') {
      const result = afgerondeRedactieronde(redactieAntwoorden.current, questions.length, stats.current.roundId);
      if (result) {
        if (!finished.current) { finished.current = true; analytics().complete('math:add-subtract'); finishRef.current(result); }
        return;
      }
      const volgorde = [...questions.keys()].filter(i => i > index).concat([...questions.keys()].filter(i => i <= index));
      const doel = volgorde.find(i => !Object.hasOwn(redactieAntwoorden.current, i));
      if (doel !== undefined) blader(doel);
      return;
    }
    if (index === 9) { if (!finished.current) { finished.current = true; if (game !== 'maten') analytics().complete(`math:${game}`); finishRef.current({ ...stats.current }); } return; }
    answered.current = false; hadMistake.current = false;
    setIndex(current => current + 1); setSelected(undefined); setFeedback(null); setHint(false);
  }, [index, game, questions]);
  const verderRef = useRef(volgende); verderRef.current = volgende;
  useEffect(() => {
    if (feedback !== 'correct' || foutenMogen) return;
    const timer = window.setTimeout(() => verderRef.current(), QUESTION_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [feedback, foutenMogen]);
  const answer = (value: number, distributionValid?: boolean) => {
    if (answered.current || finished.current) return;
    setSelected(value);
    const valid = distributionValid ?? validAnswer(question, value);
    onSound(valid);
    if (game === 'add-subtract') {
      redactieAntwoorden.current = noteerRedactieAntwoord(redactieAntwoorden.current, index, valid);
      answered.current = true; setFeedback(valid ? 'correct' : 'wrong');
      return;
    }
    if (valid) {
      answered.current = true; setFeedback('correct');
      stats.current.solved++;
      if (!hadMistake.current) { stats.current.correct++; stats.current.score++; }
    } else { hadMistake.current = true; stats.current.mistakes++; setFeedback('wrong'); setHint(true); }
  };
  const balk = <div className="math-balk">
    <div className="math-progress-dots" role="img" aria-label={`Opdracht ${index + 1} van 10, ${foutenMogen ? Object.keys(redactieAntwoorden.current).length : index + (feedback === 'correct' ? 1 : 0)} klaar`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={(foutenMogen ? Object.hasOwn(redactieAntwoorden.current, i) : i < index + (feedback === 'correct' ? 1 : 0)) ? 'is-klaar' : undefined} />)}</div>
    {!toneel && <SpeechBubble character="lua" className="math-vraag" tone={feedback === 'correct' ? 'goed' : feedback === 'wrong' && !foutenMogen ? 'alert' : 'default'} textId="math-vraag">{game === 'missing' ? cookieOrder(question)
      // Bij een redactiesom staat het verhaal op het werkblad, want daar
      // streep je de getallen in aan. Lua zegt dan wat je zoekt.
      : game === 'add-subtract' ? `Je zoekt: ${(question as Redactiesom).zoek}.`
      : question.prompt}</SpeechBubble>}
    {feedback !== 'correct' && !foutenMogen && <MathHelp open={hint} onToggle={() => setHint(value => !value)}>{techniqueHint(question)}</MathHelp>}
  </div>;
  return <section ref={workspace} onKeyDownCapture={() => { keyboard.current = true; }} onPointerDownCapture={() => { keyboard.current = false; }} className={`math-session adventure-session${toneel ? ' is-toneel' : ''}${feedback ? ` is-${feedback}` : ''}`} aria-label="Rekenavontuur">
    {/* Op een toneel komt de balk onder de opdracht, zodat hij tegen het
        vak met de antwoorden aan ligt en het één wit vlak wordt. */}
    {foutenMogen && <nav className="redactie-bladeren" aria-label="Bladeren door de sommen">
      <IconButton label="Vorige som" icon={<ChevronLeft size={20} />} disabled={index === 0} onClick={() => blader(index - 1)} />
      <select aria-label="Kies een som" value={index} onChange={event => blader(Number(event.target.value))}>
        {questions.map((_, i) => <option key={i} value={i}>Som {i + 1} van {questions.length}{Object.hasOwn(redactieAntwoorden.current, i) ? ' · gemaakt' : ''}</option>)}
      </select>
      <IconButton label="Volgende som" icon={<ChevronRight size={20} />} disabled={index === questions.length - 1} onClick={() => blader(index + 1)} />
    </nav>}
    {!toneel && balk}
    <div className={`math-challenge math-challenge--${question.kind}`} key={foutenMogen ? 'redactie' : question.id}>
      {game === 'divide' && question.kind === 'distribution' ? <><img className="adventure-plant adventure-plant--left" src={mathAssets.strawberryPlant} alt="" /><img className="adventure-plant adventure-plant--right" src={mathAssets.blueberryPlant} alt="" /><DistributionChallenge question={question} locked={feedback === 'correct'} onAnswer={answer} tutorial={index === 0} /></>
        : game === 'add-subtract' ? bezocht.map(i => <div key={questions[i].id} hidden={i !== index}><RedactieChallenge question={questions[i] as Redactiesom} steun={steunVoorNiveau(level)} locked={Object.hasOwn(redactieAntwoorden.current, i)} onAnswer={(value, valid) => { if (i === index) answer(value, valid); }} onVerder={volgende} /></div>)
        : game === 'maten' ? <MatenChallenge vraag={question as Maatvraag} locked={feedback === 'correct'} gekozen={selected} onAnswer={answer} />
        : question.kind === 'puzzle' ? <PuzzleChallenge question={question} locked={feedback === 'correct'} onAnswer={answer} />
        : question.kind === 'balance' ? <BalanceChallenge question={question} locked={feedback === 'correct'} onAnswer={answer} />
        : <ChoiceChallenge question={question} locked={feedback === 'correct'} selected={selected} onAnswer={answer} />}
    </div>
    {toneel && balk}
    <div className="adventure-feedback" role="status">{foutenMogen ? '' : feedback === 'correct' ? game === 'divide' ? `${question.a} ÷ ${question.groups} = ${question.answer}. Eerlijk verdeeld!` : 'Goed zo!' : feedback === 'wrong' ? game === 'divide' ? 'Nog niet evenveel. Verplaats een bes.' : 'Bijna! Probeer nog eens.' : ''}</div>
  </section>;
}
