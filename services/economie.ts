/**
 * De economie van CocoKiki: alle bedragen op één plek.
 *
 * Uitgangspunten (zie docs/economie.md):
 * 1. Leren levert geld op, niet klikken of tijd. Met hulp verdien je niets.
 * 2. Eén tempo: ongeveer 6 munten per leerminuut (zo'n 3 goede sommen per minuut).
 * 3. Een opdracht geeft een kleine, voorspelbare afrondbonus bovenop de sommen.
 * 4. De boomhut is een lang doel: vol in ongeveer 100 dagen van 20 minuten.
 *
 * Een spel of kaartje schrijft hier nooit zelf een bedrag bij; een test bewaakt dat.
 */

/** Munten per goed antwoord dat je zelf bedacht. */
export const PER_ANTWOORD = 2;
/** Een redactiesom is ongeveer een minuut denkwerk, met meerdere stappen. */
export const REDACTIE_PER_SOM = 6;
/** Extra per antwoord op een moeilijk niveau (4 en 5). */
export const MOEILIJK_EXTRA = 1;

/** Afrondbonus van een opdracht, bovenop wat de sommen al opleverden. */
export const BONUS = { klein: 10, middel: 15, groot: 25, reis: 50 } as const;

/** Wat elke opdracht als bonus geeft. */
export const OPDRACHT_BONUS = {
  plantGenezen: BONUS.klein,
  /** Een recept helemaal klaarmaken in de keuken. */
  receptKlaar: BONUS.klein,
  oogstVerkopen: BONUS.klein,
  bakken: BONUS.middel,
  taart: BONUS.middel,
  inrichten: BONUS.groot,
  reis: BONUS.reis,
  /** Alle vijf de vragen van vandaag; per vraag een vijfde deel. */
  vandaag: BONUS.groot,
} as const;

/** Moestuin: één beloning per verzorgstap (rekenen én meten). */
export const TUIN_PER_STAP = 4;

/** Na zoveel munten uit één spel op één dag krijg je de helft: afwisselen loont. */
export const DAG_LIMIET_PER_SPEL = 180;

/** Een gewone speeldag van 20 minuten, voor de balanstest. */
export const MUNTEN_PER_SPEELDAG = 20 * 6;

/** Prijzen in de winkel, per soort; de catalogus rekent hiermee. */
export const PRIJS = {
  /** Kamers worden steeds duurder: basis plus een stap per kamer die je al hebt. */
  kamerBinnen: 300, kamerBalkon: 250, kamerStap: 150, tuinkamerExtra: 150,
  dak: { blauw: 150, bloemen: 200 },
} as const;

/**
 * Winkelprijs uit de basisprijs van de catalogus: klein decor 20–45, meubels
 * ongeveer 60–150, grote stukken tot 250. Afgerond op vijf munten.
 */
export function winkelPrijs(basis: number): number {
  const vijf = (n: number) => Math.round(n / 5) * 5;
  return basis <= 30 ? Math.max(20, vijf(basis * 1.5)) : Math.min(250, vijf(basis * 1.7));
}

/** Munten voor één goed antwoord, met de moeilijkheid erbij. */
export function muntenVoorAntwoord(moeilijk = false): number {
  return PER_ANTWOORD + (moeilijk ? MOEILIJK_EXTRA : 0);
}
