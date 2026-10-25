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
  },
];

export const PLANT_SPECIES_BY_ID = Object.fromEntries(
  PLANT_SPECIES.map(species => [species.id, species]),
) as Record<string, PlantSpecies>;

/** Het winkelplaatje en de prijs komen uit de bestaande plantencatalogus. */
export function plantProduct(speciesId: string) {
  return DECOR_PRODUCTS_BY_ID[speciesId];
}
