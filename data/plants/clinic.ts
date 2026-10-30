import { PLANT_GEREEDSCHAP, PLANT_ICOON, PLANT_SPECIES, PLANT_SPECIES_BY_ID, type PlantSpecies, type PlantStage } from './species';
import { plantFirstAid, PLANT_PROBLEM_LABEL, type PlantProblemCause } from './firstAid';
import { LEARNING_COINS } from '../../services/learningReward';

/**
 * Het spreekuur van de plantendokter.
 *
 * Een kind krijgt een zieke plant op bezoek en werkt als een echte dokter:
 * eerst kijken, dan pas zeggen wat er is, en daarna behandelen. Die drie
 * stappen apart houden is het hele punt — anders wordt het gokken.
 */

/** Waar je naar kunt kijken bij een plant. */
export type ClueSpot = 'blad' | 'aarde' | 'plek';

export const CLUE_LABEL: Record<ClueSpot, string> = {
  blad: 'Kijk naar de bladeren',
  aarde: 'Voel aan de aarde',
  plek: 'Vraag het aan Kiki',
};

/**
 * Getekende plaatjes bij de knoppen, uit PLANT_ICOON. Waar er nog geen
 * tekening is valt het scherm terug op een lijn-icoon;
 * docs/plantendokter-assets.md zegt welke er nog ontbreken.
 */
export const CLUE_ICOON: Record<ClueSpot, string> = {
  blad: PLANT_ICOON.blad,
  aarde: PLANT_ICOON.aarde,
  plek: PLANT_ICOON.plek,
};

/** Elke oorzaak heeft nu zijn eigen tekening. */
export const OORZAAK_PLAATJE: Record<PlantProblemCause, string> = {
  'te-weinig-water': PLANT_ICOON.droog,
  'te-veel-water': PLANT_ICOON.nat,
  'te-veel-zon': PLANT_ICOON.zon,
  'te-weinig-licht': PLANT_ICOON.donker,
  'droge-lucht': PLANT_ICOON.drogeLucht,
  'te-koud': PLANT_ICOON.koud,
};

/**
 * De bonusvraag: wist je nog hoe deze plant heet? Drie namen, altijd dezelfde
 * drie bij dezelfde plant, zodat een kind er niet door de war van raakt. De
 * afleiders komen uit dezelfde hoek: planten die op elkaar lijken staan niet
 * samen in één rijtje als dat te gemeen zou zijn.
 */
export function naamKeuzes(speciesId: string): string[] {
  const alle = PLANT_SPECIES.map(soort => soort.commonName);
  const eigen = PLANT_SPECIES_BY_ID[speciesId]?.commonName;
  if (!eigen) return [];
  const index = PLANT_SPECIES.findIndex(soort => soort.id === speciesId);
  const anderen = [
    alle[(index + 3) % alle.length],
    alle[(index + 7) % alle.length],
  ].filter(naam => naam !== eigen);
  const keuzes = [eigen, ...anderen].slice(0, 3);
  // Vaste volgorde per plant: het juiste antwoord staat niet altijd vooraan.
  const plek = index % keuzes.length;
  const zonder = keuzes.filter(naam => naam !== eigen);
  zonder.splice(plek, 0, eigen);
  return zonder;
}

/** Wat de bonusvraag extra oplevert. */
export const NAAM_BONUS = LEARNING_COINS;

/** Hoeveel patiënten er in één spreekuur langskomen. */
export const CONSULTS_PER_SPREEKUUR = 3;

/** Kort woord voor op het chipje, zodat de knop klein kan blijven. */
export const CLUE_KORT: Record<ClueSpot, string> = {
  blad: 'Blad',
  aarde: 'Aarde',
  plek: 'Plek',
};

/** Wat Kiki vraagt bij elke stap; zij is de enige stem op de kaart. */
export const KIKI_VRAAG = {
  onderzoek: 'Raak de plant aan. Wat zie je?',
  diagnose: 'Wat is er aan de hand met deze plant?',
  behandeling: 'Wat ga je doen om hem te helpen?',
} as const;

/**
 * Kiki is de assistente van het spreekuur. Zij brengt de patiënt binnen en
 * vertelt wat het baasje gezegd heeft; aan een persoon vraag je eerder iets
 * dan aan een knop. Kiki hoort bij de plantenwereld, Coco bij de keuken.
 */
export const HELPER_NAME = 'Kiki';

export function helperIntro(): string {
  return 'Deze plant is net binnengebracht. Er is iets mis, maar wat?';
}

