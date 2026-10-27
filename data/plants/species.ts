import { DECOR_PRODUCTS_BY_ID } from '../decorCatalog';

/**
 * De plantensoorten achter de planten in de winkel.
 *
 * De namen zijn zo nauwkeurig mogelijk gehouden. Waar het plaatje de soort niet
 * met zekerheid prijsgeeft staat er bewust een geslacht of familie in plaats van
 * een verzonnen soortnaam; `nameCertainty` zegt hoe zeker een naam is, zodat een
 * naam later verfijnd kan worden zonder de rest aan te passen.
 */
export type NameCertainty = 'species' | 'genus' | 'family';

/**
 * Hoe dorstig een plant is. De namen zijn met opzet neutraal: wat je ziet
 * verschilt per soort. Een varen wordt bruin en bros waar een monstera slap
 * gaat hangen, en juist dat verschil is wat er te leren valt.
 */
export type ThirstStage = 'thirst1' | 'thirst2' | 'thirst3';
/** Te nat: eerst blijft de aarde drassig, daarna gaat de voet rotten. */
export type WetStage = 'wet1' | 'wet2';
export type PlantStage = 'fresh' | ThirstStage | WetStage;

export interface PlantSymptom {
  /** Kort en concreet: wat je aan de plant ziet. */
  label: string;
  /** Wat Kiki erover zegt, in kindertaal. */
  kiki: string;
}

export interface PlantSpecies {
  /** Gelijk aan het product-id in de plantenwinkel. */
  id: string;
  commonName: string;
  scientificName: string;
  nameCertainty: NameCertainty;
  origin: string;
  habitat: string;
  light: string;
  water: string;
  funFact: string;
  /** Wat Kiki erover zegt, in kindertaal. */
  kikiTip: string;
  /** Na hoeveel dagen deze plant weer water wil. */
  waterDays: number;
  /**
   * Hoe vaak je te vroeg mag gieten voordat de aarde te nat wordt. Een cactus
   * heeft aan één keer te veel genoeg, een varen vindt het juist prettig.
   */
  overwaterAfter: number;
  /** Wat er te zien is bij toenemende dorst; verschilt per soort. */
  symptoms: Record<ThirstStage, PlantSymptom>;
  /**
   * Welk tekenwerk er per oorzaak klaarstaat, in
   * /assets/library/plants/<id>/. Een getal zegt hoeveel stappen er zijn:
   * `dry: 3` betekent dry-1.webp tot dry-3.webp. Is er maar één plaatje, dan
   * dient dat voor elk stadium. Zonder tekenwerk blijft het winkelplaatje
   * staan; de tekst en Kiki kloppen dan nog steeds.
   */
  art?: { dry?: number; wet?: number; sun?: boolean; dark?: boolean };
}

