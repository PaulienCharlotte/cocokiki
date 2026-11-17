import { rewardAnswer } from '../../services/answerRewards';
import { muntenPerAntwoord } from './progress';
import { IconButton, Button } from '../../design-system';
import HulpPaneel from '../../components/ui/HulpPaneel';
import InfoKnop from '../../components/ui/InfoKnop';
import NiveauKnop from '../../components/ui/NiveauKnop';
import { BookOpen, Calculator, Lightbulb, Ruler, Volume2, VolumeX } from 'lucide-react';
import NiveauPaneel from './NiveauPaneel';
import { afgerondeRedactieronde, noteerRedactieAntwoord, type RedactieAntwoorden } from './redactie/navigatie';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTERS } from '../../data/characters';
import Rekenmachine from './Rekenmachine';
import Maten from './Maten';
import { MATH_LEVELS } from './types';
import { resultStatus } from './engine';
import './rekenspel.css';
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
import type { Blad } from './redactie/bladen';
import { bewaarBlad, laadBladen } from './redactie/bladVoortgang';
import { maakMatendeck, type Maatvraag } from './maten/vragen';
import MatenChallenge from './MatenChallenge';
import { techniqueHint } from './techniqueHint';

import { useActivityAnalytics } from '../../services/useActivityAnalytics';
import { analytics } from '../../services/analytics';

/** Wat er na de ronde gebeurt; MathModule bewaart de munten en levert dit. */
export interface RekenEinde { result: MathResult; reward: number; saved: boolean; onRetrySave: () => void; onReplay: () => void; onNext: () => void; onBack: () => void }

/**
 * Een rekenspel in de huisstijl (docs/HUISSTIJL.md): de vaste zones uit
 * cocokiki-tokens.css. Statuseiland met tien bolletjes en het niveau,
 * gereedschap rechts, Lua linksonder, antwoorden als bellen rechtsonder, en
 * het spel zelf in de wereld. Geen witte panelen en geen tussenvenster aan
 * het eind: de ronde sluit af in het spel.
 */
