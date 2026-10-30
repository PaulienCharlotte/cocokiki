import React, { useEffect, useRef, useState } from 'react';
import { Clock3, Play, ShoppingBasket, Users, Wallet } from 'lucide-react';
import { validAnswer } from './engine';
import { AnswerChoices } from './ChoiceChallenge';
import Equation from './Equation';
import MathHelp from './MathHelp';
import type { MathLevel, MathQuestion, MathResult } from './types';
import { techniqueHint } from './techniqueHint';
import { createCheckoutQuestion } from './checkoutQuestions';
import CheckoutConveyor from './CheckoutConveyor';
import { CHECKOUT_FALL_MS, CHECKOUT_MIN_SECONDS, checkoutOrderSeconds, checkoutTravel } from './checkoutTiming';
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
  // De klok telt af voor de klant die nu op de band staat, niet voor de ronde:
  // de ronde duurt tot er iemand van de band valt.
  const [seconds, setSeconds] = useState(() => checkoutOrderSeconds(level)), [started, setStarted] = useState(false);
  const [score, setScore] = useState(0), [wrong, setWrong] = useState(false);
  const [hint, setHint] = useState(false);
  const [travel, setTravel] = useState(0), [falling, setFalling] = useState(false);
  const [notice, setNotice] = useState('');
  const orderDeadline = useRef(0), phase = useRef<'active' | 'falling'>('active');
  const fallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // De band begint rustig en gaat bij elke klant een stukje sneller, tot je
  // hem niet meer bijhoudt. Hoe snel het wordt staat in seconden per klant.
  const [seconden, setSeconden] = useState(() => checkoutOrderSeconds(level));
  const duur = useRef(checkoutOrderSeconds(level) * 1000);
  const [raceId] = useState(() => crypto.randomUUID());
  const finished = useRef(false), order = useRef(0);
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
    let next = createCheckoutQuestion(level, ++order.current);
    for (let retry = 0; retry < 6 && next.id === questionRef.current.id; retry++) next = createCheckoutQuestion(level, order.current);
    questionRef.current = next;
    const volgende = checkoutOrderSeconds(level, order.current);
    duur.current = volgende * 1000; setSeconden(volgende);
    orderDeadline.current = Date.now() + duur.current;
    phase.current = 'active';
    setTravel(0); setFalling(false); setWrong(false); setHint(false); setQuestion(next);
  };
  // Valt er een klant van de band, dan is de ronde voorbij. Dat is het einde
  // waar de band al die tijd naartoe werkt.
  const expire = () => {
    if (finished.current || phase.current !== 'active') return;
    phase.current = 'falling';
    statistics.current.total++; statistics.current.mistakes++;
    setTravel(1); setFalling(true); setWrong(false);
    setNotice('Van de band! De winkel sluit.');
    onSound(false);
    fallTimer.current = setTimeout(finish, CHECKOUT_FALL_MS);
  };
  const expireRef = useRef(expire); expireRef.current = expire;
  useEffect(() => () => { if (fallTimer.current) clearTimeout(fallTimer.current); }, []);
  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      if (finished.current) return;
      if (phase.current === 'active') {
        setSeconds(Math.max(0, Math.ceil((orderDeadline.current - Date.now()) / 1000)));
        setTravel(checkoutTravel(Date.now(), orderDeadline.current, duur.current));
        if (Date.now() >= orderDeadline.current) expireRef.current();
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [started]);
  const answer = (value: number) => {
    if (!started || finished.current || phase.current !== 'active' || questionRef.current !== question) return;
    if (Date.now() >= orderDeadline.current) { expire(); return; }
    statistics.current.total++;
    const correct = validAnswer(question, value); onSound(correct);
    if (!correct) { statistics.current.mistakes++; setWrong(true); return; }
    statistics.current.correct++; statistics.current.score++;
    setScore(statistics.current.score); setWrong(false); setHint(false);
    advance();
  };
  return <section ref={workspace} onKeyDownCapture={() => { keyboard.current = true; }} onPointerDownCapture={() => { keyboard.current = false; }} className={`math-session checkout-game${wrong ? ' is-wrong' : ''}`} aria-label="Winkelgekte ronde">
    {/* Alles wat geen winkel is staat in twee rustige vlakken: de klant
        bovenaan, de som onderaan. Daartussen zie je de band zelf. */}
    <div className="checkout-paneel checkout-paneel--boven">
      <div className="checkout-hud"><span><Clock3 size={20} />{seconds} s</span><strong>{score} klanten</strong>{started && seconden === CHECKOUT_MIN_SECONDS && <span className="checkout-tempo-nu">volle snelheid</span>}</div>
      {!started ? <div className="checkout-start"><ShoppingBasket size={48} /><h2>De winkel gaat open!</h2>
        <p className="checkout-uitleg">De band gaat bij elke klant een beetje sneller. Valt er een klant van de band, dan sluit de winkel.</p>
        <button className="adventure-start" type="button" onClick={() => { orderDeadline.current = Date.now() + duur.current; setStarted(true); }}><Play size={20} />Open de winkel</button></div> : <>
        <div className="checkout-order-time" role="progressbar" aria-label="Tijd voor deze klant" aria-valuemin={0} aria-valuemax={seconden} aria-valuenow={Math.max(0, Math.ceil((1 - travel) * seconden))}><span style={{ width: `${(1 - travel) * 100}%` }} /></div>
      </>}
    </div>
    <CheckoutConveyor key={order.current} question={question} progress={travel} running={started && !finished.current} falling={falling} />
    {/* De vraag in woorden en de som zeggen hetzelfde; ze staan dus ook in
        hetzelfde vak, vlak boven de antwoorden. */}
    {started && <div className="checkout-paneel checkout-paneel--onder">
      <h2 className="math-prompt">{question.prompt}</h2>
      <Equation question={question} />
      <div className="checkout-answers" key={order.current}><AnswerChoices question={question} locked={finished.current || falling} onAnswer={answer} /></div>
      <MathHelp open={hint} onToggle={() => setHint(value => !value)}>{techniqueHint(question)}</MathHelp>
      <p className="adventure-feedback" role="status">{notice || (wrong ? 'Probeer nog eens. De band loopt door.' : '')}</p>
    </div>}
  </section>;
}