export const PLANT_SPECIES: PlantSpecies[] = [
  {
    id: 'monstera-basket',
    commonName: 'Monstera',
    scientificName: 'Monstera deliciosa',
    nameCertainty: 'species',
    origin: 'Zuid-Mexico en Midden-Amerika',
    habitat: 'Klimt tegen boomstammen in warme, vochtige regenwouden.',
    light: 'Veel licht, maar niet recht in de zon.',
    water: 'Water als de bovenste laag aarde droog voelt.',
    funFact: 'De gaten in de bladeren laten wind en regen erdoor, zodat grote bladeren niet scheuren.',
    kikiTip: 'Zie je die gaten? Daar waait de wind zo doorheen. Slim bedacht door de plant zelf!',
    waterDays: 7,
    overwaterAfter: 3,
    art: { dry: 3 },
    symptoms: {
      thirst1: { label: 'Bladeren hangen slap', kiki: 'De bladeren hangen omlaag. Dat is hoe een monstera om water vraagt.' },
      thirst2: { label: 'Gele onderbladeren', kiki: 'De onderste bladeren worden geel. Die geeft hij als eerste op.' },
      thirst3: { label: 'Bruine droge randen', kiki: 'De randen zijn bruin en hard geworden. Geef snel water!' },
    },
  },
  {
    id: 'palm-white-pot',
    commonName: 'Palm in witte pot',
    scientificName: 'Arecaceae (palmenfamilie)',
    nameCertainty: 'family',
    origin: 'Palmen groeien in warme streken over de hele wereld.',
    habitat: 'In het wild vaak in bossen en langs kusten in de tropen.',
    light: 'Veel licht, het liefst via een lichte gordijn.',
    water: 'Houd de aarde een beetje vochtig, maar nooit kletsnat.',
    funFact: 'Een palm heeft geen takken: alle bladeren groeien uit één punt bovenaan de stam.',
    kikiTip: 'Een palm vindt natte voeten niet fijn. Giet het water weg dat in de schotel blijft staan.',
    waterDays: 7,
    overwaterAfter: 3,
    symptoms: {
      thirst1: { label: 'Bruine puntjes', kiki: 'Kijk naar de puntjes van de bladeren. Een palm begint daar altijd.' },
      thirst2: { label: 'Onderste veren bruin', kiki: 'De onderste bladveren zijn bruin en de bovenste beginnen te hangen.' },
      thirst3: { label: 'Droge opgekrulde veren', kiki: 'De bladveren krullen naar binnen en voelen als papier. Water!' },
    },
  },
  {
    id: 'palm-clay-pot',
    commonName: 'Palm in kleipot',
    scientificName: 'Arecaceae (palmenfamilie)',
    nameCertainty: 'family',
    origin: 'Palmen groeien in warme streken over de hele wereld.',
    habitat: 'Vaak in de schaduw van grotere bomen in het tropisch bos.',
    light: 'Licht, maar niet urenlang in de felle zon.',
    water: 'Een beetje vochtig houden; laat de pot goed uitlekken.',
    funFact: 'Een kleipot ademt: er verdampt water door de wand, waardoor de aarde sneller droogt.',
    kikiTip: 'In een kleipot droogt de aarde sneller. Voel dus iets vaker of hij water wil.',
    waterDays: 6,
    overwaterAfter: 3,
    symptoms: {
      thirst1: { label: 'Bruine puntjes', kiki: 'De puntjes worden droog. In een kleipot gaat dat sneller dan je denkt.' },
      thirst2: { label: 'Onderste veren bruin', kiki: 'De onderste bladveren geven het op. Tijd voor water.' },
      thirst3: { label: 'Witte rand op de pot', kiki: 'Zie je die witte rand op de pot? Die blijft achter als water verdampt.' },
    },
  },
  {
    id: 'snake-plant',
    commonName: 'Vrouwentong',
    scientificName: 'Dracaena trifasciata',
    nameCertainty: 'species',
    origin: 'West-Afrika',
    habitat: 'Droge, rotsachtige plekken waar het lang niet regent.',
    light: 'Kan bijna overal staan, van halfschaduw tot veel licht.',
    water: 'Heel weinig. In de winter soms maar één keer per maand.',
    funFact: 'Deze plant heette vroeger Sansevieria, maar onderzoekers ontdekten dat hij bij Dracaena hoort.',
    kikiTip: 'Dit is de makkelijkste plant die er is. Vergeet je water te geven? Hij vindt het prima.',
    waterDays: 21,
    overwaterAfter: 2,
    art: { dry: 1, wet: 1, sun: true },
    symptoms: {
      thirst1: { label: 'Rimpels in het blad', kiki: 'Fijne rimpeltjes in de lengte. Hij blijft stevig, maar hij wil water.' },
      thirst2: { label: 'Bladeren buigen opzij', kiki: 'De toppen buigen opzij. Deze plant wordt nooit slap zoals andere.' },
      thirst3: { label: 'Bladeren vallen open', kiki: 'Hij valt naar buiten open. Dat doet hij pas als het echt lang duurt.' },
    },
  },
  {
    id: 'hanging-fern',
    commonName: 'Hangvaren',
    scientificName: 'Nephrolepis (zwaardvarens)',
    nameCertainty: 'genus',
    origin: 'Tropische gebieden wereldwijd',
    habitat: 'Op de schaduwrijke, vochtige bodem van het regenwoud.',
    light: 'Halfschaduw. Felle zon verbrandt de blaadjes.',
    water: 'Houd de aarde steeds een beetje vochtig.',
    funFact: 'Varens maken geen zaadjes maar sporen: piepkleine stipjes aan de onderkant van het blad.',
    kikiTip: 'Varens houden van vochtige lucht. In de badkamer voelen ze zich thuis.',
    waterDays: 3,
    overwaterAfter: 5,
    art: { dry: 1, wet: 1, sun: true },
    symptoms: {
      thirst1: { label: 'Bruine puntjes', kiki: 'De puntjes kleuren bruin. Een varen heeft het snelst dorst van allemaal.' },
      thirst2: { label: 'Opgekrulde bruine blaadjes', kiki: 'De blaadjes krullen op en worden bruin. Hij wordt niet geel, maar bruin.' },
      thirst3: { label: 'Bros en kaal', kiki: 'De blaadjes verkruimelen als je ze aanraakt. Water, snel!' },
    },
  },
  {
    id: 'hanging-vine',
    commonName: 'Hangende klimop',
    scientificName: 'Klimplant, soort nog niet vastgesteld',
    nameCertainty: 'family',
    origin: 'Hangplanten komen uit verschillende warme streken.',
    habitat: 'Klimt of hangt langs bomen en rotsen.',
    light: 'Licht tot halfschaduw.',
    water: 'Water als de bovenste laag aarde droog aanvoelt.',
    funFact: 'Hangplanten gebruiken luchtworteltjes om zich aan bomen en muren vast te houden.',
    kikiTip: 'Hang deze hoog op, dan kunnen de ranken lekker naar beneden groeien.',
    waterDays: 7,
    overwaterAfter: 3,
    art: { dry: 1, wet: 1, dark: true },
    symptoms: {
      thirst1: { label: 'Slappe ranken', kiki: 'De ranken hangen slapper dan anders en de blaadjes krullen een beetje.' },
      thirst2: { label: 'Gele blaadjes vallen', kiki: 'Langs de ranken worden blaadjes geel en vallen eraf.' },
      thirst3: { label: 'Kale ranken', kiki: 'Alleen bovenaan zitten nog blaadjes. De rest is kaal.' },
    },
  },
  {
    id: 'white-flower',
    commonName: 'Lepelplant',
    scientificName: 'Spathiphyllum',
    nameCertainty: 'genus',
    origin: 'Midden- en Zuid-Amerika',
    habitat: 'In de schaduw op de bosbodem van het regenwoud.',
    light: 'Halfschaduw. Hij hoeft geen direct zonlicht.',
    water: 'Regelmatig water; hij laat zijn bladeren hangen als hij dorst heeft.',
    funFact: 'Het witte "bloemblad" is geen bloem maar een schutblad; de echte bloemetjes zitten op de kolf in het midden.',
    kikiTip: 'Laat hij zijn blad hangen? Geef water, dan staat hij een paar uur later weer rechtop.',
    waterDays: 5,
    overwaterAfter: 4,
    art: { dry: 1, wet: 1, sun: true },
    symptoms: {
      thirst1: { label: 'Alles hangt over de rand', kiki: 'Hij hangt helemaal over de pot. Dit is zijn manier van roepen.' },
      thirst2: { label: 'Helemaal in elkaar gezakt', kiki: 'Schrik niet. Geef water en over een paar uur staat hij weer rechtop.' },
      thirst3: { label: 'Bruine randen en bloem', kiki: 'Nu wordt het blad bruin aan de rand. Dat gaat niet meer weg.' },
    },
  },
  {
    id: 'pink-flower',
    commonName: 'Flamingoplant',
    scientificName: 'Anthurium',
    nameCertainty: 'genus',
    origin: 'Midden- en Zuid-Amerika',
    habitat: 'Groeit in het regenwoud vaak op bomen in plaats van in de grond.',
    light: 'Veel licht, maar niet recht in de zon.',
    water: 'Een beetje vochtig houden, nooit in een laagje water.',
    funFact: 'Net als bij de lepelplant is het gekleurde deel een schutblad en geen echte bloem.',
    kikiTip: 'Zie je dat staafje in het midden? Daar zitten de echte bloemetjes op.',
    waterDays: 6,
    overwaterAfter: 3,
    art: { dry: 1, wet: 1, sun: true },
    symptoms: {
      thirst1: { label: 'De glans is weg', kiki: 'De bladeren glimmen niet meer en hangen een beetje.' },
      thirst2: { label: 'Gele vlekken', kiki: 'Op de oudste bladeren komen gele vlekken en het roze verbleekt.' },
      thirst3: { label: 'Bruine punt aan het roze', kiki: 'Zelfs het roze schutblad wordt bruin. Geef snel water.' },
    },
  },
  {
    id: 'orange-tree',
    commonName: 'Sinaasappelboompje',
    scientificName: 'Citrus',
    nameCertainty: 'genus',
    origin: 'Zuidoost-Azië',
    habitat: 'Warme, zonnige streken met milde winters.',
    light: 'Zo veel mogelijk zon.',
    water: 'In de zomer regelmatig, in de winter veel minder.',
    funFact: 'Citrusbomen kunnen bloeien en vruchten dragen op hetzelfde moment.',
    kikiTip: 'Wrijf eens zachtjes over een blaadje en ruik aan je vingers. Citrus!',
    waterDays: 5,
    overwaterAfter: 3,
    art: { dry: 1, wet: 1, sun: true },
    symptoms: {
      thirst1: { label: 'Blaadjes krullen omhoog', kiki: 'De blaadjes vouwen omhoog als bootjes. Zo verdampt er minder water.' },
      thirst2: { label: 'Blaadjes vallen af', kiki: 'Een citrus laat gewoon zijn blad vallen als hij dorst heeft.' },
      thirst3: { label: 'Kale takjes', kiki: 'De takjes worden kaal en de sinaasappeltjes blijven klein.' },
    },
  },
  {
    id: 'orchid',
    commonName: 'Vlinderorchidee',
    scientificName: 'Phalaenopsis',
    nameCertainty: 'genus',
    origin: 'Zuidoost-Azië en Australië',
    habitat: 'Groeit op boomtakken en haalt vocht uit de lucht.',
    light: 'Licht, maar niet in de volle zon.',
    water: 'Weinig. Een klein beetje water per week is genoeg.',
    funFact: 'Orchideeën groeien niet in gewone aarde maar in boomschors, want hun wortels willen lucht.',
    kikiTip: 'Dikke grijsgroene wortels boven de pot zijn normaal. Laat ze gewoon zitten.',
    waterDays: 7,
    overwaterAfter: 2,
    art: { dry: 1, wet: 1, sun: true },
    symptoms: {
      thirst1: { label: 'Zilvergrijze wortels', kiki: 'Kijk naar de wortels: groen is nat, zilvergrijs betekent dorst.' },
      thirst2: { label: 'Rimpels als een oude appel', kiki: 'De bladeren rimpelen, net als een appel die te lang ligt.' },
      thirst3: { label: 'Bloemen vallen af', kiki: 'De bloemen laten los. Die komen pas volgend jaar terug.' },
    },
  },
  {
    id: 'succulent',
    commonName: 'Vetplantje',
    scientificName: 'Vetplant, soort nog niet vastgesteld',
    nameCertainty: 'family',
    origin: 'Droge gebieden op verschillende continenten.',
    habitat: 'Plekken waar het weinig regent en de zon fel schijnt.',
    light: 'Veel licht en zon.',
    water: 'Heel weinig. Laat de aarde eerst helemaal opdrogen.',
    funFact: 'Vetplanten bewaren water in hun dikke blaadjes; daarom voelen die zo stevig aan.',
    kikiTip: 'Te veel water is voor een vetplant erger dan te weinig. Echt waar.',
    waterDays: 21,
    overwaterAfter: 1,
    art: { dry: 1, wet: 1, dark: true },
    symptoms: {
      thirst1: { label: 'Minder bolle blaadjes', kiki: 'De blaadjes zijn minder dik. Daar bewaarde hij zijn water in.' },
      thirst2: { label: 'Rimpelige blaadjes', kiki: 'De blaadjes rimpelen en worden dunner.' },
      thirst3: { label: 'Papierachtige blaadjes', kiki: 'De onderste blaadjes zijn opgedroogd. Een klein scheutje is genoeg.' },
    },
  },
  {
    id: 'small-cactus',
    commonName: 'Kleine cactus',
    scientificName: 'Cactaceae (cactusfamilie)',
    nameCertainty: 'family',
    origin: 'Noord- en Zuid-Amerika',
    habitat: 'Woestijnen en droge vlaktes.',
    light: 'Veel zon.',
    water: 'Bijna nooit. In de winter helemaal niet.',
    funFact: 'De stekels van een cactus zijn omgebouwde bladeren; zo verdampt er bijna geen water.',
    kikiTip: 'Een cactus drinkt bijna niets. Eén keer per maand een scheutje is al genoeg.',
    waterDays: 30,
    overwaterAfter: 1,
    art: { dry: 1, wet: 1, dark: true },
    symptoms: {
      thirst1: { label: 'Iets smaller geworden', kiki: 'Hij is een beetje dunner. Zijn water is op.' },
      thirst2: { label: 'Rimpels in de lengte', kiki: 'Je ziet groeven in de lengte, net als bij een harmonica.' },
      thirst3: { label: 'Geschrompeld en grijzig', kiki: 'Nu heeft hij echt dorst. Maar niet te veel geven, hoor!' },
    },
  },
  {
    id: 'tall-cactus',
    commonName: 'Hoge cactus',
    scientificName: 'Cactaceae (cactusfamilie)',
    nameCertainty: 'family',
    origin: 'Noord- en Zuid-Amerika',
    habitat: 'Droge, warme streken met weinig regen.',
    light: 'Veel zon.',
    water: 'Heel weinig, en in de winter niet.',
    funFact: 'Een cactus zet zijn stam uit als een harmonica wanneer hij water opslaat.',
    kikiTip: 'Pak hem voorzichtig vast bij de pot, niet bij de cactus zelf.',
    waterDays: 30,
    overwaterAfter: 1,
    symptoms: {
      thirst1: { label: 'Iets smaller geworden', kiki: 'De stam is wat dunner. Daar zat zijn watervoorraad.' },
      thirst2: { label: 'Rimpels in de lengte', kiki: 'De groeven worden dieper, zoals een harmonica die dichtgaat.' },
      thirst3: { label: 'De top buigt opzij', kiki: 'Hij kan zichzelf niet meer rechthouden. Geef hem een scheutje.' },
    },
  },
];

