import { claimConsult } from '../services/plantClinic';
import { rewardAnswer } from '../services/answerRewards';
import '../components/dreamworld/wereld-scherm.css';
import '../components/cooking/bakkerij-stijl.css';
import './plant-clinic.css';
import SpeechBubble from '../components/ui/SpeechBubble';
import InfoKnop from '../components/ui/InfoKnop';
import CocoCoin from '../components/platform/CocoCoin';
import React, { useEffect, useMemo, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { BookOpen, Check, CloudMoon, Droplet, Droplets, Flower2, Hourglass, Lightbulb, Lamp, Scissors, Search, Snowflake, Stamp, Stethoscope, Sun, Trophy, Umbrella, Wind } from 'lucide-react';
import { Button, Dialog, IconButton } from '../design-system';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct } from '../data/plants/species';
import { PLANT_PROBLEM_LABEL, type PlantProblemCause } from '../data/plants/firstAid';
import { PLANTENWIJZER, WIJZER_BY_CAUSE } from '../data/plants/wijzer';
import ChoiceList from '../components/ui/ChoiceList';
import StageProgress, { type Stage } from '../components/ui/StageProgress';
import {
  baasjeTekst,
  bladKeuzes,
  CLUE_ICOON,
  CLUE_KORT,
  CLUE_LABEL,
  CONSULTS_PER_SPREEKUUR,
  GEREEDSCHAP_PLAATJE,
  NAAM_BONUS,
  naamKeuzes,
  OORZAAK_PLAATJE,
  clueText,
  diagnoseKeuzes,
  HELPER_NAME,
  helperIntro,
  KIKI_VRAAG,
  treatmentFor,
  TREATMENT_SUCCESS,
  TREATMENTS,
  TREATMENTS_BY_ID,
  type ClueSpot,
  type TreatmentId,
} from '../data/plants/clinic';
import {
  finishConsult,
  loadClinic,
  nextPatient,
  passportProgress,
  saveClinic,
  STAMPS_NEEDED,
  type ClinicState,
  type Patient,
} from '../services/plantClinic';
import { awardCurrencyOnce } from '../services/currency';
import { muntenVoorAntwoord } from '../services/economie';

type Fase = 'onderzoek' | 'diagnose' | 'behandeling' | 'naam' | 'klaar';

const SPOTS: ClueSpot[] = ['blad', 'aarde', 'plek'];
/** De drie onderzoekstegels, in de vaste volgorde van het spreekuur. */
const ONDERZOEK_TEGEL: Record<ClueSpot, string> = { blad: 'Bekijk het blad', aarde: 'Voel de aarde', plek: 'Vraag het baasje' };

/** Waaróm je daar moet kijken. Zonder die reden is "kijk daar" geen hint. */
const ONDERZOEK_WAAROM: Record<ClueSpot, string> = {
  blad: 'Aan het blad zie je wát er mis is: slap, geel, bruine randjes of bleke plekken.',
  aarde: 'Aan de aarde voel je of het aan het water ligt. Droge punten bij vochtige aarde is iets anders dan dorst.',
  plek: 'Aan de plek en het seizoen zie je of het aan de zon, het donker, de kou of de droge lucht kan liggen.',
};
const STAPPEN: Fase[] = ['onderzoek', 'diagnose', 'behandeling'];
/** Dezelfde stappenbalk als het kookavontuur, zodat je weet waar je bent. */
const SPREEKUUR_STAPPEN: Stage[] = [
  { id: 'onderzoek', label: 'Onderzoeken', icon: <Search /> },
  { id: 'diagnose', label: 'Wat is er mis?', icon: <Stethoscope /> },
  { id: 'behandeling', label: 'Behandelen', icon: <Droplets /> },
  { id: 'klaar', label: 'Beloning', icon: <Trophy /> },
];

