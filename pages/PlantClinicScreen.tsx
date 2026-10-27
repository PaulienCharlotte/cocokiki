import React, { useEffect, useMemo, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { BookOpen, CloudMoon, Droplet, Droplets, Flower2, Hand, Hourglass, Lamp, Scissors, Snowflake, Stamp, Sun, Umbrella, Wind } from 'lucide-react';
import { Button, Dialog } from '../design-system';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct } from '../data/plants/species';
import { PLANT_PROBLEM_LABEL, type PlantProblemCause } from '../data/plants/firstAid';
import { PLANTENWIJZER, WIJZER_BY_CAUSE } from '../data/plants/wijzer';
import {
  CLUE_ICOON,
  CLUE_KORT,
  CLUE_LABEL,
  CONSULTS_PER_SPREEKUUR,
  GEREEDSCHAP_PLAATJE,
  NAAM_BONUS,
  naamKeuzes,
  OORZAAK_PLAATJE,
  clueText,
  DIAGNOSE_CHOICES,
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

type Fase = 'onderzoek' | 'diagnose' | 'behandeling' | 'naam' | 'klaar';

const SPOTS: ClueSpot[] = ['blad', 'aarde', 'plek'];

/** Waaróm je daar moet kijken. Zonder die reden is "kijk daar" geen hint. */
const ONDERZOEK_WAAROM: Record<ClueSpot, string> = {
  blad: 'Aan het blad zie je wát er mis is: slap, geel, bruine randjes of bleke plekken.',
  aarde: 'Aan de aarde voel je of hij te veel of juist te weinig water heeft gehad.',
  plek: 'Aan de plek zie je of het aan de zon, het donker of de kou kan liggen.',
};
const STAPPEN: Fase[] = ['onderzoek', 'diagnose', 'behandeling'];

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
function Tekentje({ bron, terugval, naam }: { bron?: string; terugval: React.ReactNode; naam: string }) {
  return bron
    ? <span className="clinic__tekentje" aria-hidden="true"><img src={bron} alt="" /></span>
    : <span aria-hidden="true" title={naam}>{terugval}</span>;
}

/** Vier gereedschappen per patiënt: het juiste en drie andere. Zeven is te veel. */
function gereedschapKeuze(juist: TreatmentId): TreatmentId[] {
  const rest = TREATMENTS.map(t => t.id).filter(id => id !== juist).slice(0, 3);
  return TREATMENTS.map(t => t.id).filter(id => id === juist || rest.includes(id));
}

/** Het spreekuur: Kiki brengt een zieke plant binnen en het kind is de dokter. */
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
  const [consult, setConsult] = useState(1);
  const [oogst, setOogst] = useState({ coins: 0, stamps: 0 });
  const [loep, setLoep] = useState<'blad' | 'aarde' | null>(null);
  const [naamGoed, setNaamGoed] = useState<boolean | null>(null);
  const [boekOpen, setBoekOpen] = useState(false);
  /** Welke boekpagina open ligt; null betekent: het overzicht met zes tegels. */
  const [boekPagina, setBoekPagina] = useState<PlantProblemCause | null>(null);

  const species = patient ? PLANT_SPECIES_BY_ID[patient.speciesId] : undefined;
  const product = patient ? plantProduct(patient.speciesId) : undefined;
  const voortgang = useMemo(() => passportProgress(clinic), [clinic]);

  useEffect(() => { document.title = 'Plantendokter — CocoKiki'; }, []);

  if (!patient || !species || !product) {
    return <main className="clinic"><section className="clinic__card"><p>Er staan nog geen patiënten klaar.</p></section></main>;
  }

  const juist = treatmentFor(species, patient.cause);
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
    setNaamGoed(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onderzoek = (spot: ClueSpot) => {
    if (!gevonden.includes(spot)) setGevonden([...gevonden, spot]);
    setGetoond(spot);
    setLoep(spot === 'plek' ? null : spot);
    setMelding(null);
  };

  const stelDiagnose = (keuze: PlantProblemCause) => {
    if (keuze === patient.cause) {
      setFase('behandeling');
      setMelding(null);
      return;
    }
    setMissers(missers + 1);
    setMelding(`${PLANT_PROBLEM_LABEL[keuze]} past niet bij wat je gezien hebt.`);
  };

  const behandel = (keuze: TreatmentId) => {
    if (keuze === juist) {
      const resultaat = finishConsult(clinic, patient, missers, hintGebruikt);
      if (saveClinic(resultaat.state)) setClinic(resultaat.state);
      if (resultaat.coins > 0) awardCurrencyOnce(`kliniek:${patient.consultId}`, resultaat.coins);
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
  const resterend = Math.max(0, STAMPS_NEEDED - (clinic.correct[species.id] ?? 0));

  /** Kiki is de enige stem: de vraag, de aanwijzing en het oordeel komen uit haar mond. */
  const bericht = melding ? melding
    : fase === 'naam' ? 'Hij is gered! Wist je nog hoe deze plant heet?'
    : fase === 'klaar' ? (naamGoed === null ? TREATMENT_SUCCESS[juist]
      : naamGoed ? `Goed onthouden, dit is inderdaad een ${species.commonName.toLowerCase()}.`
      : `Dit was een ${species.commonName.toLowerCase()}. Nu weet je het voor de volgende keer.`)
    : fase !== 'onderzoek' ? KIKI_VRAAG[fase]
    : getoond ? clueText(species, patient.cause, getoond)
    : gevonden.length === 0 ? `${helperIntro()} ${KIKI_VRAAG.onderzoek}`
    : KIKI_VRAAG.onderzoek;

  return <main className="clinic" aria-labelledby="clinic-title">
    <section className={`clinic__card is-${fase}`}>
      <header className="clinic__top">
        <div>
          <h1 id="clinic-title">{fase === 'klaar' ? species.commonName : 'Wie is dit?'}</h1>
          <em>{fase === 'klaar' ? species.scientificName : 'Een nieuwe patiënt'}</em>
        </div>
        <div className="clinic__tellers">
          <p className="clinic__consult" aria-label={`Patiënt ${consult} van ${CONSULTS_PER_SPREEKUUR}`}>{consult}/{CONSULTS_PER_SPREEKUUR}</p>
          <p className="clinic__passport" aria-label={`Plantenpaspoort: ${voortgang.earned} van ${voortgang.total} stempels`}>
            <Stamp aria-hidden="true" />{voortgang.earned}/{voortgang.total}
          </p>
        </div>
      </header>

      <ol className="clinic__stappen" aria-label={`Stap ${STAPPEN.indexOf(fase) + 1} van 3`}>
        {STAPPEN.map((stap, index) => <li
          key={stap}
          className={fase === stap ? 'is-nu' : index < STAPPEN.indexOf(fase) || fase === 'klaar' ? 'is-klaar' : undefined}
        />)}
      </ol>

      <div className="clinic__plant">
        <img src={plaatje} alt={fase === 'klaar' ? `${species.commonName}, weer gezond` : genezen ? 'De plant is weer gezond' : 'Een zieke plant'} />
        {fase === 'onderzoek' && <>
          <button type="button" className={`clinic__raak clinic__raak--blad${gevonden.includes('blad') ? ' is-done' : ''}`} onClick={() => onderzoek('blad')} aria-label={CLUE_LABEL.blad} />
          <button type="button" className={`clinic__raak clinic__raak--aarde${gevonden.includes('aarde') ? ' is-done' : ''}`} onClick={() => onderzoek('aarde')} aria-label={CLUE_LABEL.aarde} />
          {loep && <span className={`clinic__loep clinic__loep--${loep}`} aria-hidden="true" style={{ backgroundImage: `url(${patient.image})` }} />}
          {volgende && volgende !== 'plek' && <motion.span
            className={`clinic__handje clinic__handje--${volgende}`}
            aria-hidden="true"
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          ><Hand /></motion.span>}
        </>}
      </div>

      <div className="clinic__gesprek">
        <button
          type="button"
          className={`clinic__helper${gevonden.includes('plek') ? ' is-done' : ''}`}
          onClick={() => onderzoek('plek')}
          disabled={fase !== 'onderzoek'}
          aria-label={CLUE_LABEL.plek}
        >
          <img src={ASSET_LIBRARY.avatars.kikiPoses.plant} alt="" />
          {fase === 'onderzoek' && volgende === 'plek' && <motion.span
            className="clinic__handje clinic__handje--helper"
            aria-hidden="true"
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          ><Hand /></motion.span>}
        </button>
        <p className={`clinic__bubbel${melding ? ' is-mis' : ''}`} role="status">
          <strong>{HELPER_NAME}</strong>{bericht}
        </p>
      </div>

      {fase === 'onderzoek' && <>
        <ul className="clinic__chips" aria-label="Wat je al onderzocht hebt">
          {SPOTS.map(spot => <li key={spot}>
            <button
              type="button"
              className={`clinic__chip${gevonden.includes(spot) ? ' is-done' : ''}${getoond === spot ? ' is-nu' : ''}`}
              onClick={() => onderzoek(spot)}
              aria-label={CLUE_LABEL[spot]}
            ><img src={CLUE_ICOON[spot]} alt="" />{CLUE_KORT[spot]}</button>
          </li>)}
        </ul>
        <Button variant="primary" fullWidth pill disabled={gevonden.length === 0} onClick={() => { setFase('diagnose'); setMelding(null); }}>
          Ik weet genoeg
        </Button>
      </>}

      {fase === 'diagnose' && <>
        <div className="clinic__kaarten">
          {DIAGNOSE_CHOICES.map(keuze => <button key={keuze} type="button" className={`clinic__kaart is-${keuze}`} onClick={() => stelDiagnose(keuze)}>
            <Tekentje bron={OORZAAK_PLAATJE[keuze]} terugval={OORZAAK_ICOON[keuze]} naam={PLANT_PROBLEM_LABEL[keuze]} />
            {PLANT_PROBLEM_LABEL[keuze]}
          </button>)}
        </div>
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

      {fase === 'naam' && <div className="clinic__namen">
        {naamKeuzes(species.id).map(naam => <button key={naam} type="button" className="clinic__naamkeuze" onClick={() => raadNaam(naam)}>{naam}</button>)}
      </div>}

      {fase === 'klaar' && afloop && <>
        <p className="clinic__beloning">
          +{afloop.coins + (naamGoed ? NAAM_BONUS : 0)} {afloop.coins + (naamGoed ? NAAM_BONUS : 0) === 1 ? 'CocoCoin' : 'CocoCoins'}
          {afloop.stampEarned
            ? <strong><Stamp aria-hidden="true" />Stempel voor {species.commonName}</strong>
            : <small>Nog {resterend} keer goed voor zijn stempel</small>}
        </p>
        {klaarMetSpreekuur && <p className="clinic__oogst">
          Spreekuur klaar! {oogst.coins} CocoCoins verdiend{oogst.stamps > 0 ? ` en ${oogst.stamps} ${oogst.stamps === 1 ? 'stempel' : 'stempels'}` : ''}.
        </p>}
        <Button variant="primary" fullWidth pill onClick={volgendePatient}>
          {klaarMetSpreekuur ? 'Nog een spreekuur' : 'Volgende patiënt'}
        </Button>
      </>}

      {fase !== 'klaar' && fase !== 'naam' && <div className="clinic__onderaan">
        <Button variant="quiet" size="small" pill startIcon={<BookOpen size={16} />} onClick={() => { setBoekPagina(null); setBoekOpen(true); }}>Plantenboek</Button>
        <Button variant="quiet" size="small" pill onClick={vraagHint}>Kiki, help eens</Button>
      </div>}
    </section>

    <Dialog
      className="plantenboek"
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
