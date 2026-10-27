import { PLANT_GEREEDSCHAP, PLANT_ICOON } from './species';
import { PLANT_PROBLEM_LABEL, type PlantProblemCause } from './firstAid';

/**
 * Het plantenboek: wat een kind moet weten vóór het gaat raden.
 *
 * In het spreekuur stond die kennis nergens. Een kind zag drie aanwijzingen en
 * moest maar gokken welke oorzaak erbij hoorde. Dit boekje staat open tijdens
 * het hele consult, is gratis, en verklapt niets over wélke plant er voor je
 * staat — het gaat over planten in het algemeen. Zo blijft de naamvraag aan
 * het eind een echte vraag.
 */
export interface WijzerPagina {
  cause: PlantProblemCause;
  /** Het plaatje van het probleem. */
  plaatje: string;
  /** Het plaatje van de oplossing. */
  gereedschap: string;
  /** Waaraan je het ziet. */
  zieJe: string;
  /** Hoe het zover komt. */
  komtDoor: string;
  /** Wat je eraan doet. */
  watDoeJe: string;
  /**
   * Kiki's vuistregel: de denkstap die naar het antwoord leidt. Dit is wat ze
   * zegt als je om hulp vraagt, in plaats van "kijk nog eens goed".
   */
  vuistregel: string;
}

export const PLANTENWIJZER: WijzerPagina[] = [
  {
    cause: 'te-weinig-water',
    plaatje: PLANT_ICOON.droog,
    gereedschap: PLANT_ICOON.gieter,
    zieJe: 'De bladeren hangen slap of worden bruin en krokant aan de randen.',
    komtDoor: 'De aarde is helemaal opgedroogd. De wortels vinden niets meer om op te drinken.',
    watDoeJe: 'Geef water tot het onderuit de pot loopt. Binnen een paar uur staat hij weer rechtop.',
    vuistregel: 'Voel aan de aarde. Is die droog en kruimelig, dan heeft hij dorst. Bij te veel water zou de aarde juist nat zijn.',
  },
  {
    cause: 'te-veel-water',
    plaatje: PLANT_ICOON.nat,
    gereedschap: PLANT_GEREEDSCHAP.zandloper,
    zieJe: 'Gele, slappe bladeren terwijl de plant genoeg water heeft gehad. Soms een bruine zachte plek onderaan.',
    komtDoor: 'De aarde blijft nat, dus bij de wortels komt geen lucht meer. Daar gaan ze van rotten.',
    watDoeJe: 'Laat de gieter staan tot de aarde weer droog is. Is de stam al zacht, dan moet hij eruit en in verse droge aarde.',
    vuistregel: 'Slappe bladeren én natte aarde horen niet bij elkaar. Een plant die slap hangt in natte aarde heeft juist te véél water gehad.',
  },
  {
    cause: 'te-veel-zon',
    plaatje: PLANT_ICOON.zon,
    gereedschap: PLANT_GEREEDSCHAP.parasol,
    zieJe: 'Bleke of witgele plekken op de bladeren die naar de zon toe staan, met droge bruine randjes.',
    komtDoor: 'Felle middagzon door het glas verbrandt het blad, net als een zonnebrand.',
    watDoeJe: 'Zet hem een stuk van het raam af, of hang er iets voor dat de felste zon tegenhoudt.',
    vuistregel: 'Zit de schade alleen op de kant die naar het raam staat, dan komt het van de zon en niet van het water.',
  },
  {
    cause: 'te-weinig-licht',
    plaatje: PLANT_ICOON.donker,
    gereedschap: PLANT_GEREEDSCHAP.lamp,
    zieJe: 'Lange dunne stelen die naar één kant groeien, met veel ruimte tussen de bladeren.',
    komtDoor: 'In een donkere hoek rekt een plant zich uit naar het weinige licht dat er is.',
    watDoeJe: 'Zet hem dichter bij een raam, of geef hem een lamp.',
    vuistregel: 'Een plant die zich uitrekt zoekt licht. Dat heeft niets met water te maken: de aarde voelt dan gewoon normaal.',
  },
  {
    cause: 'droge-lucht',
    plaatje: PLANT_ICOON.drogeLucht,
    gereedschap: PLANT_GEREEDSCHAP.plantenspuit,
    zieJe: 'Bruine, papierachtige puntjes aan de randen van het blad, terwijl de aarde vochtig genoeg is.',
    komtDoor: 'Boven de verwarming is de lucht kurkdroog. Planten uit het regenwoud zijn vochtige lucht gewend.',
    watDoeJe: 'Sproei de bladeren, of zet hem ergens waar de lucht niet zo droog is.',
    vuistregel: 'Droge puntjes bij vochtige aarde komen niet van dorst, maar van de lucht eromheen.',
  },
  {
    cause: 'te-koud',
    plaatje: PLANT_ICOON.koud,
    gereedschap: PLANT_GEREEDSCHAP.sjaal,
    zieJe: 'Slappe, donkere of doorzichtige plekken op het blad, vaak van de ene op de andere dag.',
    komtDoor: 'Een koude tocht of een nacht tegen het raam is te veel voor een plant uit een warm land.',
    watDoeJe: 'Zet hem weg van het koude glas en uit de tocht.',
    vuistregel: 'Voelt de aarde koud en klam, en ging het ineens mis? Dan is het de kou en niet het water.',
  },
];

export const WIJZER_BY_CAUSE = Object.fromEntries(
  PLANTENWIJZER.map(pagina => [pagina.cause, pagina]),
) as Record<PlantProblemCause, WijzerPagina>;

/** De titel van een pagina, zodat boek en diagnosekaartjes dezelfde woorden gebruiken. */
export function wijzerTitel(cause: PlantProblemCause): string {
  return PLANT_PROBLEM_LABEL[cause];
}