export const PLANT_SPECIES_BY_ID = Object.fromEntries(
  PLANT_SPECIES.map(species => [species.id, species]),
) as Record<string, PlantSpecies>;

/** Het winkelplaatje en de prijs komen uit de bestaande plantencatalogus. */
export function plantProduct(speciesId: string) {
  return DECOR_PRODUCTS_BY_ID[speciesId];
}

/**
 * Het plaatje bij een dorstige plant. Zonder eigen tekenwerk komt er niets
 * terug en blijft het winkelplaatje staan; de tekst klopt dan nog steeds.
 */
export function plantStageImage(species: PlantSpecies, stage: PlantStage): string | null {
  if (stage === 'fresh' || !species.art) return null;
  const stap = Number(stage.slice(-1));
  const soort = stage.startsWith('wet') ? 'wet' : 'dry';
  const beschikbaar = species.art[soort] ?? 0;
  if (beschikbaar < 1) return null;
  // Zijn er minder plaatjes dan stadia, dan blijft het laatste staan.
  return `/assets/library/plants/${species.id}/${soort}-${Math.min(stap, beschikbaar)}.webp`;
}

/**
 * De getekende plantenicoontjes, op één plek. Het spreekuur en de
 * verzorgkaart gebruiken dezelfde tekeningen, dus hoort het pad hier en niet
 * in een van de twee schermen.
 */