/**
 * De omstandigheden van een geval.
 *
 * Hiervóór hoorde bij elke oorzaak één vaste zin ("hij stond vlak boven de
 * verwarming"), en die zin wás het antwoord. Een kind dat hem één keer gelezen
 * had, hoefde daarna niet meer te kijken. Nu krijgt een patiënt losse feiten —
 * waar hij staat, welk seizoen het is, hoe lang geleden hij water kreeg — en
 * pas de combinatie wijst één oorzaak aan. Bij de verwarming in de winter met
 * vochtige aarde is het droge lucht; bij diezelfde verwarming met kurkdroge
 * aarde is het gewoon dorst.
 */
export type Seizoen = 'lente' | 'zomer' | 'herfst' | 'winter';
export type Plek = 'kamer' | 'zuidraam' | 'verwarming' | 'hoek' | 'badkamer' | 'koud-glas';

export const SEIZOEN_TEKST: Record<Seizoen, string> = {
  lente: 'het is lente',
  zomer: 'het is hartje zomer',
  herfst: 'het is herfst',
  winter: 'het is winter en de verwarming staat aan',
};

export const PLEK_TEKST: Record<Plek, string> = {
  kamer: 'hij staat midden in de kamer',
  zuidraam: 'hij staat pal voor het zuidraam, in de volle zon',
  verwarming: 'hij staat vlak boven de verwarming',
  hoek: 'hij staat achterin de hoek, ver bij het raam vandaan',
  badkamer: 'hij staat in de badkamer, waar het altijd een beetje dampig is',
  'koud-glas': 'hij staat \u2019s nachts tussen het gordijn en het koude glas',
};

/** Hoe nat de aarde is. Dit is het feit dat de meeste oorzaken uit elkaar houdt. */
export type Aarde = 'kurkdroog' | 'gewoon' | 'drijfnat';

export const AARDE_TEKST: Record<Aarde, string> = {
  kurkdroog: 'De aarde is kurkdroog en laat los van de pot.',
  gewoon: 'De aarde is gewoon vochtig: niet te nat, niet te droog.',
  drijfnat: 'De aarde is drijfnat en er staat water in de schotel.',
};

/** Welke omstandigheden bij een oorzaak kunnen horen. */
interface Omstandigheden {
  plekken: Plek[];
  seizoenen: Seizoen[];
  aarde: Aarde;
}

const ALLE_SEIZOENEN: Seizoen[] = ['lente', 'zomer', 'herfst', 'winter'];

/**
 * Let op de overlap: droge lucht en dorst delen de verwarming, te veel water en
 * te weinig licht delen de hoek. Dat is geen slordigheid maar het hele punt —
 * de aarde en het seizoen beslissen welke van de twee het is.
 */
const OMSTANDIGHEDEN: Record<PlantProblemCause, Omstandigheden> = {
  'te-weinig-water': { plekken: ['kamer', 'zuidraam', 'verwarming', 'hoek'], seizoenen: ALLE_SEIZOENEN, aarde: 'kurkdroog' },
  'te-veel-water': { plekken: ['kamer', 'hoek', 'badkamer'], seizoenen: ALLE_SEIZOENEN, aarde: 'drijfnat' },
  'te-veel-zon': { plekken: ['zuidraam'], seizoenen: ['lente', 'zomer'], aarde: 'gewoon' },
  'te-weinig-licht': { plekken: ['hoek', 'badkamer'], seizoenen: ALLE_SEIZOENEN, aarde: 'gewoon' },
  'droge-lucht': { plekken: ['verwarming'], seizoenen: ['herfst', 'winter'], aarde: 'gewoon' },
  'te-koud': { plekken: ['koud-glas'], seizoenen: ['winter'], aarde: 'gewoon' },
};

/** Een patiënt met zijn omstandigheden erbij. */
export interface Geval extends PatientKind {
  seizoen: Seizoen;
  plek: Plek;
  aarde: Aarde;
  /** Hoeveel dagen geleden hij voor het laatst water kreeg. */
  dagenGeleden: number;
}

/**
 * Maak de omstandigheden bij een patiënt. `kiesGetal` is injecteerbaar zodat
 * een test altijd hetzelfde geval krijgt.
 */
export function maakGeval(kind: PatientKind, kiesGetal: () => number = Math.random): Geval {
  const regels = OMSTANDIGHEDEN[kind.cause];
  const pak = <T,>(opties: T[]): T => opties[Math.min(opties.length - 1, Math.max(0, Math.floor(kiesGetal() * opties.length)))];
  const species = PLANT_SPECIES_BY_ID[kind.speciesId];
  const normaal = species?.waterDays ?? 7;
  // Dorst hoort bij lang geleden, natte voeten bij gisteren, de rest zit ertussen.
  const dagenGeleden = regels.aarde === 'kurkdroog' ? normaal * 2 + 2
    : regels.aarde === 'drijfnat' ? 1
    : Math.max(1, Math.round(normaal / 2));
  return { ...kind, seizoen: pak(regels.seizoenen), plek: pak(regels.plekken), aarde: regels.aarde, dagenGeleden };
}

