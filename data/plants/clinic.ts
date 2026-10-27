import { PLANT_SPECIES, PLANT_SPECIES_BY_ID, type PlantSpecies, type PlantStage } from './species';
import { plantFirstAid, PLANT_PROBLEM_LABEL, type PlantProblemCause } from './firstAid';

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
 * Getekende plaatjes bij de knoppen. Waar er nog geen tekening is valt het
 * scherm terug op een lijn-icoon; docs/plantendokter-assets.md zegt welke
 * er nog ontbreken.
 */
const ICOON_MAP = '/assets/library/plants/icons';

export const CLUE_ICOON: Record<ClueSpot, string> = {
  blad: `${ICOON_MAP}/blad.webp`,
  aarde: `${ICOON_MAP}/aarde.webp`,
  plek: `${ICOON_MAP}/plek.webp`,
};

export const OORZAAK_PLAATJE: Partial<Record<PlantProblemCause, string>> = {
  'te-weinig-water': `${ICOON_MAP}/droog.webp`,
  'te-veel-water': `${ICOON_MAP}/nat.webp`,
  'te-veel-zon': `${ICOON_MAP}/zon.webp`,
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
export const NAAM_BONUS = 1;

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

/** Wat de aarde en de standplaats verraden; dat is bij elke plant hetzelfde. */
const ALGEMENE_AANWIJZING: Record<PlantProblemCause, { aarde: string; plek: string }> = {
  'te-weinig-water': {
    aarde: 'De aarde is kurkdroog en laat los van de pot.',
    plek: 'Hij stond gewoon binnen, maar er is lang geen water gegeven.',
  },
  'te-veel-water': {
    aarde: 'De aarde is drijfnat en er staat water in de schotel.',
    plek: 'Hij stond binnen en kreeg elke dag een scheutje.',
  },
  'te-veel-zon': {
    aarde: 'De aarde voelt normaal: niet te nat, niet te droog.',
    plek: 'Hij stond de hele dag pal voor het zuidraam, in de volle zon.',
  },
  'te-weinig-licht': {
    aarde: 'De aarde voelt normaal: niet te nat, niet te droog.',
    plek: 'Hij stond achterin de kamer, ver bij het raam vandaan.',
  },
  'droge-lucht': {
    aarde: 'De aarde is vochtig genoeg.',
    plek: 'Hij stond vlak boven de verwarming.',
  },
  'te-koud': {
    aarde: 'De aarde voelt koud en klam aan.',
    plek: 'Hij stond ’s nachts achter het gordijn tegen het koude glas.',
  },
};

/** Wat je bij déze plant aan de bladeren ziet; dat verschilt per soort. */
export function clueText(species: PlantSpecies, cause: PlantProblemCause, spot: ClueSpot): string {
  if (spot === 'blad') {
    return plantFirstAid(species.id).find(probleem => probleem.cause === cause)?.signs
      ?? 'Er is iets met de bladeren, maar wat precies is lastig te zeggen.';
  }
  return ALGEMENE_AANWIJZING[cause][spot];
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

export const GEREEDSCHAP_PLAATJE: Partial<Record<TreatmentId, string>> = {
  gieter: `${ICOON_MAP}/gieter.webp`,
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
  const map: Array<[PlantProblemCause, string | null]> = [
    ['te-weinig-water', art.dry ? `/assets/library/plants/${species.id}/dry-1.webp` : null],
    ['te-veel-water', art.wet ? `/assets/library/plants/${species.id}/wet-1.webp` : null],
    ['te-veel-zon', art.sun ? `/assets/library/plants/${species.id}/sun-1.webp` : null],
    ['te-weinig-licht', art.dark ? `/assets/library/plants/${species.id}/dark-1.webp` : null],
  ];
  // Zonder EHBO-tekst zou het bladspoor nietszeggend zijn; zo'n patiënt komt niet.
  const beschreven = new Set(plantFirstAid(species.id).map(probleem => probleem.cause));
  return map
    .filter((entry): entry is [PlantProblemCause, string] => entry[1] !== null && beschreven.has(entry[0]))
    .map(([cause, image]) => ({ speciesId: species.id, cause, image }));
});

/** De vier oorzaken waar een kind uit kiest, in vaste volgorde. */
export const DIAGNOSE_CHOICES: PlantProblemCause[] = [
  'te-weinig-water',
  'te-veel-water',
  'te-veel-zon',
  'te-weinig-licht',
];

export { PLANT_PROBLEM_LABEL, PLANT_SPECIES_BY_ID };