/** Een tekentje bij elke oorzaak, zodat je het antwoord ook ziet. */
const OORZAAK_ICOON: Record<PlantProblemCause, React.ReactNode> = {
  'te-weinig-water': <Droplet />,
  'te-veel-water': <Droplets />,
  'te-veel-zon': <Sun />,
  'te-weinig-licht': <CloudMoon />,
  'droge-lucht': <Wind />,
  'te-koud': <Snowflake />,
};

/** En bij elk gereedschap, zodat de behandeling er net zo uitziet als de diagnose. */
const GEREEDSCHAP_ICOON: Record<TreatmentId, React.ReactNode> = {
  gieter: <Droplet />,
  'laten-drogen': <Hourglass />,
  ompotten: <Flower2 />,
  schaduw: <Umbrella />,
  'meer-licht': <Lamp />,
  sproeien: <Droplets />,
  warmer: <Scissors />,
};

/** Een getekend plaatje als dat er is, anders het lijn-icoon. */
/**
 * Een tekening staat los op het kaartje, zonder schijfje eromheen: een
 * vierkante tekening in een rond vlak snijdt de hoeken eraf, en daar is precies
 * het handvat van de gieter en de rand van de parasol de dupe van. Het
 * lijn-icoon houdt zijn schijfje wel, want anders zweeft het.
 */
function Tekentje({ bron, terugval, naam }: { bron?: string; terugval: React.ReactNode; naam: string }) {
  return bron
    ? <img className="clinic__tekening" src={bron} alt="" aria-hidden="true" />
    : <span aria-hidden="true" title={naam}>{terugval}</span>;
}

/** Vier gereedschappen per patiënt: het juiste en drie andere. Zeven is te veel. */
function gereedschapKeuze(juist: TreatmentId): TreatmentId[] {
  const rest = TREATMENTS.map(t => t.id).filter(id => id !== juist).slice(0, 3);
  return TREATMENTS.map(t => t.id).filter(id => id === juist || rest.includes(id));
}

/** Dezelfde volgorde bij elke hertekening, maar niet bij elke patiënt. */
function vasteKans(sleutel: string): () => number {
  let getal = 0;
  for (const letter of sleutel) getal = (getal * 31 + letter.charCodeAt(0)) % 9973;
  return () => { getal = (getal * 31 + 17) % 9973; return getal / 9973; };
}

/** Het spreekuur: Kiki brengt een zieke plant binnen en het kind is de dokter. */
import { useActivityAnalytics } from '../services/useActivityAnalytics';