const ICOON_MAP = '/assets/library/plants/icons';

export const PLANT_ICOON = {
  blad: `${ICOON_MAP}/blad.webp`,
  aarde: `${ICOON_MAP}/aarde.webp`,
  plek: `${ICOON_MAP}/plek.webp`,
  gieter: `${ICOON_MAP}/gieter.webp`,
  droog: `${ICOON_MAP}/droog.webp`,
  nat: `${ICOON_MAP}/nat.webp`,
  zon: `${ICOON_MAP}/zon.webp`,
  donker: `${ICOON_MAP}/donker.webp`,
  drogeLucht: `${ICOON_MAP}/droge-lucht.webp`,
  koud: `${ICOON_MAP}/koud.webp`,
} as const;

/** Het gereedschap uit de dokterstas, als getekend voorwerp. */
const GEREEDSCHAP_MAP = '/assets/library/plants/gereedschap';

export const PLANT_GEREEDSCHAP = {
  parasol: `${GEREEDSCHAP_MAP}/parasol.webp`,
  lamp: `${GEREEDSCHAP_MAP}/lamp-plant.webp`,
  plantenspuit: `${GEREEDSCHAP_MAP}/plantenspuit.webp`,
  zandloper: `${GEREEDSCHAP_MAP}/zandloper.webp`,
  bloempot: `${GEREEDSCHAP_MAP}/bloempot.webp`,
  sjaal: `${GEREEDSCHAP_MAP}/sjaal.webp`,
} as const;