/** Wat je bij déze plant aan de bladeren ziet; dat verschilt per soort. */
export function clueText(species: PlantSpecies, geval: Geval, spot: ClueSpot): string {
  if (spot === 'blad') {
    return plantFirstAid(species.id).find(probleem => probleem.cause === geval.cause)?.signs
      ?? 'Er is iets met de bladeren, maar wat precies is lastig te zeggen.';
  }
  if (spot === 'aarde') {
    return `${AARDE_TEKST[geval.aarde]} Hij kreeg ${geval.dagenGeleden} dagen geleden voor het laatst water.`;
  }
  // Kiki noemt alleen feiten; welke oorzaak het is zegt ze niet.
  return `Het baasje zegt: ${PLEK_TEKST[geval.plek]}, en ${SEIZOEN_TEKST[geval.seizoen]}.`;
}

/** Het gereedschap in de dokterstas. */
export type TreatmentId = 'gieter' | 'laten-drogen' | 'ompotten' | 'schaduw' | 'meer-licht' | 'sproeien' | 'warmer';

export interface Treatment {
  id: TreatmentId;
  label: string;
  /** Wat Kiki zegt als dit de verkeerde keuze is. */
  mis: string;
}

export const TREATMENTS: Treatment[] = [
  { id: 'gieter', label: 'Water geven', mis: 'Water lost dit niet op, en te veel water is net zo erg als te weinig.' },
  { id: 'laten-drogen', label: 'Even niet gieten', mis: 'Niets doen helpt hier niet; er is iets anders aan de hand.' },
  { id: 'ompotten', label: 'Ompotten in droge aarde', mis: 'Ompotten is een flinke ingreep. Deze plant heeft iets eenvoudigers nodig.' },
  { id: 'schaduw', label: 'Uit de zon zetten', mis: 'Aan de zon ligt het niet. Kijk nog eens naar je aanwijzingen.' },
  { id: 'meer-licht', label: 'Lichter zetten', mis: 'Meer licht is hier niet het antwoord.' },
  { id: 'sproeien', label: 'Bladeren sproeien', mis: 'Sproeien is lekker, maar het probleem zit hier ergens anders.' },
  { id: 'warmer', label: 'Warmer zetten', mis: 'Aan de kou ligt het niet.' },
];

export const TREATMENTS_BY_ID = Object.fromEntries(TREATMENTS.map(t => [t.id, t])) as Record<TreatmentId, Treatment>;

/** Elk gereedschap heeft nu zijn eigen tekening; geen lijn-iconen meer. */
export const GEREEDSCHAP_PLAATJE: Record<TreatmentId, string> = {
  gieter: PLANT_ICOON.gieter,
  'laten-drogen': PLANT_GEREEDSCHAP.zandloper,
  ompotten: PLANT_GEREEDSCHAP.bloempot,
  schaduw: PLANT_GEREEDSCHAP.parasol,
  'meer-licht': PLANT_GEREEDSCHAP.lamp,
  sproeien: PLANT_GEREEDSCHAP.plantenspuit,
  warmer: PLANT_GEREEDSCHAP.sjaal,
};

const BASIS_BEHANDELING: Record<PlantProblemCause, TreatmentId> = {
  'te-weinig-water': 'gieter',
  'te-veel-water': 'laten-drogen',
  'te-veel-zon': 'schaduw',
  'te-weinig-licht': 'meer-licht',
  'droge-lucht': 'sproeien',
  'te-koud': 'warmer',
};

/**
 * Welke behandeling bij deze plant hoort.
 *
 * Bij te veel water hangt het antwoord van de soort af. Een monstera droogt
 * vanzelf weer op, maar bij een cactus, een vetplant, een vrouwentong of een
 * orchidee is de voet dan al aan het rotten. Wachten helpt dan niet meer: die
 * moeten eruit, het rotte eraf, en in verse droge aarde.
 */
export function treatmentFor(species: PlantSpecies, cause: PlantProblemCause): TreatmentId {
  if (cause === 'te-veel-water' && species.overwaterAfter <= 2) return 'ompotten';
  return BASIS_BEHANDELING[cause];
}

/** Wat Kiki zegt als de behandeling klopt. */
export const TREATMENT_SUCCESS: Record<TreatmentId, string> = {
  gieter: 'Een flinke gieter vol. Kijk, hij komt alweer overeind!',
  'laten-drogen': 'Goed dat je de gieter laat staan. De aarde mag eerst opdrogen.',
  ompotten: 'Uit de natte aarde, het rotte eraf, en in verse droge grond. Net op tijd.',
  schaduw: 'Een plekje uit de felle zon. De nieuwe bladeren blijven nu heel.',
  'meer-licht': 'Dichter bij het raam. Hij groeit weer recht omhoog.',
  sproeien: 'Lekker gesproeid. Nu voelt het weer als het regenwoud.',
  warmer: 'Weg van het koude glas. Hij knapt er zichtbaar van op.',
};

