import React, { useEffect, useMemo, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { CloudMoon, Droplet, Droplets, Hand, Stamp, Sun } from 'lucide-react';
import { Button, Dialog } from '../design-system';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct } from '../data/plants/species';
import { PLANT_PROBLEM_LABEL, type PlantProblemCause } from '../data/plants/firstAid';
import {
  CLUE_LABEL,
  clueText,
  DIAGNOSE_CHOICES,
  HELPER_NAME,
  helperIntro,
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

type Fase = 'onderzoek' | 'diagnose' | 'behandeling' | 'klaar';

const SPOTS: ClueSpot[] = ['blad', 'aarde', 'plek'];
const STAP_NUMMER: Record<Fase, number> = { onderzoek: 1, diagnose: 2, behandeling: 3, klaar: 3 };

const VRAAG: Record<Fase, string> = {
  onderzoek: 'Onderzoek de plant',
  diagnose: 'Wat is er aan de hand?',
  behandeling: 'Wat ga je doen?',
  klaar: 'Gered!',
};

/** Een plaatje bij elke oorzaak, zodat je het antwoord ook ziet en niet alleen leest. */
const OORZAAK_ICOON: Record<PlantProblemCause, React.ReactNode> = {
  'te-weinig-water': <Droplet />,
  'te-veel-water': <Droplets />,
  'te-veel-zon': <Sun />,
  'te-weinig-licht': <CloudMoon />,
  'droge-lucht': <Droplet />,
  'te-koud': <CloudMoon />,
};

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
  const [missers, setMissers] = useState(0);
  const [hintGebruikt, setHintGebruikt] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);
  const [afloop, setAfloop] = useState<{ coins: number; stampEarned: boolean } | null>(null);

  const species = patient ? PLANT_SPECIES_BY_ID[patient.speciesId] : undefined;
  const product = patient ? plantProduct(patient.speciesId) : undefined;
  const voortgang = useMemo(() => passportProgress(clinic), [clinic]);

  useEffect(() => { document.title = 'Plantendokter — CocoKiki'; }, []);

  if (!patient || !species || !product) {
    return <main className="clinic"><section className="clinic__card"><p>Er staan nog geen patiënten klaar.</p></section></main>;
  }

  const juist = treatmentFor(species, patient.cause);
  const volgende = SPOTS.find(spot => !gevonden.includes(spot));

  const volgendePatient = () => {
    setPatient(nextPatient(clinic));
    setFase('onderzoek');
    setGevonden([]);
    setMissers(0);
    setHintGebruikt(false);
    setMelding(null);
    setAfloop(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onderzoek = (spot: ClueSpot) => {
    if (!gevonden.includes(spot)) setGevonden([...gevonden, spot]);
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
      setMelding(null);
      setFase('klaar');
      return;
    }
    setMissers(missers + 1);
    setMelding(TREATMENTS_BY_ID[keuze].mis);
  };

  const vraagHint = () => {
    setHintGebruikt(true);
    if (fase === 'onderzoek') {
      setHint(volgende ? `${CLUE_LABEL[volgende]}. Daar zit je antwoord.` : 'Je hebt alles gezien. Welke oorzaak past bij álle drie de aanwijzingen?');
      return;
    }
    if (fase === 'diagnose') {
      setHint(`Denk aan de aarde. ${clueText(species, patient.cause, 'aarde')}`);
      return;
    }
    setHint(`Bij ${PLANT_PROBLEM_LABEL[patient.cause].toLowerCase()} hoort maar één goede stap.`);
  };

  const plaatje = fase === 'klaar' ? product.image : patient.image;
  const resterend = Math.max(0, STAMPS_NEEDED - (clinic.correct[species.id] ?? 0));
  const laatste = gevonden[gevonden.length - 1];
  const bubbel = fase !== 'onderzoek' ? null
    : laatste === 'plek' ? clueText(species, patient.cause, 'plek')
    : gevonden.length === 0 ? helperIntro(species.commonName)
    : `Zie jij al wat er mis is?`;

  return <main className="clinic" aria-labelledby="clinic-title">
    <section className={`clinic__card is-${fase}`}>
      <header className="clinic__top">
        <h1 id="clinic-title">Plantendokter</h1>
        <p className="clinic__passport" aria-label={`Plantenpaspoort: ${voortgang.earned} van ${voortgang.total} stempels`}>
          <Stamp aria-hidden="true" />{voortgang.earned}/{voortgang.total}
        </p>
      </header>

      <div className="clinic__toneel">
        <div className="clinic__plant">
          <img src={plaatje} alt={fase === 'klaar' ? `${species.commonName}, weer gezond` : `Een zieke ${species.commonName.toLowerCase()}`} />
          {fase === 'onderzoek' && <>
            <button
              type="button"
              className={`clinic__raak clinic__raak--blad${gevonden.includes('blad') ? ' is-done' : ''}`}
              onClick={() => onderzoek('blad')}
              aria-label={CLUE_LABEL.blad}
            ><span>{CLUE_LABEL.blad}</span></button>
            <button
              type="button"
              className={`clinic__raak clinic__raak--aarde${gevonden.includes('aarde') ? ' is-done' : ''}`}
              onClick={() => onderzoek('aarde')}
              aria-label={CLUE_LABEL.aarde}
            ><span>{CLUE_LABEL.aarde}</span></button>
            {volgende && volgende !== 'plek' && <motion.span
              className={`clinic__handje clinic__handje--${volgende}`}
              aria-hidden="true"
              animate={{ y: [0, -9, 0], opacity: [1, 1, 1] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            ><Hand /></motion.span>}
          </>}
        </div>

        {fase === 'onderzoek' && <div className="clinic__baasje">
          <button
            type="button"
            className={`clinic__helper${gevonden.includes('plek') ? ' is-done' : ''}`}
            onClick={() => onderzoek('plek')}
            aria-label={CLUE_LABEL.plek}
          >
            <img src={ASSET_LIBRARY.avatars.kikiPoses.plant} alt="" />
            {volgende === 'plek' && <motion.span
              className="clinic__handje clinic__handje--helper"
              aria-hidden="true"
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            ><Hand /></motion.span>}
          </button>
          {bubbel && <p className="clinic__bubbel"><strong>{HELPER_NAME}</strong>{bubbel}</p>}
        </div>}
      </div>

      <div className="clinic__naam">
        <strong>{species.commonName}</strong>
        <em>{species.scientificName}</em>
      </div>

      <div className="clinic__vraag">
        {fase !== 'klaar' && <small>Stap {STAP_NUMMER[fase]} van 3</small>}
        <h2>{VRAAG[fase]}</h2>
        {fase === 'onderzoek' && volgende && <p className="clinic__uitleg">Raak de plant aan om te kijken wat er is.</p>}
      </div>

      {fase === 'onderzoek' && <>
        {gevonden.length > 0 && <ul className="clinic__notities">
          {SPOTS.filter(spot => gevonden.includes(spot)).map(spot => <li key={spot}>
            <strong>{CLUE_LABEL[spot]}</strong>{clueText(species, patient.cause, spot)}
          </li>)}
        </ul>}
        <Button variant="primary" fullWidth pill disabled={gevonden.length === 0} onClick={() => { setFase('diagnose'); setMelding(null); }}>
          Ik weet genoeg
        </Button>
      </>}

      {fase === 'diagnose' && <>
        <div className="clinic__kaarten">
          {DIAGNOSE_CHOICES.map(keuze => <button key={keuze} type="button" className={`clinic__kaart is-${keuze}`} onClick={() => stelDiagnose(keuze)}>
            <span aria-hidden="true">{OORZAAK_ICOON[keuze]}</span>
            {PLANT_PROBLEM_LABEL[keuze]}
          </button>)}
        </div>
        <Button variant="quiet" onClick={() => { setFase('onderzoek'); setMelding(null); }}>Nog eens kijken</Button>
      </>}

      {fase === 'behandeling' && <>
        <p className="clinic__uitleg">Sleep het gereedschap op de plant, of tik erop.</p>
        <div className="clinic__acties clinic__acties--twee">
          {gereedschapKeuze(juist).map(id => <Gereedschap key={id} label={TREATMENTS_BY_ID[id].label} onKies={() => behandel(id)} />)}
        </div>
      </>}

      {fase === 'klaar' && afloop && <>
        <p className="clinic__succes">{TREATMENT_SUCCESS[juist]}</p>
        <p className="clinic__beloning">
          +{afloop.coins} {afloop.coins === 1 ? 'CocoCoin' : 'CocoCoins'}
          {afloop.stampEarned && <strong><Stamp aria-hidden="true" />Stempel voor {species.commonName}</strong>}
        </p>
        {!afloop.stampEarned && <small className="clinic__resterend">Nog {resterend} keer goed voor de stempel van {species.commonName.toLowerCase()}.</small>}
        <Button variant="primary" fullWidth pill onClick={volgendePatient}>Volgende patiënt</Button>
      </>}

      {melding && <p className="clinic__melding" role="status">{melding}</p>}

      {fase !== 'klaar' && <Button variant="quiet" size="small" className="clinic__hint" onClick={vraagHint}>Kiki, help eens</Button>}
    </section>

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

interface GereedschapProps { key?: React.Key; label: string; onKies: () => void }

/** Een stuk gereedschap dat je op de plant kunt slepen of gewoon aantikt. */
function Gereedschap({ label, onKies }: GereedschapProps) {
  const [sleept, setSleept] = useState(false);
  const opPlant = (info: PanInfo) => {
    const doel = document.querySelector('.clinic__plant')?.getBoundingClientRect();
    if (!doel) return false;
    const { x, y } = info.point;
    return x >= doel.left && x <= doel.right && y >= doel.top && y <= doel.bottom;
  };
  return <motion.button
    type="button"
    className="ck-button ck-button--secondary ck-button--medium ck-button--full clinic__tool"
    drag
    dragSnapToOrigin
    whileDrag={{ scale: 1.08, zIndex: 5 }}
    onDragStart={() => setSleept(true)}
    onDragEnd={(_, info) => { setSleept(false); if (opPlant(info)) onKies(); }}
    onClick={() => { if (!sleept) onKies(); }}
  >{label}</motion.button>;
}