export default function PlantClinicScreen() {
  const [clinic, setClinic] = useState<ClinicState>(loadClinic);
  const [patient, setPatient] = useState<Patient | null>(() => nextPatient(loadClinic()));
  const [fase, setFase] = useState<Fase>('onderzoek');
  const [gevonden, setGevonden] = useState<ClueSpot[]>([]);
  const [getoond, setGetoond] = useState<ClueSpot | null>(null);
  const [missers, setMissers] = useState(0);
  const [hintGebruikt, setHintGebruikt] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);
  const [afloop, setAfloop] = useState<{ coins: number; stampEarned: boolean } | null>(null);
  useActivityAnalytics(patient ? 'plant-clinic' : null, patient?.consultId, afloop !== null);
  const [consult, setConsult] = useState(1);
  const [oogst, setOogst] = useState({ coins: 0, stamps: 0 });
  const [loep, setLoep] = useState<'blad' | 'aarde' | null>(null);
  /** Wat het kind zelf heeft waargenomen, en of het het baasje al sprak. */
  const [waargenomen, setWaargenomen] = useState<{ aarde?: boolean; blad?: boolean }>({});
  const [misKijk, setMisKijk] = useState<string | null>(null);
  /** Of het kind het blad al van dichtbij bekijkt (dan staan de keuzes in beeld). */
  const [bladKijken, setBladKijken] = useState(false);
  const [naamGoed, setNaamGoed] = useState<boolean | null>(null);
  const [boekOpen, setBoekOpen] = useState(false);
  /** Welke boekpagina open ligt; null betekent: het overzicht met zes tegels. */
  const [boekPagina, setBoekPagina] = useState<PlantProblemCause | null>(null);

  const species = patient ? PLANT_SPECIES_BY_ID[patient.speciesId] : undefined;
  const product = patient ? plantProduct(patient.speciesId) : undefined;
  const voortgang = useMemo(() => passportProgress(clinic), [clinic]);

  useEffect(() => { document.title = 'Plantendokter — CocoKiki'; }, []);

  if (!patient || !species || !product) {
    return <main className="clinic ck-scherm bakkerij-stijl" data-wereld="tuin"><section className="clinic__card"><p>Er staan nog geen patiënten klaar.</p></section></main>;
  }

  const juist = treatmentFor(species, patient.cause);
  // Vast per patiënt: anders wisselt de volgorde bij elke hertekening.
  const bladkeuzes = useMemo(() => bladKeuzes(species, patient, vasteKans(patient.consultId)), [species, patient]);
  const volgende = SPOTS.find(spot => !gevonden.includes(spot));

  const klaarMetSpreekuur = fase === 'klaar' && consult >= CONSULTS_PER_SPREEKUUR;

  const volgendePatient = () => {
    setConsult(klaarMetSpreekuur ? 1 : consult + 1);
    if (klaarMetSpreekuur) setOogst({ coins: 0, stamps: 0 });
    setPatient(nextPatient(clinic));
    setFase('onderzoek');
    setGevonden([]);
    setGetoond(null);
    setMissers(0);
    setHintGebruikt(false);
    setMelding(null);
    setAfloop(null);
    setLoep(null);
    setWaargenomen({});
    setMisKijk(null);
    setBladKijken(false);
    setNaamGoed(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Het vergrootglas op een stuk van de plant; kijken mag altijd opnieuw. */
  const bekijk = (spot: 'blad' | 'aarde') => { setLoep(spot); setGetoond(null); setMisKijk(null); };

  /**
   * Een waarneming vastleggen. Mis kijken is geen misser: verkeerd kijken is
   * iets anders dan verkeerd redeneren, en wie erop afgerekend wordt gaat
   * gokken in plaats van kijken.
   */
  const neemWaar = (spot: 'blad', goed: boolean) => {
    if (!goed) { setMisKijk('Kijk nog eens goed naar de plant.'); setLoep(spot); return; }
    setMisKijk(null);
    setLoep(spot);
    setGetoond(spot);
    setWaargenomen(vorige => ({ ...vorige, [spot]: true }));
    if (!gevonden.includes(spot)) setGevonden([...gevonden, spot]);
  };

  /** Voelen gaat niet door een scherm; Kiki vertelt wat je onder je vingers merkt. */
  const voelAanDeAarde = () => {
    setMisKijk(null);
    setLoep('aarde');
    setGetoond('aarde');
    setWaargenomen(vorige => ({ ...vorige, aarde: true }));
    if (!gevonden.includes('aarde')) setGevonden([...gevonden, 'aarde']);
  };

  /** Waar een plant staat kun je niet zien; dat vraag je aan het baasje. */
  const vraagBaasje = () => {
    setMisKijk(null);
    setLoep(null);
    setGetoond('plek');
    if (!gevonden.includes('plek')) setGevonden([...gevonden, 'plek']);
  };

  const stelDiagnose = (keuze: PlantProblemCause) => {
    if (keuze === patient.cause) {
      rewardAnswer('clinic', patient.consultId, 'diagnosis', muntenVoorAntwoord());
      setFase('behandeling');
      setMelding(null);
      return;
    }
    setMissers(missers + 1);
    setMelding(`${PLANT_PROBLEM_LABEL[keuze]} past niet bij wat je gezien hebt.`);
  };

  const behandel = (keuze: TreatmentId) => {
    if (keuze === juist) {
      const resultaat = claimConsult(patient, missers, hintGebruikt);
      if (!resultaat) { setMelding('Opslaan lukte niet. Probeer de behandeling opnieuw.'); return; }
      if (!resultaat.coins) return;
      setClinic(resultaat.state);
      setAfloop({ coins: resultaat.coins, stampEarned: resultaat.stampEarned });
      setOogst({ coins: oogst.coins + resultaat.coins, stamps: oogst.stamps + (resultaat.stampEarned ? 1 : 0) });
      setMelding(null);
      setLoep(null);
      setFase('naam');
      return;
    }
    setMissers(missers + 1);
    setMelding(TREATMENTS_BY_ID[keuze].mis);
  };

  const raadNaam = (keuze: string) => {
    const goed = keuze === species.commonName;
    setNaamGoed(goed);
    if (goed) {
      awardCurrencyOnce(`kliniek:${patient.consultId}:naam`, NAAM_BONUS);
      setOogst(huidig => ({ ...huidig, coins: huidig.coins + NAAM_BONUS }));
    }
    setFase('klaar');
  };

  /**
   * Kiki's hint moet een denkstap geven, geen aansporing. Vroeger zei ze
   * "kijk nog eens goed naar alle drie de aanwijzingen", en daar heeft een
   * kind van negen niets aan. Nu noemt ze de vuistregel uit het plantenboek:
   * waaraan je deze oorzaak herkent, en waarmee je hem niet moet verwarren.
   */
  const vraagHint = () => {
    setHintGebruikt(true);
    const pagina = WIJZER_BY_CAUSE[patient.cause];
    if (fase === 'onderzoek') {
      setHint(volgende
        ? `${CLUE_LABEL[volgende]}. ${ONDERZOEK_WAAROM[volgende]}`
        : `Je hebt alles gezien. ${pagina.vuistregel}`);
      return;
    }
    if (fase === 'diagnose') {
      setHint(pagina.vuistregel);
      return;
    }
    setHint(`${pagina.watDoeJe} Welk gereedschap doet dat?`);
  };

  const boek = boekPagina ? WIJZER_BY_CAUSE[boekPagina] : null;

  // Zodra de behandeling klopt staat de plant er weer goed bij, ook tijdens de bonusvraag.
  const genezen = fase === 'naam' || fase === 'klaar';
  const plaatje = genezen ? product.image : patient.image;

  /** Kiki is de enige stem: de vraag, de aanwijzing en het oordeel komen uit haar mond. */
  // Alleen de blaadjes kun je zien. Hoe de aarde voelt en waar hij staat
  // kun je niet van een plaatje aflezen: dat onderzoek je, of je vraagt het.
  // Kiki wijst steeds precies één stap aan: dezelfde tegel die oplicht.
  const ONDERZOEK_VRAAG = !waargenomen.blad ? (bladKijken ? 'Wat zie je aan de plant?' : 'Laten we hem onderzoeken. Tik op: Bekijk het blad.')
    : !gevonden.includes('aarde') ? 'Tik nu op: Voel de aarde.'
    : !gevonden.includes('plek') ? 'Tik nu op: Vraag het baasje.'
    : 'Lees je aantekeningen rustig. Weet je wat er mis is?';
  const bericht = melding ? melding
    : fase === 'naam' ? 'Hij is gered! Wist je nog hoe deze plant heet?'
    : fase === 'klaar' ? (naamGoed === null ? TREATMENT_SUCCESS[juist]
      : naamGoed ? `Ja, een ${species.commonName.toLowerCase()}!`
      : `Dit is een ${species.commonName.toLowerCase()}.`)
    : fase !== 'onderzoek' ? KIKI_VRAAG[fase]
    // Tijdens het onderzoek bevestigt Kiki wat je zag en stelt ze meteen de
    // volgende vraag, zodat er nooit keuzes zonder vraag op het scherm staan.
    : gevonden.length >= 3 ? ONDERZOEK_VRAAG
    : `${getoond === 'plek' ? `${baasjeTekst(species, patient)} `
        : getoond ? `${clueText(species, patient, getoond)} `
        : ''}${ONDERZOEK_VRAAG}`.trim();

  return <main className="clinic ck-scherm bakkerij-stijl" data-wereld="tuin" aria-labelledby="clinic-title">
    <nav className="ck-zone-gereedschap ck-glas clinic__tools" aria-label="Gereedschap">
      <InfoKnop character="kiki">Bekijk het blad, voel aan de aarde en vraag waar de plant staat. Kies daarna wat er aan de hand is en help de plant met het juiste gereedschap.</InfoKnop>
      <IconButton className="ck-gereedschap" label="Plantenboek openen" icon={<BookOpen />} onClick={() => { setBoekPagina(null); setBoekOpen(true); }} />
      {fase !== 'klaar' && fase !== 'naam' && <IconButton className="ck-gereedschap" label="Hint van Kiki" icon={<Lightbulb />} onClick={vraagHint} />}
    </nav>
    {/* Kop en voortgang staan los van het papier, als smalle strook erboven. */}
    <div className="clinic-kop">
      <h1 id="clinic-title" className="sr-only">Plantendokter</h1>
      <StageProgress
        stages={SPREEKUUR_STAPPEN}
        current={fase === 'naam' ? 'klaar' : fase}
        completed={fase === 'klaar' || fase === 'naam' ? SPREEKUUR_STAPPEN.map(stap => stap.id).filter(id => id !== 'klaar') : []}
        label="Voortgang spreekuur"
      />
      <span className="clinic-kop__stippen" role="img" aria-label={`Patiënt ${consult} van ${CONSULTS_PER_SPREEKUUR}`}>
        {Array.from({ length: CONSULTS_PER_SPREEKUUR }, (_, i) => <span key={i} className={`ck-stip${i + 1 < consult || (i + 1 === consult && fase === 'klaar') ? ' ck-stip--klaar' : ''}${i + 1 === consult && fase !== 'klaar' ? ' ck-stip--nu' : ''}`} />)}
      </span>
      <span className="clinic-kop__stempels" aria-label={`Plantenpaspoort: ${voortgang.earned} van ${voortgang.total} stempels`}><Stamp aria-hidden="true" />{voortgang.earned}</span>
    </div>
    <section className={`clinic__card is-${fase}`}>

      <div className="clinic__plant">
        <img src={plaatje} alt={fase === 'klaar' ? `${species.commonName}, weer gezond` : genezen ? 'De plant is weer gezond' : 'Een zieke plant'} />
        {fase === 'onderzoek' && <>
          {/* Aanraken vergroot alleen; wát je ziet bepaal je zelf hieronder. */}
          <button type="button" className={`clinic__raak clinic__raak--blad${waargenomen.blad ? ' is-done' : ''}`} onClick={() => bekijk('blad')} aria-label="De plant van dichtbij bekijken" />
          <button type="button" className={`clinic__raak clinic__raak--aarde${waargenomen.aarde ? ' is-done' : ''}`} onClick={() => bekijk('aarde')} aria-label="De aarde van dichtbij bekijken" />
          {loep && <span className={`clinic__loep clinic__loep--${loep}`} aria-hidden="true" style={{ backgroundImage: `url(${patient.image})` }} />}
        </>}
      </div>

      <SpeechBubble vast className="clinic__bubbel" character="kiki" label={fase === 'onderzoek' ? 'Onderzoek' : fase === 'diagnose' ? 'Wat is er mis?' : fase === 'behandeling' ? 'Help de plant' : 'Goed verzorgd'} tone={melding ? 'alert' : genezen ? 'goed' : 'default'}>{misKijk && fase === 'onderzoek' ? misKijk : bericht}{fase === 'onderzoek' && gevonden.length >= 3 && <button type="button" className="ck-knop ck-knop--hoofd clinic__diagnoseknop" onClick={() => { setFase('diagnose'); setMelding(null); setLoep(null); }}>Stel je diagnose</button>}</SpeechBubble>

      {fase === 'onderzoek' && <div className="clinic__onderzoek">
        {/* Drie onderzoekstegels. Er licht er steeds één op; die noemt Kiki ook. */}
        {gevonden.length < 3 && <ol className="clinic__stappen" aria-label="Onderzoek in drie stappen">
          {SPOTS.map(spot => {
            const klaar = gevonden.includes(spot);
            const nu = !klaar && spot === volgende;
            return <li key={spot}><button
              type="button"
              className={`clinic__stap${klaar ? ' is-klaar' : ''}${nu ? ' is-nu' : ''}`}
              aria-current={nu ? 'step' : undefined}
              disabled={!nu && !klaar}
              onClick={() => {
                if (spot === 'blad') { setBladKijken(true); bekijk('blad'); }
                else if (spot === 'aarde') voelAanDeAarde();
                else vraagBaasje();
              }}
            >
              <img src={CLUE_ICOON[spot]} alt="" />
              <span>{ONDERZOEK_TEGEL[spot]}</span>
              {klaar && <Check className="clinic__stap-vink" aria-hidden="true" />}
            </button></li>;
          })}
        </ol>}
        {/* Na de derde stap: je aantekeningen op een rij, zodat je rustig kunt
            lezen. Jij bepaalt wanneer je naar de diagnose gaat. */}
        {gevonden.length >= 3 && <>
          <ul className="clinic__aantekeningen" aria-label="Je aantekeningen">
            {SPOTS.map((spot, i) => <li key={spot} className="clinic__aantekening" style={{ animationDelay: `${i * 220}ms` }}>
              <img src={CLUE_ICOON[spot]} alt="" />
              <p>{spot === 'plek' ? baasjeTekst(species, patient) : clueText(species, patient, spot)}</p>
            </li>)}
          </ul>
        </>}
        {bladKijken && !waargenomen.blad && <ChoiceList
          vorm="los"
          label="Wat zie je aan de plant?"
          choices={bladkeuzes.map(tekst => ({ id: tekst, label: tekst }))}
          onChoose={id => neemWaar('blad', id === clueText(species, patient, 'blad'))}
        />}
      </div>}

      {fase === 'diagnose' && <>
        <ChoiceList vorm="los" label="Wat is er mis met de plant?" choices={diagnoseKeuzes(patient).map(keuze => ({ id: keuze, label: PLANT_PROBLEM_LABEL[keuze], icoon: OORZAAK_PLAATJE[keuze] }))} onChoose={id => stelDiagnose(id as PlantProblemCause)} />
        <Button variant="quiet" onClick={() => { setFase('onderzoek'); setMelding(null); }}>Nog eens kijken</Button>
      </>}

      {fase === 'behandeling' && <div className="clinic__kaarten">
        {gereedschapKeuze(juist).map(id => <Gereedschap
          key={id}
          id={id}
          label={TREATMENTS_BY_ID[id].label}
          icoon={GEREEDSCHAP_ICOON[id]}
          plaatje={GEREEDSCHAP_PLAATJE[id]}
          onKies={() => behandel(id)}
        />)}
      </div>}

      {fase === 'naam' && <ChoiceList vorm="los" label="Hoe heet deze plant?" choices={naamKeuzes(species.id).map(naam => ({ id: naam, label: naam }))} onChoose={raadNaam} />}

      {fase === 'klaar' && afloop && <>
        <p className="clinic__beloning">
          <CocoCoin size={28} /> +{afloop.coins + (naamGoed ? NAAM_BONUS : 0)} {afloop.coins + (naamGoed ? NAAM_BONUS : 0) === 1 ? 'CocoCoin' : 'CocoCoins'}
          {afloop.stampEarned
            ? <strong><Stamp aria-hidden="true" />Stempel voor {species.commonName}</strong>
            : null}
        </p>
        {klaarMetSpreekuur && <p className="clinic__oogst">
          Spreekuur klaar! {oogst.coins} CocoCoins verdiend{oogst.stamps > 0 ? ` en ${oogst.stamps} ${oogst.stamps === 1 ? 'stempel' : 'stempels'}` : ''}.
        </p>}
        <Button variant="primary" fullWidth pill onClick={volgendePatient}>
          {klaarMetSpreekuur ? 'Nog een spreekuur' : 'Volgende patiënt'}
        </Button>
      </>}

    </section>

    <Dialog
      className="plantenboek clinic-dialog"
      open={boekOpen}
      title={boek ? PLANT_PROBLEM_LABEL[boek.cause] : 'Het plantenboek'}
      description={boek ? undefined : 'Zes dingen die mis kunnen gaan. Tik aan wat jij ziet.'}
      illustration={boek ? <img src={boek.plaatje} alt="" /> : undefined}
      onClose={() => setBoekOpen(false)}
      primaryAction={boek
        ? <Button pill onClick={() => setBoekPagina(null)}>Terug naar het boek</Button>
        : <Button pill onClick={() => setBoekOpen(false)}>Terug naar de patiënt</Button>}
      secondaryAction={boek ? <Button variant="quiet" pill onClick={() => setBoekOpen(false)}>Terug naar de patiënt</Button> : undefined}
    >
      {boek ? <div className="boekpagina">
        <p><small>Je ziet</small>{boek.zieJe}</p>
        <p><small>Hoe komt dat?</small>{boek.komtDoor}</p>
        <p className="boekpagina__doen">
          <img src={boek.gereedschap} alt="" />
          <span><small>Doen</small>{boek.watDoeJe}</span>
        </p>
      </div> : <div className="plantenboek__tegels">
        {PLANTENWIJZER.map(pagina => <button
          key={pagina.cause}
          type="button"
          className="plantenboek__tegel"
          onClick={() => setBoekPagina(pagina.cause)}
        >
          <img src={pagina.plaatje} alt="" />
          <strong>{PLANT_PROBLEM_LABEL[pagina.cause]}</strong>
        </button>)}
      </div>}
    </Dialog>

    <Dialog
      open={hint !== null}
      className="clinic-dialog"
      title="Kiki helpt"
      illustration={<img className="clinic__kiki-pop" src={ASSET_LIBRARY.avatars.kikiPoses.tip} alt="" />}
      onClose={() => setHint(null)}
      primaryAction={<Button variant="primary" pill onClick={() => setHint(null)}>Dankjewel</Button>}
    >
      <p>{hint}</p>
    </Dialog>
  </main>;
}

interface GereedschapProps { key?: React.Key; id: TreatmentId; label: string; icoon: React.ReactNode; plaatje?: string; onKies: () => void }

/** Een stuk gereedschap dat je op de plant kunt slepen of gewoon aantikt. */
function Gereedschap({ id, label, icoon, plaatje, onKies }: GereedschapProps) {
  const [sleept, setSleept] = useState(false);
  const opPlant = (info: PanInfo) => {
    const doel = document.querySelector('.clinic__plant')?.getBoundingClientRect();
    if (!doel) return false;
    const { x, y } = info.point;
    return x >= doel.left && x <= doel.right && y >= doel.top && y <= doel.bottom;
  };
  return <motion.button
    type="button"
    className={`clinic__kaart clinic__tool is-${id}`}
    drag
    dragSnapToOrigin
    whileDrag={{ scale: 1.08, zIndex: 5 }}
    onDragStart={() => setSleept(true)}
    onDragEnd={(_, info) => { setSleept(false); if (opPlant(info)) onKies(); }}
    onClick={() => { if (!sleept) onKies(); }}
  >
    <Tekentje bron={plaatje} terugval={icoon} naam={label} />
    {label}
  </motion.button>;
}