/** Het stadiumplaatje dat bij een oorzaak hoort. */
export const STAGE_FOR_CAUSE: Partial<Record<PlantProblemCause, PlantStage>> = {
  'te-weinig-water': 'thirst1',
  'te-veel-water': 'wet1',
};

/**
 * Welke patiënten er kunnen komen: alleen combinaties waar een plaatje van is,
 * anders zou een kind naar een gezonde plant zitten kijken.
 */
export interface PatientKind {
  speciesId: string;
  cause: PlantProblemCause;
  /** Het plaatje van de zieke plant. */
  image: string;
}

export const PATIENT_KINDS: PatientKind[] = PLANT_SPECIES.flatMap(species => {
  const art = species.art;
  if (!art) return [];
  const pad = (naam: string) => `/assets/library/plants/${species.id}/${naam}`;
  const map: Array<[PlantProblemCause, string | null]> = [
    ['te-weinig-water', art.dry ? pad('dry-1.webp') : null],
    ['te-veel-water', art.wet ? pad('wet-1.webp') : null],
    ['te-veel-zon', art.sun ? pad('sun-1.webp') : null],
    ['te-weinig-licht', art.dark ? pad('dark-1.webp') : null],
    // Droge lucht en kou hebben nog geen eigen tekening. Ze lenen het plaatje
    // waar ze het meest op lijken: bruine knisperpunten bij droogteschade,
    // zachte plekken bij natschade. Het blad alléén zegt dan niets meer, en
    // dat klopt ook — de aarde en het seizoen moeten het verschil maken.
    // docs/plantendokter-assets.md vraagt het echte tekenwerk aan.
    ['droge-lucht', art.dry ? pad('dry-1.webp') : null],
    ['te-koud', art.wet ? pad('wet-1.webp') : null],
  ];
  // Zonder EHBO-tekst zou het bladspoor nietszeggend zijn; zo'n patiënt komt niet.
  const beschreven = new Set(plantFirstAid(species.id).map(probleem => probleem.cause));
  return map
    .filter((entry): entry is [PlantProblemCause, string] => entry[1] !== null && beschreven.has(entry[0]))
    .map(([cause, image]) => ({ speciesId: species.id, cause, image }));
});

/** Alle oorzaken die het spreekuur kent, in vaste volgorde. */
export const DIAGNOSE_CHOICES: PlantProblemCause[] = [
  'te-weinig-water',
  'te-veel-water',
  'te-veel-zon',
  'te-weinig-licht',
  'droge-lucht',
  'te-koud',
];

/**
 * Waarmee een oorzaak het makkelijkst verward wordt.
 *
 * Droge lucht en dorst geven allebei bruine punten; te veel water en kou geven
 * allebei zachte plekken. Juist díé moeten naast elkaar staan, want daar leert
 * een kind van. Een rijtje met drie antwoorden die er niets mee te maken hebben
 * is geen vraag maar een cadeautje.
 */
const VERWARRING: Record<PlantProblemCause, [PlantProblemCause, PlantProblemCause]> = {
  'te-weinig-water': ['droge-lucht', 'te-veel-water'],
  'te-veel-water': ['te-weinig-water', 'te-koud'],
  'te-veel-zon': ['te-weinig-water', 'droge-lucht'],
  'te-weinig-licht': ['te-veel-water', 'te-koud'],
  'droge-lucht': ['te-weinig-water', 'te-veel-zon'],
  'te-koud': ['te-veel-water', 'te-weinig-licht'],
};

/**
 * Vier antwoorden per patiënt: het juiste, de twee waar het op lijkt, en één
 * vierde die van het geval afhangt. Alle zes tegelijk is te veel om te
 * overzien; altijd dezelfde vier leer je uit je hoofd. Dezelfde patiënt geeft
 * wel altijd hetzelfde rijtje, anders wordt terugkomen stiekem makkelijker.
 */
export function diagnoseKeuzes(geval: Geval): PlantProblemCause[] {
  const kern = [geval.cause, ...VERWARRING[geval.cause]];
  const rest = DIAGNOSE_CHOICES.filter(cause => !kern.includes(cause));
  const zaad = [...`${geval.speciesId}:${geval.cause}:${geval.plek}`].reduce((som, teken) => som + teken.charCodeAt(0), 0);
  const vierde = rest[zaad % rest.length];
  return DIAGNOSE_CHOICES.filter(cause => kern.includes(cause) || cause === vierde);
}

export { PLANT_PROBLEM_LABEL, PLANT_SPECIES_BY_ID };
