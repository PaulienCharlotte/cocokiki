import React, { useEffect, useRef, useState } from 'react';
import { Lightbulb, Users, Volume2, VolumeX, Wallet } from 'lucide-react';
import { expressionText, resultStatus, validAnswer } from './engine';
import DragChoice from './DragChoice';
import type { MathLevel, MathQuestion, MathResult } from './types';
import { MATH_LEVELS } from './types';
import { techniqueHint } from './techniqueHint';
import { createCheckoutQuestion } from './checkoutQuestions';
import CheckoutConveyor from './CheckoutConveyor';
import { CHECKOUT_FALL_MS, checkoutOrderSeconds, checkoutTravel } from './checkoutTiming';
import { CHARACTERS } from '../../data/characters';
import './checkout.css';
import './winkelgekte.css';

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

/**
 * Wat er aan de boodschappen hangt. De vraag zelf zegt Lua; het kaartje
 * laat het getal zien dat bij het ding op de band hoort.
 */
export function winkelKaartjes(question: MathQuestion): { tekst: string; onder?: string }[] {
  const variant = question.id.split(':')[1];
  const [product, second] = question.checkout?.products ?? [];
  const naam = product?.name;
  switch (variant) {
    case 'total': return [{ tekst: `€${question.a}`, onder: naam }, { tekst: `€${question.b}`, onder: second?.name }];
    case 'combined': return [{ tekst: `${question.a} × €${question.b}`, onder: naam }, { tekst: `+ €${question.total - question.a * question.b}`, onder: 'bezorgen' }];
    case 'groups': return [{ tekst: `${question.a} × €${question.b}`, onder: naam }];
    case 'missing-multiply': return [{ tekst: `€${question.a}`, onder: 'per stuk' }];
    case 'share': return [{ tekst: `€${question.a}`, onder: `${question.b} klanten` }];
    case 'change': return [{ tekst: `€${question.b}`, onder: `betaald €${question.a}` }];
    case 'discount': return [{ tekst: `€${question.a}`, onder: `€${question.b} korting` }];
    case 'missing-subtract': return [{ tekst: `€${question.a}`, onder: 'in je portemonnee' }];
    default: return [{ tekst: `${question.a}`, onder: naam }];
  }
}

const TITELS = ['Kassa-held', 'Snelle rekenaar', 'Winkelster'];
const STIPPEN = 5;

import { useActivityAnalytics } from '../../services/useActivityAnalytics';
import { analytics } from '../../services/analytics';

/** Wat er na de ronde gebeurt; dat levert MathModule, die de munten bewaart. */
export interface RaceEinde { reward: number; saved: boolean; onRetrySave: () => void; onReplay: () => void; onNext: () => void }

