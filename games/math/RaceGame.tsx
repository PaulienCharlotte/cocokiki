import React, { useEffect, useRef, useState } from 'react';
import { Clock3, Play, ShoppingBasket, Users, Wallet } from 'lucide-react';
import { RACE_SECONDS } from './config';
import { generateQuestion, validAnswer } from './engine';
import { AnswerChoices } from './ChoiceChallenge';
import Equation from './Equation';
import MathHelp from './MathHelp';
import type { MathLevel, MathQuestion, MathResult } from './types';
import { techniqueHint } from './techniqueHint';

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
  const [question, setQuestion] = useState(() => generateQuestion('race', level));
  const questionRef = useRef(question);
  const [seconds, setSeconds] = useState(RACE_SECONDS), [started, setStarted] = useState(false);
  const [score, setScore] = useState(0), [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState(false);
  const [raceId] = useState(() => crypto.randomUUID());
  const deadline = useRef(0), finished = useRef(false), order = useRef(0);
  const statistics = useRef({ correct: 0, total: 0, score: 0, mistakes: 0 });
  const workspace = useRef<HTMLElement>(null), keyboard = useRef(false);
  const finishRef = useRef(onFinish); finishRef.current = onFinish;
  useEffect(() => { if (started && keyboard.current) workspace.current?.querySelector<HTMLButtonElement>('.math-answers button')?.focus(); }, [question, started]);
  const finish = () => {
    if (finished.current) return;
    finished.current = true; setSeconds(0);
    finishRef.current({ ...statistics.current, raceId });
  };
  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, deadline.current - Date.now());
      setSeconds(Math.ceil(left / 1000));
      if (!left) finish();
    }, 100);
    return () => window.clearInterval(timer);
  }, [started]);
  const answer = (value: number) => {
    if (!started || finished.current || questionRef.current !== question) return;
    if (Date.now() >= deadline.current) { finish(); return; }
    statistics.current.total++;
    const correct = validAnswer(question, value); onSound(correct);
    if (!correct) { statistics.current.mistakes++; setWrong(true); return; }
    statistics.current.correct++; statistics.current.score++;
    setScore(statistics.current.score); setWrong(false); setHint(false);
    let next = generateQuestion('race', level, ++order.current);
    for (let retry = 0; retry < 6 && next.id === question.id; retry++) next = generateQuestion('race', level, order.current);
    questionRef.current = next; setQuestion(next);
  };
  return <section ref={workspace} onKeyDownCapture={() => { keyboard.current = true; }} onPointerDownCapture={() => { keyboard.current = false; }} className={`math-session checkout-game${wrong ? ' is-wrong' : ''}`} aria-label="Winkelgekte ronde">
    <div className="checkout-hud"><span><Clock3 size={20} />{seconds} s</span><strong>{score} klanten</strong></div>
    {!started ? <div className="checkout-start"><ShoppingBasket size={62} /><h2>De winkel gaat open!</h2><button className="adventure-start" type="button" onClick={() => { deadline.current = Date.now() + RACE_SECONDS * 1000; setStarted(true); }}><Play size={20} />Open de winkel</button></div> : <>
      <h2 className="math-prompt">{question.prompt}</h2>
      <MathHelp open={hint} onToggle={() => setHint(value => !value)}>{techniqueHint(question)}</MathHelp>
      <div className={`checkout-counter${question.operation === '*' ? ' checkout-counter--single' : ''}`} key={`${question.id}:${order.current}`}>
        <CheckoutOrder question={question} />
        {score > 0 && <span className="checkout-coin" aria-hidden="true">+2</span>}
      </div>
      <Equation question={question} />
      <div className="checkout-answers" key={order.current}><AnswerChoices question={question} locked={finished.current} onAnswer={answer} /></div>
      <p className="adventure-feedback" role="status">{wrong ? 'Probeer nog eens. Je punten blijven staan.' : ''}</p>
    </>}
  </section>;
}