export default function MathSession({ game, level, blad, onFinish, onSound = () => undefined, onVraag, sound, onToggleSound, onLevel, einde }: {
  game: Exclude<MathGameId, 'race'>; level: MathLevel; blad?: Blad; onFinish: (result: MathResult) => void; onSound?: (correct: boolean) => void; onVraag?: (vraag: string) => void;
  sound?: boolean; onToggleSound?: () => void; onLevel?: (level: MathLevel) => void; einde?: RekenEinde;
}) {
  const [bladOpen, setBladOpen] = useState(false);
  const [rekenmachine, setRekenmachine] = useState(false), [maten, setMaten] = useState(false), [niveauKiezen, setNiveauKiezen] = useState(false);
  useActivityAnalytics(game === 'maten' ? null : `math:${game}`);
  // Een huiswerkblad heeft vaste sommen; anders komt er elke ronde een nieuw deck.
  const [questions] = useState(() => blad ? blad.sommen : game === 'add-subtract' ? maakRedactiedeck(level) : game === 'maten' ? maakMatendeck(level) : createQuestionDeck(game, level));
  // Op een blad ga je verder waar je gebleven was.
  const [bewaard] = useState<RedactieAntwoorden>(() => blad ? laadBladen()[blad.nr] ?? {} : {});
  const eerste = Math.max(0, questions.findIndex((_, i) => !Object.hasOwn(bewaard, i)));
  const [index, setIndex] = useState(eerste);
  const [bezocht, setBezocht] = useState([eerste]);
  const redactieAntwoorden = useRef<RedactieAntwoorden>(bewaard);
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
      if (valid) rewardAnswer(`math:${game}`, stats.current.roundId, index, muntenPerAntwoord(game, level));
      redactieAntwoorden.current = noteerRedactieAntwoord(redactieAntwoorden.current, index, valid);
      if (blad) bewaarBlad(blad.nr, redactieAntwoorden.current);
      answered.current = true; setFeedback(valid ? 'correct' : 'wrong');
      return;
    }
    if (valid) {
      answered.current = true; setFeedback('correct');
      rewardAnswer(`math:${game}`, stats.current.roundId, index, muntenPerAntwoord(game, level));
      stats.current.solved++;
      if (!hadMistake.current) { stats.current.correct++; stats.current.score++; }
    } else { hadMistake.current = true; stats.current.mistakes++; setFeedback('wrong'); setHint(true); }
  };
  const klaar = foutenMogen ? Object.keys(redactieAntwoorden.current).length : index + (feedback === 'correct' ? 1 : 0);
  const lua = CHARACTERS.lua;
  const uitslag = einde ? resultStatus(game, level, einde.result) : null;
  // Lua zegt de opdracht; bij de honingpotten zegt het plaatje het al, en
  // daar praat ze alleen bij een tip, een fout of aan het eind.
  const zin = einde
    ? blad !== undefined ? `Blad ${blad.nr} is af. ${einde.result.correct} van de ${einde.result.total} goed.`
      : uitslag?.passed ? (level < 5 ? 'Goed gerekend. Klaar voor het volgende niveau?' : 'Goed gerekend. Alles gehaald.') : `${einde.result.correct} van de 10 meteen goed. Nog een keer?`
    : !foutenMogen && feedback === 'wrong' ? (game === 'divide' ? 'Nog niet evenveel. Verplaats een bes.' : techniqueHint(question))
    : !foutenMogen && feedback === 'correct' ? (game === 'divide' ? `${question.a} ÷ ${question.groups} = ${question.answer}. Eerlijk verdeeld.` : 'Goed zo.')
    : hint && !foutenMogen ? techniqueHint(question)
    : toneel ? ''
    : game === 'missing' ? cookieOrder(question)
    // Bij een redactiesom staat het verhaal op het werkblad, want daar
    // streep je de getallen in aan. Lua zegt dan wat je zoekt.
    : game === 'add-subtract' ? ''
    : question.prompt;
  return <section ref={workspace} onKeyDownCapture={() => { keyboard.current = true; }} onPointerDownCapture={() => { keyboard.current = false; }}
    className={`ck-scherm rekenspel rekenspel--${game}${feedback ? ` is-${feedback}` : ''}${einde ? ' is-einde' : ''}`} data-wereld="school" aria-label="Rekenavontuur">

    {/* 2. Statuseiland: tien bolletjes voor tien opdrachten, en het niveau.
        Bij een redactieblad kun je op een bolletje tikken om terug te kijken. */}
    {game !== 'add-subtract' && <>
    <div className={`ck-zone-status ck-glas rekenspel__status${einde ? ' is-open' : ''}`}>
      <span className="rekenspel__stippen" role={foutenMogen ? 'group' : 'img'} aria-label={`Opdracht ${index + 1} van ${questions.length}, ${klaar} klaar`}>
        {questions.map((_, i) => {
          const vol = foutenMogen ? Object.hasOwn(redactieAntwoorden.current, i) : i < klaar;
          const cls = `ck-stip${vol ? ' ck-stip--klaar' : ''}${i === index && !einde ? ' ck-stip--nu' : ''}`;
          return foutenMogen ? <button type="button" key={i} className={`${cls} rekenspel__stip-knop`} aria-label={`Som ${i + 1}${vol ? ', gemaakt' : ''}`} aria-current={i === index} onClick={() => blader(i)} /> : <span key={i} className={cls} />;
        })}
      </span>
      {blad && <span className="rekenspel__blad">Blad {blad.nr}</span>}
      {/* Het niveau is altijd te kiezen: tik op het label voor het paneel met de vijf niveaus. */}

      <span className="ck-status-extra" aria-live="polite">{einde && einde.saved && <><span className="rekenspel__scheid" /><span className="ck-munt rekenspel__munt" aria-hidden="true" /><b>+{einde.reward}</b></>}</span>
    </div>
    </>}
    {game === 'add-subtract' && <>
    {bladOpen && <HulpPaneel titel={blad ? `Blad ${blad.nr}` : 'Mijn sommen'} sluitLabel="Somnavigatie sluiten" onClose={() => setBladOpen(false)}><div className="redactie-bladkeuze">{questions.map((_, i) => <Button key={i} variant={i === index ? 'secondary' : 'quiet'} aria-current={i === index ? 'step' : undefined} onClick={() => { blader(i); setBladOpen(false); }}>Som {i + 1}{Object.hasOwn(redactieAntwoorden.current, i) ? ' ✓' : ''}</Button>)}</div></HulpPaneel>}</>}

    {/* 4. Gereedschap in de vaste volgorde: hint · rekenmachine · maten — geluid */}
    <div className="ck-zone-gereedschap ck-glas rekenspel__gereedschap" role="toolbar" aria-label="Gereedschap">
      {game === 'add-subtract' && <IconButton className="ck-gereedschap redactie-boek" label={`${blad ? `Blad ${blad.nr}, ` : ''}som ${index + 1} van ${questions.length}, kies een som`} icon={<><BookOpen /><small>{index + 1}</small></>} onClick={() => setBladOpen(true)} />}
      <InfoKnop character="lua">Markeer eerst de getallen die je nodig hebt. Kies daarna je som en reken hem uit. Het hersentje kiest je niveau. Bij redactiesommen kun je de rekenmachine en het meetlatje gebruiken; het boekje kiest een andere som.</InfoKnop>
      {onLevel && <NiveauKnop niveau={level} onClick={() => setNiveauKiezen(true)} />}
      {!foutenMogen && <button type="button" className={`ck-gereedschap${hint || feedback === 'wrong' ? ' is-aan' : ''}`} aria-label="Tip van Baby Lua" aria-pressed={hint} disabled={feedback === 'correct' || !!einde} onClick={() => setHint(value => !value)}><Lightbulb size={22} aria-hidden="true" /></button>}
      {game === 'add-subtract' && <button type="button" className={`ck-gereedschap${rekenmachine ? ' is-aan' : ''}`} aria-label="Rekenmachine" aria-haspopup="dialog" onClick={() => setRekenmachine(true)}><Calculator size={22} aria-hidden="true" /></button>}
      <button type="button" className={`ck-gereedschap${maten ? ' is-aan' : ''}`} aria-label="Maten omrekenen" aria-haspopup="dialog" onClick={() => setMaten(true)}><Ruler size={22} aria-hidden="true" /></button>
      {onToggleSound && <><span className="rekenspel__lijn" aria-hidden="true" /><button type="button" className={`ck-gereedschap${sound ? ' is-aan' : ''}`} aria-label={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} aria-pressed={!!sound} onClick={onToggleSound}>{sound ? <Volume2 size={22} aria-hidden="true" /> : <VolumeX size={22} aria-hidden="true" />}</button></>}
    </div>
    {rekenmachine && <Rekenmachine som={question.prompt} onClose={() => setRekenmachine(false)} />}
    {maten && <Maten onClose={() => setMaten(false)} />}
    {niveauKiezen && onLevel && <NiveauPaneel game={game} level={level} onKies={onLevel} onClose={() => setNiveauKiezen(false)} />}

    {/* 7. Speelveld: het spel zelf. Antwoordbellen zetten de spellen in zone 6. */}
    <div className={`rekenspel__veld math-challenge math-challenge--${question.kind}`} key={foutenMogen ? 'redactie' : question.id}>
      {game === 'divide' && question.kind === 'distribution' ? <><img className="adventure-plant adventure-plant--left" src={mathAssets.strawberryPlant} alt="" /><img className="adventure-plant adventure-plant--right" src={mathAssets.blueberryPlant} alt="" /><DistributionChallenge question={question} locked={feedback === 'correct' || !!einde} onAnswer={answer} tutorial={index === 0} /></>
        : game === 'add-subtract' ? bezocht.map(i => <div key={questions[i].id} hidden={i !== index}><RedactieChallenge question={questions[i] as Redactiesom} steun={steunVoorNiveau(level)} niveau={level} locked={Object.hasOwn(redactieAntwoorden.current, i)} onAnswer={(value, valid) => { if (i === index) answer(value, valid); }} onVerder={volgende} /></div>)
        : game === 'maten' ? <MatenChallenge vraag={question as Maatvraag} locked={feedback === 'correct' || !!einde} gekozen={selected} onAnswer={answer} />
        : question.kind === 'puzzle' ? <PuzzleChallenge question={question} locked={feedback === 'correct' || !!einde} selected={selected} onAnswer={answer} />
        : question.kind === 'balance' ? <BalanceChallenge question={question} locked={feedback === 'correct' || !!einde} onAnswer={answer} />
        : <ChoiceChallenge question={question} locked={feedback === 'correct' || !!einde} selected={selected} onAnswer={answer} />}
    </div>

    {/* 5. Lua linksonder */}
    {zin && <div className={`ck-zone-personage rekenspel__personage${feedback === 'correct' || (einde && uitslag?.passed) ? ' is-blij' : ''}`}>
      <img className="ck-ballon__gezicht" src={lua.beeld} alt={lua.naam} />
      <p className="ck-ballon__tekst" role="status" key={zin}><span className="ck-ballon__naam">BABY LUA</span>{zin}</p>
    </div>}

    {/* 6. Aan het eind: één hoofdknop, hooguit een zachte knop ernaast */}
    {einde && <div className="ck-zone-antwoord rekenspel__einde">
      {!einde.saved ? <button type="button" className="ck-knop ck-knop--hoofd" onClick={einde.onRetrySave}>Opnieuw opslaan</button>
        : blad ? <><button type="button" className="ck-knop ck-knop--zacht" onClick={einde.onReplay}>Blad opnieuw</button><button type="button" className="ck-knop ck-knop--hoofd" onClick={einde.onBack}>Naar de bladen</button></>
        : uitslag?.passed && level < 5 ? <><button type="button" className="ck-knop ck-knop--zacht" onClick={einde.onReplay}>Nog een keer</button><button type="button" className="ck-knop ck-knop--hoofd" onClick={einde.onNext}>Naar niveau {level + 1}</button></>
        : <button type="button" className="ck-knop ck-knop--hoofd" onClick={einde.onReplay}>Nog een keer</button>}
    </div>}
  </section>;
}
