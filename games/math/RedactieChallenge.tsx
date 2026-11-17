import RekenTekst from '../../components/ui/RekenTekst';
import { Button } from '../../design-system';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Highlighter, Info, X } from 'lucide-react';
import MathHelp from './MathHelp';
import SpeechBubble from '../../components/ui/SpeechBubble';
import ChoiceList from '../../components/ui/ChoiceList';
import { REDACTIE_TYPEN_BY_ID, soortKeuzes, type Steun } from './redactie/catalogus';
import { euro, evalueerSom, getal, somTekst, type Redactiesom, type Stap } from './redactie/types';
import { bouwGetallen, overbodigGetal, leesSom, somKiesbaar, somOpties, steunvormVoorNiveau, TEKENS, tussenvraagZichtbaar, waarom, wedervraag, zelfdeSom, type Som, type Teken } from './redactie/somKeuze';
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
/** Bewaart welke sommen een kind niet zelf bedacht; dit gaat mee naar het account. */
const VOORGEZEGD_KEY = 'cocokiki:redactie-voorgezegd:v1';
function bewaarVoorgezegd(somId: string, stappen: number[]) {
  try {
    const lijst = JSON.parse(localStorage.getItem(VOORGEZEGD_KEY) ?? '[]');
    lijst.push({ som: somId, stappen: stappen.map(i => i + 1), datum: new Date().toISOString() });
    localStorage.setItem(VOORGEZEGD_KEY, JSON.stringify(lijst.slice(-500)));
  } catch { /* zonder opslag speelt het kind gewoon door */ }
}
const hoortBij = (stap: Stap, eerdere: Array<number | null>) => evalueerSom(stap.som, eerdere, stap.afronden) ?? stap.antwoord;

