import { PLANT_SPECIES } from './species';

/**
 * Het EHBO-boek bij de planten.
 *
 * Dorst is maar één manier waarop het misgaat. Veel planten gaan juist kapot
 * aan te veel water of staan op de verkeerde plek. Per soort staat hier wat je
 * ziet en wat je eraan doet, in de volgorde waarin het bij die plant het vaakst
 * misgaat — de bovenste is dus de belangrijkste.
 */
export type PlantProblemCause =
  | 'te-weinig-water'
  | 'te-veel-water'
  | 'te-veel-zon'
  | 'te-weinig-licht'
  | 'droge-lucht'
  | 'te-koud';

export interface PlantProblem {
  cause: PlantProblemCause;
  /** Wat je aan de plant ziet. */
  signs: string;
  /** Wat je eraan doet. */
  fix: string;
}

export const PLANT_PROBLEM_LABEL: Record<PlantProblemCause, string> = {
  'te-weinig-water': 'Te weinig water',
  'te-veel-water': 'Te veel water',
  'te-veel-zon': 'Te veel zon',
  'te-weinig-licht': 'Te weinig licht',
  'droge-lucht': 'Te droge lucht',
  'te-koud': 'Te koud',
};

export const PLANT_FIRST_AID: Record<string, PlantProblem[]> = {
  'monstera-basket': [
    { cause: 'te-weinig-water', signs: 'De bladeren hangen slap omlaag en de aarde voelt kurkdroog.', fix: 'Geef water tot het onderuit de pot loopt. Morgen staat hij weer rechtop.' },
    { cause: 'te-veel-water', signs: 'Gele bladeren met bruine zachte plekken, terwijl de aarde nat blijft.', fix: 'Giet de schotel leeg en wacht tot de aarde bovenin droog is.' },
    { cause: 'te-veel-zon', signs: 'Bleke bladeren met witgele verbrande vlekken.', fix: 'Zet hem een meter verder van het raam of achter een dun gordijn.' },
    { cause: 'te-weinig-licht', signs: 'Nieuwe bladeren blijven klein en krijgen geen gaten.', fix: 'Zet hem lichter neer. De gaten komen pas bij genoeg licht.' },
  ],
  'palm-white-pot': [
    { cause: 'droge-lucht', signs: 'Bruine knisperende puntjes, terwijl de aarde gewoon vochtig is.', fix: 'Sproei de bladeren af of zet hem weg bij de verwarming.' },
    { cause: 'te-veel-water', signs: 'De onderste bladveren worden geel en de aarde blijft dagenlang nat.', fix: 'Giet de schotel altijd leeg. Een palm wil geen natte voeten.' },
    { cause: 'te-weinig-water', signs: 'De punten van alle bladeren worden droog en bruin.', fix: 'Houd de aarde licht vochtig, maar nooit kletsnat.' },
    { cause: 'te-veel-zon', signs: 'Verbleekte strepen op de bladveren.', fix: 'Fel middagzon is te veel. Licht achter een gordijn is perfect.' },
  ],
  'palm-clay-pot': [
    { cause: 'te-weinig-water', signs: 'Droge bruine punten, en een witte kalkrand op de pot.', fix: 'In een kleipot droogt de aarde sneller. Voel vaker even met je vinger.' },
    { cause: 'droge-lucht', signs: 'Bruine puntjes terwijl de aarde nog vochtig is.', fix: 'Sproei de bladeren af, vooral in de winter.' },
    { cause: 'te-veel-water', signs: 'Gele onderste veren bij natte aarde.', fix: 'Laat de pot goed uitlekken en giet de schotel leeg.' },
    { cause: 'te-veel-zon', signs: 'Bleke, verschroeide plekken op de veren.', fix: 'Uit de felle middagzon halen.' },
  ],
  'snake-plant': [
    { cause: 'te-veel-water', signs: 'De voet wordt geel en zacht en het blad knikt om bij de aarde.', fix: 'Haal hem uit de natte aarde, snijd het zachte deel eraf en pot hem om in verse droge grond.' },
    { cause: 'te-weinig-water', signs: 'Fijne rimpels in de lengte van het blad.', fix: 'Een scheutje is genoeg. Hij houdt van droog.' },
    { cause: 'te-weinig-licht', signs: 'Hij groeit maanden niet en de gele randen vervagen.', fix: 'Zet hem lichter neer. Hij overleeft donker wel, maar groeit dan niet.' },
    { cause: 'te-veel-zon', signs: 'Grote bleke beige plekken midden op de bladeren, aan de kant van het raam.', fix: 'Achter glas is de middagzon te fel. Zet hem een stuk van het raam af.' },
    { cause: 'te-koud', signs: 'Zachte doorweekte plekken na een koude nacht.', fix: 'Houd hem binnen boven de tien graden en zet hem niet in de tocht.' },
  ],
  'hanging-fern': [
    { cause: 'droge-lucht', signs: 'Bruine knisperende puntjes, terwijl de aarde vochtig is.', fix: 'Sproei hem dagelijks of hang hem in de badkamer. Dit is zijn grootste probleem.' },
    { cause: 'te-weinig-water', signs: 'Hele blaadjes bruin en opgekruld, de pot is licht van gewicht.', fix: 'Dompel de pot even onder in een emmer water.' },
    { cause: 'te-veel-zon', signs: 'Verbleekte, verschroeide blaadjes aan de zonkant.', fix: 'Een varen hoort in de schaduw, net als op de bosbodem.' },
    { cause: 'te-veel-water', signs: 'Zwarte slappe steeltjes en aarde die zuur ruikt.', fix: 'Vochtig is goed, drassig niet. Laat de pot uitlekken.' },
  ],
  'hanging-vine': [
    { cause: 'te-weinig-water', signs: 'De ranken hangen slap en de blaadjes krullen om.', fix: 'Geef water en laat de pot uitlekken.' },
    { cause: 'te-veel-water', signs: 'Gele blaadjes die eraf vallen terwijl de aarde nat is.', fix: 'Wacht tot de bovenste laag droog voelt voordat je weer giet.' },
    { cause: 'te-weinig-licht', signs: 'Lange kale stukken rank met heel ver uit elkaar staande blaadjes.', fix: 'Lichter ophangen. Je mag de kale ranken terugknippen.' },
    { cause: 'te-veel-zon', signs: 'Bleke blaadjes met droge randjes.', fix: 'Licht is goed, volle zon niet.' },
  ],
  'white-flower': [
    { cause: 'te-weinig-water', signs: 'Hij zakt helemaal in elkaar over de rand van de pot.', fix: 'Geef water. Binnen een paar uur staat hij weer rechtop, alsof er niets was.' },
    { cause: 'te-veel-water', signs: 'Gele bladeren met bruine slappe punten bij natte aarde.', fix: 'Laat hem eerst opdrogen. Hij mag nooit in een laagje water staan.' },
    { cause: 'te-veel-zon', signs: 'Bleke strepen en droge bruine randen.', fix: 'Hij komt van de donkere bosbodem. Halfschaduw is zijn plek.' },
    { cause: 'te-weinig-licht', signs: 'Hij blijft groen maar maakt geen witte bloemen meer.', fix: 'Iets lichter zetten, dan komen de bloemen terug.' },
  ],
  'pink-flower': [
    { cause: 'te-veel-water', signs: 'Gele onderbladeren en aarde die nat blijft en zuur ruikt.', fix: 'Giet de schotel leeg. Zijn wortels willen lucht, net als bij een orchidee.' },
    { cause: 'te-weinig-water', signs: 'De bladeren verliezen hun glans en gaan hangen.', fix: 'Houd de aarde licht vochtig.' },
    { cause: 'te-weinig-licht', signs: 'Er komen geen nieuwe roze schutbladen bij.', fix: 'Zet hem lichter, maar niet in de volle zon.' },
    { cause: 'te-veel-zon', signs: 'Bruine verbrande plekken midden op het blad.', fix: 'Uit het directe zonlicht halen.' },
  ],
  'orange-tree': [
    { cause: 'te-weinig-water', signs: 'De blaadjes vouwen omhoog als bootjes en vallen daarna af.', fix: 'In de zomer flink water geven, in de winter veel minder.' },
    { cause: 'te-veel-water', signs: 'Gele bladeren met groene nerven, en ze vallen ook af.', fix: 'Laat de aarde tussendoor opdrogen. Natte wortels kunnen niets opnemen.' },
    { cause: 'te-weinig-licht', signs: 'Lange slappe twijgen en geen bloemen of vruchtjes.', fix: 'Zo veel mogelijk zon. Dit is een echte zonaanbidder.' },
    { cause: 'te-veel-zon', signs: 'De bladeren worden bleekgeel en verliezen hun diepe groen.', fix: 'Een citrus wil zon, maar niet achter glas op het heetst van de dag. Geef hem dan schaduw.' },
    { cause: 'te-koud', signs: 'Na een koude tochtige nacht ligt het blad op de grond.', fix: 'Zet hem weg bij open ramen en deuren.' },
  ],
  orchid: [
    { cause: 'te-veel-water', signs: 'Slappe gele bladeren en bruine zachte wortels.', fix: 'Pot hem om in verse boomschors en knip de bruine zachte wortels eraf. Hier gaan de meeste orchideeën aan kapot.' },
    { cause: 'te-weinig-water', signs: 'De bladeren rimpelen en de wortels zijn zilvergrijs.', fix: 'Dompel de pot tien minuten in water. Groene wortels betekent genoeg.' },
    { cause: 'te-veel-zon', signs: 'Een gele of roodachtige verbrande plek op het blad.', fix: 'Licht, maar nooit in de volle middagzon.' },
    { cause: 'te-weinig-licht', signs: 'Donkergroene slappe bladeren en geen nieuwe bloemtak.', fix: 'Zet hem bij een lichter raam, dan komt er een nieuwe tak.' },
  ],
  succulent: [
    { cause: 'te-veel-water', signs: 'Doorschijnende geelbruine slappe blaadjes die er zomaar afvallen.', fix: 'Pot hem om in verse droge aarde; de wortels zijn al aan het rotten. Hier gaat hij aan dood.' },
    { cause: 'te-weinig-licht', signs: 'Hij rekt zich uit naar het raam met een lange dunne steel.', fix: 'Veel meer licht. Het uitgerekte stuk wordt nooit meer kort.' },
    { cause: 'te-weinig-water', signs: 'De blaadjes zijn minder bol en rimpelen.', fix: 'Een scheutje water, daarna weken niets.' },
    { cause: 'te-veel-zon', signs: 'Droge bruine plekken op de blaadjes na een verhuizing naar de zon.', fix: 'Laat hem langzaam wennen in plaats van in één keer in de volle zon.' },
  ],
  'small-cactus': [
    { cause: 'te-veel-water', signs: 'Een bruine zachte, glimmende plek onderaan de stam.', fix: 'Pot hem om in verse droge aarde en snijd het zachte deel weg. Dit is dodelijker dan dorst.' },
    { cause: 'te-weinig-water', signs: 'Hij wordt smaller en krijgt groeven in de lengte.', fix: 'Een scheutje. Eén keer per maand is genoeg.' },
    { cause: 'te-weinig-licht', signs: 'Bovenop groeit een dunne bleke punt naar het raam toe.', fix: 'Veel meer zon. Dat dunne stuk blijft altijd dun.' },
    { cause: 'te-koud', signs: 'Natte rotte voet na een koude winter op de vensterbank.', fix: 'In de winter koel én kurkdroog houden, nooit koud en nat tegelijk.' },
  ],
  'tall-cactus': [
    { cause: 'te-veel-water', signs: 'Een zachte bruine plek onderaan, de cactus wordt wiebelig.', fix: 'Direct ompotten in droge grond en het zachte deel wegsnijden. Hier gaat hij sneller aan dood dan aan droogte.' },
    { cause: 'te-weinig-water', signs: 'De stam wordt dunner en de top buigt opzij.', fix: 'Een scheutje water, daarna weer weken niets.' },
    { cause: 'te-weinig-licht', signs: 'De top groeit dun en bleek scheef naar het licht.', fix: 'Zo veel mogelijk zon, en draai hem af en toe een kwartslag.' },
    { cause: 'te-koud', signs: 'Glazige zachte plekken na een koude nacht.', fix: 'Haal hem voor de winter naar binnen, weg van het koude glas.' },
  ],
};

/** De EHBO-kaart bij een soort; elke plant in de winkel heeft er een. */
export function plantFirstAid(speciesId: string): PlantProblem[] {
  return PLANT_FIRST_AID[speciesId] ?? [];
}

/** Waar de tekst opraakt moet dat opvallen, niet stilletjes leeg blijven. */
export const PLANTS_WITHOUT_FIRST_AID = PLANT_SPECIES
  .filter(species => plantFirstAid(species.id).length === 0)
  .map(species => species.id);
