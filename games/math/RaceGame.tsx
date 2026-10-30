import React, { useEffect, useRef, useState } from 'react';
import { Clock3, Play, ShoppingBasket, Users, Wallet } from 'lucide-react';
import { RACE_SECONDS } from './config';
import { validAnswer } from './engine';
import { AnswerChoices } from './ChoiceChallenge';
import Equation from './Equation';
import MathHelp from './MathHelp';
import type { MathLevel, MathQuestion, MathResult } from './types';
import { techniqueHint } from './techniqueHint';
import { createCheckoutQuestion } from './checkoutQuestions';
import CheckoutConveyor from './CheckoutConveyor';
import { CHECKOUT_FALL_MS, checkoutOrderSeconds, checkoutTravel } from './checkoutTiming';
import './checkout.css';

export function CheckoutOrder({ question }: { question: MathQuestion }) {
  if (!question.checkout) return null;
  const { products: [product, second], quantity } = question.checkout;
  const productArt = <img src={product.image} alt={product.name} />;
  return <>
    <div className="checkout-product">
      {question.operation === '-' ? <Wallet className="checkout-symbol" aria-label="Geld" /> : productArt}
      <strong>{question.operation === '*' ? `${quantity} ${product.unit[quantity === 1 ? 0 : 1]}` : question.operation === '/' ? `€${question.a} samen` : question.operation === '-' ? `€${question.a} betaald` : `€${product.price}`}</strong>
      {question.operation !== '-' && <span>{product.name}{question.operation === '*' ? ` · €${product.price} per ${product.unit[0]}` : question.operation === '/' ? ` · ${quantity} ${product.unit[quantity === 1 ? 0 : 1]}` : ''}</span>}
    </div>
    {question.operation !== '*' && <div className="checkout-product">
      {question.operation === '/' ? <Users className="checkout-symbol" aria-label="Klanten" /> : question.operation === '-' ? productArt : second && <img src={second.image} alt={second.name} />}
      <strong>{question.operation === '/' ? `${question.b} klanten` : question.operation === '-' ? `€${product.price} prijs` : `€${second.price}`}</strong>
      {question.operation !== '/' && <span>{question.operation === '-' ? product.name : second.name}</span>}
    </div>}
  </>;
}

export default function RaceGame({ level, onFinish, onSound = () => undefined }: { level: MathLevel; onFinish: (result: MathResult) => void; onSound?: (correct: boolean) => void }) {
  const [question, setQuestion] = useState(() => createCheckoutQuestion(level));
  const questionRef = useRef(question);
  const [seconds, setSeconds] = useState(RACE_SECONDS), [started, setStarted] = useState(false);
  const [score, setScore] = useState(0), [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState(false);
  const [travel, setTravel] = useState(0), [falling, setFalling] = useState(false);
  const [notice, setNotice] = useState('');
  const orderDeadline = useRef(0), phase = useRef<'active' | 'falling'>('active');
  const fallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = checkoutOrderSeconds(level) * 1000;
  const [raceId] = useState(() => crypto.randomUUID());
  const deadline = useRef(0), finished = useRef(false), order = useRef(0);
  const statistics = useRef({ correct: 0, total: 0, score: 0, mistakes: 0 });
  const workspace = useRef<HTMLElement>(null), keyboard = useRef(false);
  const finishRef = useRef(onFinish); finishRef.current = onFinish;
  useEffect(() => { if (started && keyboard.current) workspace.current?.querySelector<HTMLButtonElement>('.math-answers button')?.focus(); }, [question, started]);
  const finish = () => {
    if (finished.current) return;
    finished.current = true; setSeconds(0);
    if (fallTimer.current) clearTimeout(fallTimer.current);
    finishRef.current({ ...statistics.current, raceId });
  };
  const advance = () => {
    if (finished.current) return;
    if (Date.now() >= deadline.current) { finish(); return; }
    let next = createCheckoutQuestion(level, ++order.current);
    for (let retry = 0; retry < 6 && next.id === questionRef.current.id; retry++) next = createCheckoutQuestion(level, order.current);
    questionRef.current = next;
    orderDeadline.current = Date.now() + duration;
    phase.current = 'active';
    setTravel(0); setFalling(false); setWrong(false); setHint(false); setQuestion(next);
  };
  const expire = () => {
    if (finished.current || phase.current !== 'active') return;
    phase.current = 'falling';
    statistics.current.total++; statistics.current.mistakes++;
    setTravel(1); setFalling(true); setWrong(false);
    setNotice('Van de band! De volgende klant komt eraan.');
    onSound(false);
    fallTimer.current = setTimeout(() => { setNotice(''); advance(); }, CHECKOUT_FALL_MS);
  };
  const expireRef = useRef(expire); expireRef.current = expire;
  useEffect(() => () => { if (fallTimer.current) clearTimeout(fallTimer.current); }, []);
  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      if (finished.current) return;
      const left = Math.max(0, deadline.current - Date.now());
      setSeconds(Math.ceil(left / 1000));
      if (!left) { finish(); return; }
      if (phase.current === 'active') {
        setTravel(checkoutTravel(Date.now(), orderDeadline.current, duration));
        if (Date.now() >= orderDeadline.current) expireRef.current();
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [started]);
  const answer = (value: number) => {
    if (!started || finished.current || phase.current !== 'active' || questionRef.current !== question) return;
    if (Date.now() >= deadline.current) { finish(); return; }
    if (Date.now() >= orderDeadline.current) { expire(); return; }
    statistics.current.total++;
    const correct = validAnswer(question, value); onSound(correct);
    if (!correct) { statistics.current.mistakes++; setWrong(true); return; }
    statistics.current.correct++; statistics.current.score++;
    setScore(statistics.current.score); setWrong(false); setHint(false);
    advance();
  };
  return <section ref={workspace} onKeyDownCapture={() => { keyboard.current = true; }} onPointerDownCapture={() => { keyboard.current = false; }} className={`math-session checkout-game${wrong ? ' is-wrong' : ''}`} aria-label="Winkelgekte ronde">
    <div className="checkout-hud"><span><Clock3 size={20} />{seconds} s</span><strong>{score} klanten</strong></div>
    {!started ? <div className="checkout-start"><ShoppingBasket size={62} /><h2>De winkel gaat open!</h2><button className="adventure-start" type="button" onClick={() => { const now = Date.now(); deadline.current = now + RACE_SECONDS * 1000; orderDeadline.current = now + duration; setStarted(true); }}><Play size={20} />Open de winkel</button></div> : <>
      <h2 className="math-prompt">{question.prompt}</h2>
      <MathHelp open={hint} onToggle={() => setHint(value => !value)}>{techniqueHint(question)}</MathHelp>
      <div className="checkout-order-time" role="progressbar" aria-label="Tijd voor deze klant" aria-valuemin={0} aria-valuemax={checkoutOrderSeconds(level)} aria-valuenow={Math.max(0, Math.ceil((1 - travel) * checkoutOrderSeconds(level)))}><span style={{ width: `${(1 - travel) * 100}%` }} /></div>
    </>}
      <CheckoutConveyor key={order.current} question={question} progress={travel} running={started && !finished.current} falling={falling} />
    {started && <>
      <Equation question={question} />
      <div className="checkout-answers" key={order.current}><AnswerChoices question={question} locked={finished.current || falling} onAnswer={answer} /></div>
      <p className="adventure-feedback" role="status">{notice || (wrong ? 'Probeer nog eens. De band loopt door.' : '')}</p>
    </>}
  </section>;
}