export default function RedactieChallenge({ question, steun, niveau = 1, locked, onAnswer, onVerder }: {
  question: Redactiesom; steun: Steun; niveau?: MathLevel; locked: boolean;
  onAnswer: (value: number, geldig: boolean) => void; onVerder: () => void;
}) {
  const [verhaalOpen, setVerhaalOpen] = useState(false);
  // Welke aanpak het kind volgt: 0 is de standaardroute, daarna question.routes.
  const [route, setRoute] = useState(0);
  const routes = useMemo(() => [question.stappen, ...(question.routes ?? [])], [question]);
  const stappen = routes[route];
  const [gemarkeerd, setGemarkeerd] = useState<number[]>([]);
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
  // Plan goed, maar verkeerd uitgerekend: één keer laten narekenen (vanaf niveau 4).
  const [rekenFout, setRekenFout] = useState(false);
  const [vaag, setVaag] = useState<string | null>(null);

  const delen = useMemo(() => question.prompt.split(GETAL), [question.prompt]);
  const nodig = useMemo(() => new Set(question.nodig), [question.nodig]);
  const teGaan = delen.reduce((aantal, deel, i) => aantal + (nodig.has(deel) && !gemarkeerd.includes(i) ? 1 : 0), 0);
  const stap = stappen[index];
  const type = REDACTIE_TYPEN_BY_ID[question.typeId];
  // Op het laagste niveau krijg je het plan nog; daarna bedenk je het zelf.
  const planZelf = steun !== 'volledig';
  const steunvorm = steunvormVoorNiveau(niveau);
  // De som van deze stap, met de uitkomsten van eerdere stappen ingevuld.
  const somNu = stap ? somTekst(stappen, index, index, false, antwoorden) : '';
  const juist = useMemo(() => leesSom(somNu), [somNu]);
  const kiesbaar = !!stap && somKiesbaar(stap, somNu);
  // Andere goede sommen voor deze stap (bijv. 4 × 7 naast 35 − 7).
  const alternatieven = useMemo(() => (stap?.ook ?? []).map(t => somTekst(stappen.map((s, i) => i === index ? { ...s, som: t } : s), index, index, false, antwoorden)), [stap, stappen, index, antwoorden]);
  // Stappen waarvan Lua het antwoord gaf: die tellen niet als zelf bedacht.
  const [voorgezegd, setVoorgezegd] = useState<number[]>([]);
  const [eigenSom, setEigenSom] = useState<Record<number, string>>({});
  const sleutel = `${question.id}:${index}`;
  const opties = useMemo(() => juist && steunvorm !== 'bouw' ? somOpties(juist, steunvorm === 'kies-twee' ? 2 : 4, sleutel) : [], [juist, steunvorm, sleutel]);
  const getallen = useMemo(() => juist && steunvorm === 'bouw' ? bouwGetallen(juist, [...(index === 0 ? routes.slice(1).flatMap(r => { const a = leesSom(r[0].som); return a ? [a.links, a.rechts] : []; }) : []), ...alternatieven.flatMap(t => { const a = leesSom(t); return a ? [a.links, a.rechts] : []; }), ...question.nodig, ...antwoorden.map((a, i) => a === null ? '' : schrijf(a, stappen[i]))], sleutel) : [], [juist, steunvorm, sleutel, question, antwoorden, alternatieven, routes, index, stappen]);
  // Een getal dat niet in het verhaal staat (zoals 60) krijgt erbij wat het betekent.
  const weetje = (g: string) => delen.includes(g) ? null : routes.map(r => r[index]?.weetjes?.[g]).find(Boolean) ?? (g === '60' ? 'minuten in een uur' : null);
  // Instructieniveau: op niveau 1 legt Lua elke stap uit, op niveau 2 krijg je een korte tip, daarna niets vooraf.
  const uitlegVooraf = !stap || somKlaar ? null
    : niveau === 1 ? [index === 0 ? type?.aanpak : null, stap.uitleg ?? stap.tip].filter(Boolean).join(' ')
    : niveau === 2 ? stap.tip : null;
  const probeerSom = (som: Som | null, tekst: string) => {
    if (som && index === 0) {
      const andere = routes.findIndex((r, n) => n !== route && (() => { const a = leesSom(r[0].som); return a && zelfdeSom(som, a); })());
      if (andere >= 0) { setRoute(andere); setSomKlaar(true); setSomFout(null); setVaag(null); return; }
    }
    const alt = som ? alternatieven.find(t => { const a = leesSom(t); return a && zelfdeSom(som, a); }) : undefined;
    if (som && alt) { setEigenSom(e => ({ ...e, [index]: tekst })); setSomKlaar(true); setSomFout(null); setVaag(null); return; }
    if (som && juist && zelfdeSom(som, juist)) { setSomKlaar(true); setSomFout(null); setVaag(null); return; }
    if (juist) setVaag(overbodigGetal(som, juist));
    setSomFout(tekst); setGebouwd({ links: null, teken: null, rechts: null });
  };
  const legNeer = (stuk: string, isTeken: boolean) => {
    const volgende = isTeken ? { ...gebouwd, teken: stuk as Teken } : gebouwd.links === null ? { ...gebouwd, links: stuk } : gebouwd.rechts === null ? { ...gebouwd, rechts: stuk } : gebouwd;
    setGebouwd(volgende); setSomFout(null);
    if (volgende.links && volgende.teken && volgende.rechts) probeerSom({ links: volgende.links, teken: volgende.teken, rechts: volgende.rechts }, `${volgende.links} ${volgende.teken} ${volgende.rechts}`);
  };

  // Na het aanstrepen meteen naar rekenen: welke som je maakt, bedenk je per stap zelf.
  const naMarkeren: Fase = question.vraagSoort && planZelf ? 'soort' : 'rekenen';
  // Het kind kiest zelf en zegt dan "klaar": zo verklapt het spel niet meteen welk getal er niet bij hoort.
  const [markeerFout, setMarkeerFout] = useState<string | null>(null);
  const teVeel = gemarkeerd.filter(i => !nodig.has(delen[i])).length;
  const klaarMetMarkeren = () => {
    if (teGaan === 0 && teVeel === 0) { setMarkeerFout(null); setFase(naMarkeren); return; }
    setMarkeerFout(teVeel > 0 && teGaan > 0 ? 'Er mist een getal, en er is er één te veel.'
      : teVeel > 0 ? (teVeel === 1 ? 'Eén getal heb je niet nodig.' : 'Een paar getallen heb je niet nodig.')
      : `Je mist nog ${teGaan === 1 ? 'een getal' : `${teGaan} getallen`}.`);
  };
  useEffect(() => {
    if (trede < 2) return;
    const timer = window.setTimeout(() => setMag3(true), DENKTIJD_MS);
    return () => window.clearTimeout(timer);
  }, [trede]);

  const tik = (_deel: string, i: number) => {
    setMarkeerFout(null);
    setGemarkeerd(lijst => (lijst.includes(i) ? lijst.filter(x => x !== i) : [...lijst, i]));
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
    if (niveau >= 4 && !rekenFout && !voorgezegd.includes(index) && stap && Math.abs(getal - hoortBij(stap, antwoorden)) >= 0.005) {
      setRekenFout(true); setWaarde(''); return;
    }
    setRekenFout(false); setVaag(null);
    const zelf = voorgezegd.length === 0;
    const volgende = [...antwoorden, getal];
    setAntwoorden(volgende);
    setWaarde('');
    setTrede(0); setMag3(false);
    setSomKlaar(false); setSomFout(null); setGebouwd({ links: null, teken: null, rechts: null });
    if (index < stappen.length - 1) { setIndex(index + 1); return; }
    setFase('nakijken');
    if (!zelf) bewaarVoorgezegd(question.id, voorgezegd);
    onAnswer(getal, zelf && Math.abs(getal - question.answer) < 0.005);
  };

  /** Per stap: klopt het met de getallen die het kind zélf heeft ingevuld? */
  const oordeel = stappen.map((item, i) => {
    const gegeven = antwoorden[i];
    if (gegeven === undefined || gegeven === null) return null;
    return Math.abs(gegeven - hoortBij(item, antwoorden.slice(0, i))) < 0.005;
  });
  const eersteFout = oordeel.findIndex(goed => goed === false);
  // Alleen helemaal goed als élke stap klopte. Het eindantwoord kan per
  // ongeluk goed uitkomen terwijl er onderweg iets misging.
  const eindGoed = antwoorden.length > 0 && Math.abs((antwoorden.at(-1) ?? NaN) - question.answer) < 0.005;
  const helemaalGoed = eindGoed && oordeel.every(goed => goed !== false);

  const geefAntwoord = () => {
    if (!stap) return;
    const waardeNu = hoortBij(stap, antwoorden);
    setVoorgezegd(v => v.includes(index) ? v : [...v, index]);
    setSomKlaar(true); setSomFout(null);
    setWaarde(String(waardeNu).replace('.', ','));
  };
  const tipTekst = trede === 4 && stap
    ? `Het antwoord: ${stap.verborgen ? '' : `${somNu} = `}${schrijf(hoortBij(stap, antwoorden), stap)}. Snap je waarom?`
    : trede === 1
    ? `Je zoekt ${question.zoek}.`
    : trede === 2 ? type?.aanpak ?? question.hint
    : stap?.tip ?? '';

  const verhaal = <div className={`redactie-vraag${fase !== 'markeren' && !verhaalOpen ? ' is-compact' : ''}`}>{question.beeld && <img className="redactie-beeld" src={question.beeld} alt="" />}<p className="redactie-verhaal">
    {/* Split met een vangende groep wisselt tekst en getal af, dus een deel
        dat met een cijfer begint ís het getal. */}
    {delen.map((deel, i) => (/^\d/.test(deel)
      ? <button
          key={i} type="button"
          className={`redactie-getal${gemarkeerd.includes(i) ? ' is-nodig' : ''}`}
          aria-pressed={gemarkeerd.includes(i)}
          disabled={fase !== 'markeren'}
          onClick={() => tik(deel, i)}
        >{deel}</button>
      : <span key={i}>{deel}</span>))}
  </p>{fase !== 'markeren' && <Button className="redactie-vraag-toggle" variant="quiet" size="small" aria-expanded={verhaalOpen} onClick={() => setVerhaalOpen(value => !value)}>{verhaalOpen ? 'Vraag inklappen' : 'Hele vraag lezen'}</Button>}</div>;

  if (fase === 'nakijken') return <div className="redactie">
    {verhaal}
    {/* Eén kaart: de stappen, het oordeel en de terugblik horen bij elkaar.
        Losse blokjes onder elkaar lezen als rommel. */}
    {/* Het nakijkblaadje: de stappen in je schrift met vinkjes, het antwoord omcirkeld
        en een post-it met hoe je het controleert. */}
    <div className="redactie-uitslag">
      <ol className="redactie-nakijk">
        {stappen.map((item, i) => <li key={i} className={oordeel[i] ? 'is-goed' : 'is-mis'}>
          <span className="redactie-nakijk__vink" aria-label={oordeel[i] ? 'goed' : 'nog niet goed'}>{oordeel[i] ? <Check size={20} strokeWidth={3.5} aria-hidden="true" /> : <X size={18} strokeWidth={3} aria-hidden="true" />}</span>
          <span className="redactie-nakijk__som">{item.verborgen ? item.vraag : `${eigenSom[i] ?? somTekst(stappen, i, stappen.length, true, antwoorden)} =`} <strong className={i === stappen.length - 1 ? 'is-eind' : undefined}>{schrijf(antwoorden[i] ?? 0, item)}</strong> <small>{item.eenheid}</small></span>
          {voorgezegd.includes(i) && <em className="redactie-nakijk__noot">antwoord van Lua</em>}
          {!oordeel[i] && <em className="redactie-nakijk__noot">hier hoort {schrijf(hoortBij(item, antwoorden.slice(0, i)), item)}</em>}
        </li>)}
      </ol>
      <p className="redactie-oordeel" role="status">
        {helemaalGoed && <span className="redactie-stempel" aria-hidden="true">{voorgezegd.length ? 'Met hulp' : 'Top!'}</span>}
        {helemaalGoed && voorgezegd.length ? 'Goed, met hulp van Lua!'
          : helemaalGoed ? 'Helemaal goed gerekend!'
          : eersteFout >= 0 && eersteFout < stappen.length - 1 && oordeel.slice(eersteFout + 1).every(Boolean)
            ? `Stap ${eersteFout + 1} ging mis. Daarna rekende je goed door.${eindGoed ? ' Je antwoord klopt toch.' : ''}`
            : `Het antwoord is ${schrijf(question.answer, stappen.at(-1))}.`}
      </p>
      {question.controle && <aside className="redactie-postit">
        {type && <p className="redactie-postit__naam">{type.naam}</p>}
        <p className="redactie-postit__kop">Zo check je het</p>
        <p className="redactie-postit__controle">{question.controle}</p>
      </aside>}
      <button type="button" className="redactie-verder" onClick={onVerder}>Volgende som<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  </div>;

  return <div className="redactie">
    {verhaal}

    {fase === 'markeren' && <p className="redactie-opdracht" role="status">
      <Highlighter size={18} aria-hidden="true" />
      Markeer de getallen die je nodig hebt
    </p>}
    {fase === 'markeren' && markeerFout && <p className="redactie-tip" role="status">{markeerFout}</p>}
    {fase === 'markeren' && gemarkeerd.length > 0 && <button type="button" className="redactie-verder redactie-markeer-klaar" onClick={klaarMetMarkeren}>Klaar met markeren<ArrowRight size={18} aria-hidden="true" /></button>}

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
        {stappen.map((item, i) => {
          const klaar = i < index, nu = i === index;
          if (!klaar && !nu && steun !== 'volledig') return null;
          return <li key={i} className={klaar ? 'is-klaar' : nu ? 'is-nu' : 'is-later'}>
            <span className="story-stappen__kop"><b aria-hidden="true">{i + 1}</b>{klaar || (nu && tussenvraagZichtbaar(niveau)) ? item.vraag : nu ? `Stap ${i + 1}: wat reken je nu uit?` : `Stap ${i + 1}`}</span>
            {nu && uitlegVooraf && <SpeechBubble character="lua" label={niveau === 1 ? 'zo werkt het' : 'tip'} className="redactie-uitleg">{uitlegVooraf}</SpeechBubble>}
            {nu && kiesbaar && !somKlaar && juist ? <div className="redactie-somkeuze">
              <p className="redactie-somkeuze__vraag">{steunvorm === 'bouw' ? 'Maak de som die je nu nodig hebt.' : 'Welke som maak je nu?'}</p>
              {steunvorm === 'bouw' ? <>
                <div className="redactie-bouw" aria-label="Jouw som">
                  {(['links', 'teken', 'rechts'] as const).map(plek => <button key={plek} type="button" className={`redactie-bouw__vak${gebouwd[plek] ? ' is-vol' : ''}${plek === 'teken' ? ' is-teken' : ''}`}
                    aria-label={gebouwd[plek] ? `${gebouwd[plek]}, tik om weg te halen` : plek === 'teken' ? 'Leeg vak voor het rekenteken' : 'Leeg vak voor een getal'}
                    onClick={() => setGebouwd({ ...gebouwd, [plek]: null })}>{gebouwd[plek] ?? '?'}</button>)}
                </div>
                <div className="redactie-bouw__stukken" role="group" aria-label="Getallen">{getallen.map(g => <button key={g} type="button" className={`redactie-bouw__getal${vaag === g ? ' is-vaag' : ''}`} onClick={() => legNeer(g, false)}>{g}{weetje(g) && <small className="redactie-bouw__weetje">{weetje(g)}</small>}</button>)}</div>
                <div className="redactie-bouw__stukken" role="group" aria-label="Rekentekens">{TEKENS.map(t => <button key={t} type="button" className="redactie-bouw__teken" aria-label={{ '+': 'plus', '−': 'min', '×': 'keer', '÷': 'gedeeld door' }[t]} onClick={() => legNeer(t, true)}><RekenTekst tekst={t} /></button>)}</div>
              </> : <div className="redactie-plan__keuzes">{opties.map(optie => <button key={optie} type="button" className={somFout === optie ? 'is-mis' : undefined} onClick={() => probeerSom(leesSom(optie), optie)}><RekenTekst tekst={optie} /></button>)}</div>}
              {somFout && <p className="redactie-tip" role="status">{wedervraag(leesSom(somFout), juist)}</p>}
            </div>
            : <>{nu && kiesbaar && somKlaar && juist && <p className="redactie-waarom" role="status">{waarom(item, juist)}</p>}
            {/* Een latere stap toont zijn som nog niet: anders verklapt het blad welke som je straks maakt. */}
            {(klaar || nu) && <span className="math-workbench__equation">
              {!item.verborgen && <span><RekenTekst tekst={`${eigenSom[i] ?? somTekst(stappen, i, index, false, antwoorden)} =`} /></span>}
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
      {rekenFout && <p className="redactie-tip" role="status">{somKlaar ? 'Je plan klopt! ' : ''}Reken nog eens na.</p>}
      {!stap?.keuzes && (somKlaar || !kiesbaar) && <button type="submit" disabled={waarde.trim() === ''}>
        {index === stappen.length - 1 ? 'Dit is het antwoord' : 'Volgende stap'}
        <ArrowRight size={18} aria-hidden="true" />
      </button>}
    </form>}

    {!locked && fase !== 'markeren' && <MathHelp open={trede > 0} onToggle={() => setTrede(trede > 0 ? 0 : 1)}>
      {tipTekst}
      {trede < 3 && <button type="button" className="redactie-meer" disabled={trede === 2 && !mag3}
        onClick={() => setTrede(trede + 1)}>
        {trede === 2 ? (mag3 ? 'Laat de eerste som zien' : 'Denk er nog even over…') : 'Nog een tip'}
      </button>}
      {trede === 3 && fase === 'rekenen' && <button type="button" className="redactie-meer" onClick={() => { setTrede(4); geefAntwoord(); }}>Laat het antwoord zien</button>}
    </MathHelp>}
  </div>;
}
