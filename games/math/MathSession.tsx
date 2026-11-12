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

export default function MathSession({ game, level, onFinish, onSound = () => undefined, onVraag }: { game: Exclude<MathGameId, 'race'>; level: MathLevel; onFinish: (result: MathResult) => void; onSound?: (correct: boolean) => void; onVraag?: (vraag: string) => void }) {
  const [questions] = useState(() => game === 'add-subtract' ? maakRedactiedeck(level) : game === 'maten' ? maakMatendeck(level) : createQuestionDeck(game, level));
  const [index, setIndex] = useState(0);
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
  useEffect(() => { if (index && keyboard.current) workspace.current?.querySelector<HTMLButtonElement>('.math-challenge button:not(:disabled)')?.focus(); }, [index]);
  const volgende = useCallback(() => {
    if (index === 9) { if (!finished.current) { finished.current = true; finishRef.current({ ...stats.current }); } return; }
    answered.current = false; hadMistake.current = false;
    setIndex(current => current + 1); setSelected(undefined); setFeedback(null); setHint(false);
  }, [index]);
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
    if (valid) {
      answered.current = true; setFeedback('correct');
      stats.current.solved++;
      if (!hadMistake.current) { stats.current.correct++; stats.current.score++; }
    } else { hadMistake.current = true; stats.current.mistakes++; setFeedback('wrong'); setHint(true); }
  };
  const balk = <div className="math-balk">
    <div className="math-progress-dots" role="img" aria-label={`Opdracht ${index + 1} van 10, ${index + (feedback === 'correct' ? 1 : 0)} klaar`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < index + (feedback === 'correct' ? 1 : 0) ? 'is-klaar' : undefined} />)}</div>
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
    {!toneel && balk}
    <div className={`math-challenge math-challenge--${question.kind}`} key={question.id}>
      {game === 'divide' && question.kind === 'distribution' ? <><img className="adventure-plant adventure-plant--left" src={mathAssets.strawberryPlant} alt="" /><img className="adventure-plant adventure-plant--right" src={mathAssets.blueberryPlant} alt="" /><DistributionChallenge question={question} locked={feedback === 'correct'} onAnswer={answer} tutorial={index === 0} /></>
        : game === 'add-subtract' ? <RedactieChallenge question={question as Redactiesom} steun={steunVoorNiveau(level)} locked={Boolean(feedback)} onAnswer={answer} onVerder={volgende} />
        : game === 'maten' ? <MatenChallenge vraag={question as Maatvraag} locked={feedback === 'correct'} gekozen={selected} onAnswer={answer} />
        : question.kind === 'puzzle' ? <PuzzleChallenge question={question} locked={feedback === 'correct'} onAnswer={answer} />
        : question.kind === 'balance' ? <BalanceChallenge question={question} locked={feedback === 'correct'} onAnswer={answer} />
        : <ChoiceChallenge question={question} locked={feedback === 'correct'} selected={selected} onAnswer={answer} />}
    </div>
    {toneel && balk}
    <div className="adventure-feedback" role="status">{foutenMogen ? '' : feedback === 'correct' ? game === 'divide' ? `${question.a} ÷ ${question.groups} = ${question.answer}. Eerlijk verdeeld!` : 'Goed zo!' : feedback === 'wrong' ? game === 'divide' ? 'Nog niet evenveel. Verplaats een bes.' : 'Bijna! Probeer nog eens.' : ''}</div>
  </section>;
}
