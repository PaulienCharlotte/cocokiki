import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Highlighter, Info, X } from 'lucide-react';
import MathHelp from './MathHelp';
import { REDACTIE_TYPEN, REDACTIE_TYPEN_BY_ID, type Steun } from './redactie/catalogus';
import { euro, evalueerSom, planOpties, somTekst, type Redactiesom } from './redactie/types';

/**
 * Een redactiesom, in de volgorde waarin je hem hoort aan te pakken.
 *
 * 1. De getallen aanstrepen die je nodig hebt — de markeerstift van school.
 * 2. Zelf bedenken wat de eerste stap is, vóór je gaat rekenen. Daar zit het
 *    denkwerk; krijg je het plan cadeau, dan oefen je alleen hoofdrekenen.
 * 3. Rekenen. Een fout antwoord houdt je niet tegen: je rekent verder met
 *    je eigen getal, net als op papier.
 * 4. Nakijken. Pas hier zie je waar het misliep, en welk soort som dit was.
 *
 * Vastlopen hoeft niet: de tip van Lua heeft drie treden, van 'wat zoek je'
 * naar de aanpak naar de eerste som. Zie docs/redactiesommen.md.
 */
const GETAL = /(\d+(?:[.,]\d+)?)/g;
/** Zo lang staat de laatste tip op slot: even denken voor je hem opent. */
const DENKTIJD_MS = 3000;

type Fase = 'markeren' | 'plan' | 'rekenen' | 'nakijken';

const schrijf = (waarde: number, euroTeken?: boolean) => (euroTeken ? euro(waarde) : String(waarde));

