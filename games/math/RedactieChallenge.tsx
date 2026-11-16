import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Highlighter, Info, X } from 'lucide-react';
import MathHelp from './MathHelp';
import ChoiceList from '../../components/ui/ChoiceList';
import { REDACTIE_TYPEN_BY_ID, soortKeuzes, type Steun } from './redactie/catalogus';
import { euro, evalueerSom, getal, somTekst, type Redactiesom, type Stap } from './redactie/types';
import { bouwGetallen, leesSom, somKiesbaar, somOpties, steunvormVoorNiveau, TEKENS, tussenvraagZichtbaar, waarom, wedervraag, zelfdeSom, type Som, type Teken } from './redactie/somKeuze';
import type { MathLevel } from './types';

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
const GETAL = /(\d+(?:[.,]\d+)*)/g;
/** Zo lang staat de laatste tip op slot: even denken voor je hem opent. */
const DENKTIJD_MS = 3000;

type Fase = 'markeren' | 'soort' | 'plan' | 'rekenen' | 'nakijken';

/** Een antwoord opschrijven zoals het bij die stap hoort: € 2,50, 7.20 of een naam. */
const schrijf = (waarde: number, stap?: Stap) => (
  stap?.keuzes ? stap.keuzes[waarde] ?? '?'
    : stap?.soort === 'euro' ? euro(waarde)
    : stap?.soort === 'tijd' ? waarde.toFixed(2)
    : getal(waarde));
/** Wat er bij een stap hoort; een som die niet na te rekenen is (een kloktijd, een keuze) telt het vaste antwoord. */
const hoortBij = (stap: Stap, eerdere: Array<number | null>) => evalueerSom(stap.som, eerdere, stap.afronden) ?? stap.antwoord;