export default function RaceGame({ level, onFinish, onSound = () => undefined, sound, onToggleSound, onLevel, einde }: {
  einde?: RaceEinde;
  level: MathLevel; onFinish: (result: MathResult) => void; onSound?: (correct: boolean) => void;
  /** Geluid staat onderaan de gereedschapsbalk. */
  sound?: boolean; onToggleSound?: () => void;
  /** Voor de start kies je het niveau op het label in het statuseiland. */
  onLevel?: (level: MathLevel) => void;
}) {
  const [question, setQuestion] = useState(() => createCheckoutQuestion(level));
  const questionRef = useRef(question);
  // De klok telt af voor de klant die nu op de band staat, niet voor de ronde:
  // de ronde duurt tot er iemand van de band valt.
  const [seconds, setSeconds] = useState(() => checkoutOrderSeconds(level)), [started, setStarted] = useState(false);
  useActivityAnalytics(started ? 'math:race' : null);
  const [score, setScore] = useState(0), [wrong, setWrong] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [travel, setTravel] = useState(0), [falling, setFalling] = useState(false);
  const [notice, setNotice] = useState('');
  const [blij, setBlij] = useState(false), [beloning, setBeloning] = useState<string | null>(null), [over, setOver] = useState(false);
  const orderDeadline = useRef(0), phase = useRef<'active' | 'falling'>('active');
  const fallTimer = useRef<ReturnType<typeof setTimeout> | null>(null), feestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // De band begint rustig en gaat bij elke klant een stukje sneller, tot je
  // hem niet meer bijhoudt. Hoe snel het wordt staat in seconden per klant.
  const duur = useRef(checkoutOrderSeconds(level) * 1000);
  const [raceId] = useState(() => crypto.randomUUID());
  const finished = useRef(false), order = useRef(0);
  const statistics = useRef({ correct: 0, total: 0, score: 0, mistakes: 0 });
  const scherm = useRef<HTMLElement>(null), doel = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish); finishRef.current = onFinish;
  const finish = () => {
    if (finished.current) return;
    finished.current = true; setSeconds(0);
    analytics().complete('math:race');
    if (fallTimer.current) clearTimeout(fallTimer.current);
    finishRef.current({ ...statistics.current, raceId });
  };
  const advance = () => {
    if (finished.current) return;
    let next = createCheckoutQuestion(level, ++order.current);
    for (let retry = 0; retry < 6 && next.id === questionRef.current.id; retry++) next = createCheckoutQuestion(level, order.current);
    questionRef.current = next;
    duur.current = checkoutOrderSeconds(level, order.current) * 1000;
    orderDeadline.current = Date.now() + duur.current;
    phase.current = 'active';
    setTravel(0); setFalling(false); setWrong(null); setHint(false); setNotice(''); setQuestion(next);
  };
  // Valt er een klant van de band, dan is de ronde voorbij. Dat is het einde
  // waar de band al die tijd naartoe werkt.
  const expire = () => {
    if (finished.current || phase.current !== 'active') return;
    phase.current = 'falling';
    statistics.current.total++; statistics.current.mistakes++;
    setTravel(1); setFalling(true); setWrong(null);
    setNotice('Oei, van de band. De winkel gaat dicht.');
    onSound(false);
    fallTimer.current = setTimeout(finish, CHECKOUT_FALL_MS);
  };
  const expireRef = useRef(expire); expireRef.current = expire;
  useEffect(() => () => { if (fallTimer.current) clearTimeout(fallTimer.current); if (feestTimer.current) clearTimeout(feestTimer.current); }, []);
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
  // De glans op het glas en de wereld bewegen een beetje mee met je vinger.
  const glans = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5, y = (event.clientY - rect.top) / rect.height - .5;
    event.currentTarget.style.setProperty('--ck-glans-x', `${50 + x * 80}%`);
    event.currentTarget.style.setProperty('--wk-parallax', `${-x * 14}px, ${-y * 10}px`);
  };
  const vonken = (bron: Element | null) => {
    const veld = scherm.current;
    if (!bron || !veld || typeof bron.getBoundingClientRect !== 'function') return;
    const r = bron.getBoundingClientRect(), s = veld.getBoundingClientRect();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 18; i++) {
      const vonk = document.createElement('i');
      vonk.className = `wk-vonk wk-vonk--${i % 4}`;
      vonk.style.left = `${r.left - s.left + r.width / 2}px`; vonk.style.top = `${r.top - s.top + r.height / 2}px`;
      veld.appendChild(vonk);
      const hoek = Math.random() * Math.PI * 2, afstand = 60 + Math.random() * 110;
      vonk.animate([{ transform: 'translate(0, 0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(hoek) * afstand}px, ${Math.sin(hoek) * afstand - 40}px) scale(.2)`, opacity: 0 }],
        { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => vonk.remove();
    }
  };
  const answer = (value: number) => {
    if (!started || finished.current || phase.current !== 'active' || questionRef.current !== question) return;
    if (Date.now() >= orderDeadline.current) { expire(); return; }
    statistics.current.total++;
    const correct = validAnswer(question, value); onSound(correct);
    if (!correct) { statistics.current.mistakes++; setWrong(value); setHint(true); return; }
    statistics.current.correct++; statistics.current.score++;
    vonken(scherm.current?.querySelector(`[data-waarde="${value}"]`) ?? null);
    const klanten = statistics.current.score;
    setScore(klanten); setWrong(null); setHint(false);
    // Elke klant laat het statuseiland even uitrekken; na een volle rij
    // bolletjes krijg je er een titel bij.
    setBlij(true); setBeloning(klanten % STIPPEN === 0 ? TITELS[(klanten / STIPPEN - 1) % TITELS.length] : '');
    if (feestTimer.current) clearTimeout(feestTimer.current);
    feestTimer.current = setTimeout(() => { setBlij(false); setBeloning(null); }, 1800);
    advance();
  };
  const begin = () => { analytics().start('math:race', true); orderDeadline.current = Date.now() + duur.current; setStarted(true); };
  const klaar = score % STIPPEN;
  // De som staat op de band; Lua zegt alleen iets als het helpt.
  const uitslag = einde ? resultStatus('race', level, statistics.current) : null;
  const zin = einde ? `Je hielp ${statistics.current.correct} ${statistics.current.correct === 1 ? 'klant' : 'klanten'}. ${uitslag?.passed && level < 5 ? 'Klaar voor een sneller niveau?' : 'Nog een keer?'}`
    : notice || (!started ? 'De band gaat bij elke klant een beetje sneller.'
    : wrong !== null ? techniqueHint(question)
    : hint ? techniqueHint(question) : 'Reken mee op de band.');
  const som = `${expressionText(question.left)} = ${expressionText(question.right)}`;
  const kaartjes = winkelKaartjes(question);
  const vrachtX = 12 + travel * 73;
  const lua = CHARACTERS.lua;
  return <section ref={scherm} className={`ck-scherm winkelgekte${started ? ' is-open' : ''}`} data-wereld="school" aria-label="Winkelgekte ronde" onPointerMove={glans}>
    <div className="wk-wereld" aria-hidden="true" />

    {/* 2. Statuseiland: tijd voor deze klant, voortgang als bolletjes en het niveau. */}
    <div className={`ck-zone-status ck-glas wk-status${beloning !== null || einde ? ' is-open' : ''}`}>
      <b className="wk-tijd" aria-label={`${seconds} seconden voor deze klant`}>{seconds} s</b>
      <span className="wk-scheid" aria-hidden="true" />
      <span className="wk-stippen" role="img" aria-label={`${score} klanten geholpen`}>
        {Array.from({ length: STIPPEN }, (_, i) => <span key={i} className={`ck-stip${i < klaar ? ' ck-stip--klaar' : ''}${started && i === klaar ? ' ck-stip--nu' : ''}`} />)}
      </span>
      {!started && onLevel
        ? <button type="button" className="ck-niveau wk-niveau" aria-label={`Niveau ${level}, tik voor een ander niveau`} onClick={() => onLevel(MATH_LEVELS[level % MATH_LEVELS.length])}>Niveau {level}</button>
        : <span className="ck-niveau">Niveau {level}</span>}
      <span className="ck-status-extra" aria-live="polite">{einde ? <><span className="wk-scheid" /><span className="ck-munt wk-munt" aria-hidden="true" /><b className="wk-plus">{einde.saved ? `+${einde.reward}` : '…'}</b><span>{statistics.current.correct} klanten</span></> : beloning !== null && <><span className="wk-scheid" /><b className="wk-plus">+1</b>{beloning && <><span className="wk-kaartje" aria-hidden="true">★</span><span>{beloning}</span></>}</>}</span>
    </div>

    {/* 4. Gereedschap: alleen wat dit spel nodig heeft. Een rekenmachine zou de race wegnemen. */}
    <div className="ck-zone-gereedschap ck-glas wk-gereedschap" role="toolbar" aria-label="Gereedschap">
      <button type="button" className={`ck-gereedschap${hint ? ' is-aan' : ''}`} aria-label="Hint van Baby Lua" aria-pressed={hint} disabled={!started} onClick={() => setHint(value => !value)}><Lightbulb size={22} aria-hidden="true" /></button>
      {onToggleSound && <><span className="wk-lijn" aria-hidden="true" />
        <button type="button" className={`ck-gereedschap${sound ? ' is-aan' : ''}`} aria-label={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} aria-pressed={!!sound} onClick={onToggleSound}>{sound ? <Volume2 size={22} aria-hidden="true" /> : <VolumeX size={22} aria-hidden="true" />}</button></>}
    </div>

    {/* 7. Speelveld: de band, met de prijzen aan de boodschappen zelf. */}
    <div className="wk-speelveld">
      <CheckoutConveyor key={order.current} question={question} progress={travel} running={started && !finished.current} falling={falling} />
      {started && !falling && <div className="wk-vracht" style={{ left: `${vrachtX}%` }}>
        <div ref={doel} className={`ck-doel wk-doel${over ? ' is-over' : ''}`} aria-hidden="true" />
        <div className="wk-som ck-glas" role="status" aria-label={question.prompt}>{som}</div>
        <div className="wk-kaartjes">{kaartjes.map((kaart, i) => <div className="ck-hangkaartje wk-hangkaartje" key={i} style={{ animationDelay: `${-i * 1.2}s` }}>
          <span className="ck-hangkaartje__touw" /><span className="ck-hangkaartje__label ck-glas">{kaart.tekst}{kaart.onder && <small>{kaart.onder}</small>}</span>
        </div>)}</div>
      </div>}
    </div>

    {/* 5. Personage linksonder: Lua stelt de vraag. */}
    <div className={`ck-zone-personage wk-personage${blij || (einde && uitslag?.passed) ? ' is-blij' : ''}`}>
      <img className="ck-ballon__gezicht" src={lua.beeld} alt={lua.naam} />
      <p className="ck-ballon__tekst" role="status" key={zin}><span className="ck-ballon__naam">BABY LUA</span>{zin}</p>
    </div>

    {/* 6. Antwoorden rechtsonder: tik een bel of sleep hem naar de boodschappen. Voor de start één hoofdknop. */}
    <div className="ck-zone-antwoord wk-antwoord">
      {einde ? <div className="wk-einde">
          {!einde.saved ? <button className="ck-knop ck-knop--hoofd" type="button" onClick={einde.onRetrySave}>Opnieuw opslaan</button>
            : <>{uitslag?.passed && level < 5 && <button className="ck-knop ck-knop--zacht" type="button" onClick={einde.onReplay}>Nog een keer</button>}
              <button className="ck-knop ck-knop--hoofd" type="button" onClick={uitslag?.passed && level < 5 ? einde.onNext : einde.onReplay}>{uitslag?.passed && level < 5 ? `Naar niveau ${level + 1}` : 'Nog een keer'}</button></>}
        </div>
        : !started ? <button className="ck-knop ck-knop--hoofd" type="button" onClick={begin}>Open de winkel</button>
        : <div className="wk-bellen" role="group" aria-label="Antwoorden" key={order.current}>
          {question.options.map((value, i) => <DragChoice key={value} value={value} label={`€${value}`} className={`ck-bel ck-glas ck-bel--${i + 1}${wrong === value ? ' is-fout' : ''}`}
            disabled={finished.current || falling} targetRef={doel} onOver={setOver} onChoose={answer} onDrop={value => answer(value)}>
            <span className="ck-bel__kern" aria-hidden="true" /><span data-waarde={value}>{value}</span>
          </DragChoice>)}
        </div>}
    </div>
  </section>;
}