export default function RedactieChallenge({ question, steun, locked, onAnswer, onVerder }: {
  question: Redactiesom; steun: Steun; locked: boolean;
  onAnswer: (value: number, geldig: boolean) => void; onVerder: () => void;
}) {
  const [gemarkeerd, setGemarkeerd] = useState<number[]>([]);
  const [mis, setMis] = useState<number[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [antwoorden, setAntwoorden] = useState<Array<number | null>>([]);
  const [waarde, setWaarde] = useState('');
  const [fase, setFase] = useState<Fase>('markeren');
  const [trede, setTrede] = useState(0);
  const [mag3, setMag3] = useState(false);
  const [soort, setSoort] = useState<string | null>(null);
  const [uitleg, setUitleg] = useState<string | null>(null);

  const delen = useMemo(() => question.prompt.split(GETAL), [question.prompt]);
  const nodig = useMemo(() => new Set(question.nodig), [question.nodig]);
  const teGaan = delen.reduce((aantal, deel, i) => aantal + (nodig.has(deel) && !gemarkeerd.includes(i) ? 1 : 0), 0);
  const stap = question.stappen[index];
  const type = REDACTIE_TYPEN_BY_ID[question.typeId];
  // Op het laagste niveau krijg je het plan nog; daarna bedenk je het zelf.
  const planZelf = steun !== 'volledig';
  const opties = useMemo(() => planOpties(question.stappen[0].som, question.id), [question]);

  useEffect(() => { if (teGaan === 0 && fase === 'markeren') setFase(planZelf ? 'plan' : 'rekenen'); }, [teGaan, fase, planZelf]);
  useEffect(() => {
    if (trede < 2) return;
    const timer = window.setTimeout(() => setMag3(true), DENKTIJD_MS);
    return () => window.clearTimeout(timer);
  }, [trede]);

  const tik = (deel: string, i: number) => {
    if (nodig.has(deel)) setGemarkeerd(lijst => (lijst.includes(i) ? lijst : [...lijst, i]));
    else setMis(lijst => (lijst.includes(i) ? lijst : [...lijst, i]));
  };

  const kiesPlan = (optie: string) => {
    setPlan(optie);
    if (optie === question.stappen[0].som) setFase('rekenen');
    else setTrede(trede => Math.max(trede, 1));
  };

  const verstuur = (event: React.FormEvent) => {
    event.preventDefault();
    if (waarde.trim() === '') return;
    const getal = Number(waarde.replace(',', '.'));
    if (!Number.isFinite(getal)) return;
    const volgende = [...antwoorden, getal];
    setAntwoorden(volgende);
    setWaarde('');
    setTrede(0); setMag3(false);
    if (index < question.stappen.length - 1) { setIndex(index + 1); return; }
    setFase('nakijken');
    onAnswer(getal, Math.abs(getal - question.answer) < 0.005);
  };

  /** Per stap: klopt het met de getallen die het kind zélf heeft ingevuld? */
  const oordeel = question.stappen.map((item, i) => {
    const gegeven = antwoorden[i];
    if (gegeven === undefined || gegeven === null) return null;
    const hoort = evalueerSom(item.som, antwoorden.slice(0, i), item.afronden);
    return hoort !== null && Math.abs(gegeven - hoort) < 0.005;
  });
  const eersteFout = oordeel.findIndex(goed => goed === false);
  const helemaalGoed = antwoorden.length > 0 && Math.abs((antwoorden.at(-1) ?? NaN) - question.answer) < 0.005;

  const tipTekst = trede === 1
    ? `Kijk nog eens naar wat je weet. Je zoekt ${question.zoek}.`
    : trede === 2 ? type?.aanpak ?? question.hint
    : stap?.tip ?? '';

  const verhaal = <p className="redactie-verhaal">
    {/* Split met een vangende groep wisselt tekst en getal af, dus een deel
        dat met een cijfer begint ís het getal. */}
    {delen.map((deel, i) => (/^\d/.test(deel)
      ? <button
          key={i} type="button"
          className={`redactie-getal${gemarkeerd.includes(i) ? ' is-nodig' : ''}${mis.includes(i) ? ' is-mis' : ''}`}
          aria-pressed={gemarkeerd.includes(i)}
          disabled={fase !== 'markeren' || gemarkeerd.includes(i)}
          onClick={() => tik(deel, i)}
        >{deel}</button>
      : <span key={i}>{deel}</span>))}
  </p>;

  if (fase === 'nakijken') return <div className="redactie">
    {verhaal}
    {/* Eén kaart: de stappen, het oordeel en de terugblik horen bij elkaar.
        Losse blokjes onder elkaar lezen als rommel. */}
    <div className="redactie-uitslag">
      <ol className="redactie-nakijk">
        {question.stappen.map((item, i) => <li key={i} className={oordeel[i] ? 'is-goed' : 'is-mis'}>
          {oordeel[i] ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
          <span>{somTekst(question.stappen, i, question.stappen.length, true, antwoorden)} = <strong>{schrijf(antwoorden[i] ?? 0, item.soort === 'euro')}</strong></span>
          <small>{item.eenheid}</small>
          {!oordeel[i] && <em>hier hoort {schrijf(evalueerSom(item.som, antwoorden.slice(0, i), item.afronden) ?? item.antwoord, item.soort === 'euro')}</em>}
        </li>)}
      </ol>
      <p className="redactie-oordeel" role="status">
        {helemaalGoed ? 'Helemaal goed gerekend.'
          : eersteFout >= 0 && eersteFout < question.stappen.length - 1 && oordeel.slice(eersteFout + 1).every(Boolean)
            ? `Het ging mis bij stap ${eersteFout + 1}. Daarna heb je met jouw eigen getal wél goed doorgerekend.`
            : `Het juiste antwoord is ${schrijf(question.answer, question.stappen.at(-1)?.soort === 'euro')}.`}
      </p>

      {type && <div className="redactie-aanpak">
        {soort === null
          ? <>
              <p className="redactie-aanpak__naam">Wat voor soort som was dit?</p>
              <div className="redactie-soorten">
                {REDACTIE_TYPEN.slice(0, 4).map(keuze => <span key={keuze.id} className="redactie-soort">
                  <button type="button" onClick={() => setSoort(keuze.id)}>{keuze.naam}</button>
                  {/* Hoveren of tikken legt uit wat voor som dat is: de namen
                      zeggen pas iets als je weet waar ze voor staan. */}
                  <button
                    type="button" className="redactie-soort__info" aria-label={`Wat is een ${keuze.naam.toLowerCase()}?`}
                    aria-expanded={uitleg === keuze.id}
                    onMouseEnter={() => setUitleg(keuze.id)} onMouseLeave={() => setUitleg(null)}
                    onFocus={() => setUitleg(keuze.id)} onBlur={() => setUitleg(null)}
                    onClick={() => setUitleg(uitleg === keuze.id ? null : keuze.id)}
                  ><Info size={15} aria-hidden="true" /></button>
                </span>)}
              </div>
              {uitleg && <p className="redactie-soort__uitleg" role="status">
                <strong>{REDACTIE_TYPEN_BY_ID[uitleg]?.naam}:</strong> {REDACTIE_TYPEN_BY_ID[uitleg]?.aanpak}
              </p>}
            </>
          : <>
              <p className="redactie-aanpak__naam">{soort === type.id ? type.naam : `Het was een ${type.naam.toLowerCase()}`}</p>
              <p>{type.aanpak}</p>
              <p className="redactie-aanpak__controle">{question.controle}</p>
            </>}
      </div>}
      {soort !== null && <button type="button" className="redactie-verder" onClick={onVerder}>Volgende som<ArrowRight size={18} aria-hidden="true" /></button>}
    </div>
  </div>;

  return <div className="redactie">
    {verhaal}

    {fase === 'markeren' && <p className="redactie-opdracht" role="status">
      <Highlighter size={18} aria-hidden="true" />
      Streep de getallen aan die je nodig hebt{steun === 'volledig' ? ` — er zijn er nog ${teGaan}` : ''}.
    </p>}

    {fase === 'plan' && <div className="redactie-plan">
      <p className="redactie-opdracht">Wat doe je als eerste?</p>
      <div className="redactie-plan__keuzes">
        {opties.map(optie => <button
          key={optie} type="button"
          className={plan === optie && optie !== question.stappen[0].som ? 'is-mis' : undefined}
          onClick={() => kiesPlan(optie)}
        >{optie}</button>)}
      </div>
      {plan !== null && plan !== question.stappen[0].som && <p className="redactie-tip" role="status">Nog niet. Vraag een tip als je er niet uitkomt.</p>}
    </div>}

    {fase === 'rekenen' && <form className="math-workbench" onSubmit={verstuur}>
      <ol className="story-stappen">
        {question.stappen.map((item, i) => {
          const klaar = i < index, nu = i === index;
          if (!klaar && !nu && steun !== 'volledig') return null;
          return <li key={i} className={klaar ? 'is-klaar' : nu ? 'is-nu' : 'is-later'}>
            <span className="story-stappen__kop">Stap {i + 1}{klaar || nu ? ` · ${item.vraag}` : ''}</span>
            <span className="math-workbench__equation">
              {!item.verborgen && <span>{somTekst(question.stappen, i, index, false, antwoorden)} =</span>}
              {klaar
                ? <output>{schrijf(antwoorden[i] ?? 0, item.soort === 'euro')}</output>
                : nu
                  ? <input
                      aria-label={item.vraag} autoFocus inputMode="decimal" type="text"
                      value={waarde} onChange={event => setWaarde(event.target.value)} required
                    />
                  : <output aria-label="nog niet aan de beurt">?</output>}
            </span>
            <small className="redactie-eenheid">{item.eenheid}</small>
          </li>;
        })}
      </ol>
      <button type="submit" disabled={waarde.trim() === ''}>
        {index === question.stappen.length - 1 ? 'Dit is het antwoord' : 'Volgende stap'}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </form>}

    {!locked && fase !== 'markeren' && <MathHelp open={trede > 0} onToggle={() => setTrede(trede > 0 ? 0 : 1)}>
      {tipTekst}
      {trede < 3 && <button type="button" className="redactie-meer" disabled={trede === 2 && !mag3}
        onClick={() => setTrede(trede + 1)}>
        {trede === 2 ? (mag3 ? 'Laat de eerste som zien' : 'Denk er nog even over…') : 'Nog een tip'}
      </button>}
    </MathHelp>}
  </div>;
}