export default function RedactieChallenge({ question, steun, niveau = 1, locked, onAnswer, onVerder }: {
  question: Redactiesom; steun: Steun; niveau?: MathLevel; locked: boolean;
  onAnswer: (value: number, geldig: boolean) => void; onVerder: () => void;
}) {
  const [gemarkeerd, setGemarkeerd] = useState<number[]>([]);
  const [mis, setMis] = useState<number[]>([]);
  // Per stap bedenkt het kind eerst zelf de som (zie redactie/somKeuze.ts).
  const [somKlaar, setSomKlaar] = useState(false);
  const [somFout, setSomFout] = useState<string | null>(null);
  const [gebouwd, setGebouwd] = useState<{ links: string | null; teken: Teken | null; rechts: string | null }>({ links: null, teken: null, rechts: null });
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
  const steunvorm = steunvormVoorNiveau(niveau);
  // De som van deze stap, met de uitkomsten van eerdere stappen ingevuld.
  const somNu = stap ? somTekst(question.stappen, index, index, false, antwoorden) : '';
  const juist = useMemo(() => leesSom(somNu), [somNu]);
  const kiesbaar = !!stap && somKiesbaar(stap, somNu);
  const sleutel = `${question.id}:${index}`;
  const opties = useMemo(() => juist && steunvorm !== 'bouw' ? somOpties(juist, steunvorm === 'kies-twee' ? 2 : 4, sleutel) : [], [juist, steunvorm, sleutel]);
  const getallen = useMemo(() => juist && steunvorm === 'bouw' ? bouwGetallen(juist, [...question.nodig, ...antwoorden.map((a, i) => a === null ? '' : schrijf(a, question.stappen[i]))], sleutel) : [], [juist, steunvorm, sleutel, question, antwoorden]);
  const probeerSom = (som: Som | null, tekst: string) => {
    if (som && juist && zelfdeSom(som, juist)) { setSomKlaar(true); setSomFout(null); return; }
    setSomFout(tekst); setGebouwd({ links: null, teken: null, rechts: null });
  };
  const legNeer = (stuk: string, isTeken: boolean) => {
    const volgende = isTeken ? { ...gebouwd, teken: stuk as Teken } : gebouwd.links === null ? { ...gebouwd, links: stuk } : gebouwd.rechts === null ? { ...gebouwd, rechts: stuk } : gebouwd;
    setGebouwd(volgende); setSomFout(null);
    if (volgende.links && volgende.teken && volgende.rechts) probeerSom({ links: volgende.links, teken: volgende.teken, rechts: volgende.rechts }, `${volgende.links} ${volgende.teken} ${volgende.rechts}`);
  };

  // Na het aanstrepen meteen naar rekenen: welke som je maakt, bedenk je per stap zelf.
  const naMarkeren: Fase = question.vraagSoort && planZelf ? 'soort' : 'rekenen';
  useEffect(() => { if (teGaan === 0 && fase === 'markeren') setFase(naMarkeren); }, [teGaan, fase, naMarkeren]);
  useEffect(() => {
    if (trede < 2) return;
    const timer = window.setTimeout(() => setMag3(true), DENKTIJD_MS);
    return () => window.clearTimeout(timer);
  }, [trede]);

  const tik = (deel: string, i: number) => {
    if (nodig.has(deel)) setGemarkeerd(lijst => (lijst.includes(i) ? lijst : [...lijst, i]));
    else setMis(lijst => (lijst.includes(i) ? lijst : [...lijst, i]));
  };

  /** Herkennen wat voor som dit is; dat scheelt je het bedenken van de stap. */
  const kiesSoort = (keuze: string) => {
    setSoort(keuze);
    if (keuze === question.typeId) { setFase('rekenen'); setUitleg(null); return; }
    setUitleg(keuze);
  };

  const verstuur = (event: React.FormEvent) => {
    event.preventDefault();
    if (waarde.trim() === '') return;
    // Een kloktijd mag ook met een dubbele punt: 7:20 is 7.20.
    lever(Number(waarde.replace(',', '.').replace(':', '.')));
  };

  const lever = (getal: number) => {
    if (!Number.isFinite(getal)) return;
    const volgende = [...antwoorden, getal];
    setAntwoorden(volgende);
    setWaarde('');
    setTrede(0); setMag3(false);
    setSomKlaar(false); setSomFout(null); setGebouwd({ links: null, teken: null, rechts: null });
    if (index < question.stappen.length - 1) { setIndex(index + 1); return; }
    setFase('nakijken');
    onAnswer(getal, Math.abs(getal - question.answer) < 0.005);
  };

  /** Per stap: klopt het met de getallen die het kind zélf heeft ingevuld? */
  const oordeel = question.stappen.map((item, i) => {
    const gegeven = antwoorden[i];
    if (gegeven === undefined || gegeven === null) return null;
    return Math.abs(gegeven - hoortBij(item, antwoorden.slice(0, i))) < 0.005;
  });
  const eersteFout = oordeel.findIndex(goed => goed === false);
  // Alleen helemaal goed als élke stap klopte. Het eindantwoord kan per
  // ongeluk goed uitkomen terwijl er onderweg iets misging.
  const eindGoed = antwoorden.length > 0 && Math.abs((antwoorden.at(-1) ?? NaN) - question.answer) < 0.005;
  const helemaalGoed = eindGoed && oordeel.every(goed => goed !== false);

  const tipTekst = trede === 1
    ? `Kijk nog eens naar wat je weet. Je zoekt ${question.zoek}.`
    : trede === 2 ? type?.aanpak ?? question.hint
    : stap?.tip ?? '';

  const verhaal = <>{question.beeld && <img className="redactie-beeld" src={question.beeld} alt="" />}<p className="redactie-verhaal">
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
  </p></>;

  if (fase === 'nakijken') return <div className="redactie">
    {verhaal}
    {/* Eén kaart: de stappen, het oordeel en de terugblik horen bij elkaar.
        Losse blokjes onder elkaar lezen als rommel. */}
    <div className="redactie-uitslag">
      <ol className="redactie-nakijk">
        {question.stappen.map((item, i) => <li key={i} className={oordeel[i] ? 'is-goed' : 'is-mis'}>
          {oordeel[i] ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
          <span>{item.verborgen ? item.vraag : `${somTekst(question.stappen, i, question.stappen.length, true, antwoorden)} =`} <strong>{schrijf(antwoorden[i] ?? 0, item)}</strong></span>
          <small>{item.eenheid}</small>
          {!oordeel[i] && <em>hier hoort {schrijf(hoortBij(item, antwoorden.slice(0, i)), item)}</em>}
        </li>)}
      </ol>
      <p className="redactie-oordeel" role="status">
        {helemaalGoed ? 'Helemaal goed gerekend.'
          : eersteFout >= 0 && eersteFout < question.stappen.length - 1 && oordeel.slice(eersteFout + 1).every(Boolean)
            ? `Het ging mis bij stap ${eersteFout + 1}. Daarna heb je met jouw eigen getal wél goed doorgerekend.${eindGoed ? ' Je eindantwoord klopt toch.' : ''}`
            : `Het juiste antwoord is ${schrijf(question.answer, question.stappen.at(-1))}.`}
      </p>

      {type && <div className="redactie-aanpak">
        <p className="redactie-aanpak__naam">{type.naam}</p>
        <p className="redactie-aanpak__controle">{question.controle}</p>
      </div>}
      <button type="button" className="redactie-verder" onClick={onVerder}>Volgende som<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  </div>;

  return <div className="redactie">
    {verhaal}

    {fase === 'markeren' && <p className="redactie-opdracht" role="status">
      <Highlighter size={18} aria-hidden="true" />
      Streep de getallen aan die je nodig hebt{niveau === 1 ? ` — er zijn er nog ${teGaan}` : ''}.
    </p>}

    {fase === 'soort' && <div className="redactie-plan">
      <p className="redactie-opdracht">Wat voor soort som is dit?</p>
      <div className="redactie-soorten">
        {soortKeuzes(question.typeId, question.id).map(keuze => <span key={keuze.id} className="redactie-soort">
          <button type="button" className={soort === keuze.id && keuze.id !== question.typeId ? 'is-mis' : undefined}
            onClick={() => kiesSoort(keuze.id)}>{keuze.naam}</button>
          <button
            type="button" className="redactie-soort__info" aria-label={`Wat is een ${keuze.naam.toLowerCase()}?`}
            aria-expanded={uitleg === keuze.id}
            onMouseEnter={() => setUitleg(keuze.id)} onMouseLeave={() => soort !== keuze.id && setUitleg(null)}
            onFocus={() => setUitleg(keuze.id)}
            onClick={() => setUitleg(uitleg === keuze.id ? null : keuze.id)}
          ><Info size={15} aria-hidden="true" /></button>
        </span>)}
      </div>
      {uitleg && <p className="redactie-soort__uitleg" role="status">
        <strong>{REDACTIE_TYPEN_BY_ID[uitleg]?.naam}:</strong> {REDACTIE_TYPEN_BY_ID[uitleg]?.aanpak}
      </p>}
    </div>}


    {fase === 'rekenen' && <form className="math-workbench" onSubmit={verstuur}>
      <ol className="story-stappen">
        {question.stappen.map((item, i) => {
          const klaar = i < index, nu = i === index;
          if (!klaar && !nu && steun !== 'volledig') return null;
          return <li key={i} className={klaar ? 'is-klaar' : nu ? 'is-nu' : 'is-later'}>
            <span className="story-stappen__kop"><b aria-hidden="true">{i + 1}</b>{klaar || (nu && tussenvraagZichtbaar(niveau)) ? item.vraag : nu ? `Stap ${i + 1}: wat reken je nu uit?` : `Stap ${i + 1}`}</span>
            {nu && kiesbaar && !somKlaar && juist ? <div className="redactie-somkeuze">
              <p className="redactie-somkeuze__vraag">{steunvorm === 'bouw' ? 'Maak de som die je nu nodig hebt.' : 'Welke som maak je nu?'}</p>
              {steunvorm === 'bouw' ? <>
                <div className="redactie-bouw" aria-label="Jouw som">
                  {(['links', 'teken', 'rechts'] as const).map(plek => <button key={plek} type="button" className={`redactie-bouw__vak${gebouwd[plek] ? ' is-vol' : ''}${plek === 'teken' ? ' is-teken' : ''}`}
                    aria-label={gebouwd[plek] ? `${gebouwd[plek]}, tik om weg te halen` : plek === 'teken' ? 'Leeg vak voor het rekenteken' : 'Leeg vak voor een getal'}
                    onClick={() => setGebouwd({ ...gebouwd, [plek]: null })}>{gebouwd[plek] ?? '?'}</button>)}
                </div>
                <div className="redactie-bouw__stukken" role="group" aria-label="Getallen">{getallen.map(g => <button key={g} type="button" className="redactie-bouw__getal" onClick={() => legNeer(g, false)}>{g}</button>)}</div>
                <div className="redactie-bouw__stukken" role="group" aria-label="Rekentekens">{TEKENS.map(t => <button key={t} type="button" className="redactie-bouw__teken" aria-label={{ '+': 'plus', '−': 'min', '×': 'keer', '÷': 'gedeeld door' }[t]} onClick={() => legNeer(t, true)}>{t}</button>)}</div>
              </> : <div className="redactie-plan__keuzes">{opties.map(optie => <button key={optie} type="button" className={somFout === optie ? 'is-mis' : undefined} onClick={() => probeerSom(leesSom(optie), optie)}>{optie}</button>)}</div>}
              {somFout && <p className="redactie-tip" role="status">{wedervraag(leesSom(somFout), juist)}</p>}
            </div>
            : <>{nu && kiesbaar && somKlaar && juist && <p className="redactie-waarom" role="status">{waarom(item, juist)}</p>}
            {/* Een latere stap toont zijn som nog niet: anders verklapt het blad welke som je straks maakt. */}
            {(klaar || nu) && <span className="math-workbench__equation">
              {!item.verborgen && <span>{somTekst(question.stappen, i, index, false, antwoorden)} =</span>}
              {klaar
                ? <output>{schrijf(antwoorden[i] ?? 0, item)}</output>
                : nu && item.keuzes
                  ? <ChoiceList label={item.vraag} choices={item.keuzes.map((keuze, k) => ({ id: String(k), label: keuze }))} onChoose={id => lever(Number(id))} />
                : nu
                  ? <input
                      aria-label={item.vraag} autoFocus inputMode="decimal" type="text"
                      placeholder={item.soort === 'tijd' ? '0.00' : undefined}
                      value={waarde} onChange={event => setWaarde(event.target.value)} required
                    />
                  : <output aria-label="nog niet aan de beurt">?</output>}
            </span>}
            {(klaar || nu) && <small className="redactie-eenheid">{item.eenheid}</small>}</>}
          </li>;
        })}
      </ol>
      {!stap?.keuzes && (somKlaar || !kiesbaar) && <button type="submit" disabled={waarde.trim() === ''}>
        {index === question.stappen.length - 1 ? 'Dit is het antwoord' : 'Volgende stap'}
        <ArrowRight size={18} aria-hidden="true" />
      </button>}
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
