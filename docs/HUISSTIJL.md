# CocoKiki huisstijl

Dit document beschrijft hoe **elk** scherm van CocoKiki eruitziet, waar alles staat en hoe het aanvoelt. Dat geldt voor het eiland, de boomhut, keuken, kas, moestuin, school, wereld, winkels, opdrachten en losse spellen.

- Alle kleuren, letters, vormen, zones en bewegingen staan in `styles/cocokiki-tokens.css`. Dat is de enige bron.
- Het visuele overzicht staat in `docs/cocokiki_huisstijl.html`.
- Werkende voorbeelden staan in `docs/voorbeelden/`: `winkelgekte.html` en `moestuin.html`. Twee heel verschillende spellen, met precies dezelfde indeling en onderdelen. **Kopieer hun opbouw bij elk nieuw spel.**

## Waar het om draait

CocoKiki is een spel waarin kinderen leren zonder te merken dat ze leren. Ze helpen personages, verdienen munten en richten hun boomhut in. Niets mag aanvoelen als een werkblad, formulier of schoolapp. De wereld is de interface. De bediening is modern, vloeibaar glas dat over die wereld zweeft.

## De zes basisregels

1. **De wereld is de interface.** Prijzen, maten en hoeveelheden hangen áán dingen in de wereld (hangkaartjes). Een plek waar iets moet gebeuren licht op (doel). Er komen geen vraagvakken of witte kaarten over de illustratie.
2. **Alles staat op een vaste plek.** Terug, munten, menu, gereedschap, personage en antwoorden staan in élk spel op dezelfde plek (zie "Vaste plekken").
3. **Vloeibaar glas en speelstukken.** Bediening is doorschijnend glas met een glans die meebeweegt. Waar je mee speelt zijn dikke, kleurige bellen en knoppen. Nooit kantoor.
4. **Doen in plaats van kiezen.** Laat kinderen slepen, vullen, wegen, planten en tellen in de wereld. Tikken op een antwoord mag altijd ook, als snelle route.
5. **Elke actie een reactie.** Veren, vonken, geluid, munten die naar de teller vliegen. Bij een fout wiebelt het antwoord, geeft het personage een hint en licht het juiste hulpmiddel op. Nooit rood.
6. **Het verhaal loopt door.** Personages praten in maximaal twee regels. Na een goed antwoord gaat het spel vloeiend verder met nieuwe dingen in de wereld. Er komen geen tussenschermen of "Volgende som"-knoppen.

## Vaste plekken

Elk spel en elke opdracht gebruikt deze zeven zones. Bouw ze met de klassen uit `cocokiki-tokens.css` binnen een `.ck-scherm`.

| # | Zone | Plek | Klasse | Inhoud |
|---|---|---|---|---|
| 1 | Terug | linksboven | `.ck-zone-terug` | precies één terugknop |
| 2 | Statuseiland | midden boven | `.ck-zone-status` | munten · voortgang als bolletjes · niveau. Rekt uit bij een beloning (`.is-open`) en krimpt weer |
| 3 | Menu | rechtsboven | `.ck-zone-menu` | winkel · To Do · profiel, altijd in deze volgorde |
| 4 | Gereedschapsbalk | rechts, verticaal | `.ck-zone-gereedschap` | vaste volgorde: hint · rekenmachine · liniaal/maten · kalender · mand — lijn — geluid. Toon alleen wat het spel nodig heeft |
| 5 | Personage | linksonder | `.ck-zone-personage` | wie de vraag stelt, met ballon |
| 6 | Antwoorden of hoofdknop | rechtsonder, naast de gereedschapsbalk | `.ck-zone-antwoord` | bellen om te tikken of te slepen, óf één hoofdknop |
| 7 | Speelveld | de rest | — | de wereld, met hangkaartjes, doelen en objecten |

Op het eiland zelf (laag 1) staan alleen zone 2 (munten) en zone 3. Daar mag het CocoKiki-logo linksboven staan in plaats van de terugknop.

## Navigatie

- **Drie lagen, niet meer:** eiland → wereld (keuken, kas, school, boomhut …) → spel of opdracht. Terug gaat altijd precies één laag omhoog. Voortgang wordt automatisch bewaard, dus er komt geen "weet je het zeker?".
- **Zoomen in plaats van wisselen:** van eiland naar wereld zoom je in op het gebouw, terug zoom je uit. Geen harde schermwissels of lege laadschermen.
- **Panelen schuiven van rechts** (`.ck-paneel`): winkel, To Do, rugzak, plantenboek en kookboek openen als glazen paneel over de wereld, hooguit de helft van het scherm. Sluiten met × in het paneel of tik ernaast. Nooit een nieuwe pagina, nooit een tweede terugknop.
- **Geen bladerknoppen in spellen:** geen "Som 1 van 10" met pijltjes of keuzelijst. Voortgang is bolletjes in het statuseiland. Een eerdere vraag terugzien kan door op een bolletje te tikken.
- **Instellingen zijn geen speelgoed:** niveau kiezen, ouderinstellingen en uitleg voor thuis zitten achter het profiel. Geluid staat onderaan de gereedschapsbalk. Niets hiervan staat midden in beeld.
- **Hetzelfde icoon = hetzelfde ding:** één icoon per functie in de hele game. De liniaal is altijd "maten", de mand altijd "oogst/inventaris", de rekenmachine altijd "rekenmachine".

## Kleuren

### Wereldkleuren
Elke wereld heeft één eigen kleur, afkomstig van de knoppen op het eiland. De **hoofdknop**, het **niveau-label**, de **voortgangsbolletjes** en **actief gereedschap** krijgen de kleur van de wereld waar het kind is. Stel dit in met `data-wereld="..."` op de `.ck-scherm`.

| Wereld | Variabele | Kleur | Waarvoor |
|---|---|---|---|
| Keuken | `--ck-keuken` | #FF6B3D | bakken, koken, recepten |
| Tuin | `--ck-tuin` | #3FBF5A | kas, moestuin, plantendokter |
| School | `--ck-school` | #22B59A | rekenen, taal, los oefenen, winkelgekte |
| Wereld | `--ck-wereld` | #3AA8F5 | topografie, vlaggen, klok |
| Boomhut | `--ck-boomhut` | #FFB52E | inrichten, meubels |

### Vaste kleuren (overal dezelfde betekenis)
| Naam | Variabele | Kleur | Alleen voor |
|---|---|---|---|
| Zonnebloem | `--ck-zon` | #FFC93A | munten, sterren, getallen markeren in een vraag |
| Bes | `--ck-bes` | #FF5FA2 | namen van personages in ballonnen |
| Druif | `--ck-druif` | #9B6BFF | bonus, verzamelkaart, iets zeldzaams |
| Hout | `--ck-hout` | #C9824A | naamborden, titels, To Do-bord |
| Room | `--ck-room` | #FFF8EC | papier, kaartjes |
| Cacao | `--ck-cacao` | #4A2A1A | alle tekst |

Antwoordbellen hebben vaste kleuren in deze volgorde: blauw, bes, groen, druif (`.ck-bel--1` t/m `--4`).

Er komen **geen** andere kleuren bij. Geen grijs, geen saliegroen en geen zwarte tekst.

## Letters
- **Baloo 2** (vet, 700–800): titels, knoppen, getallen, tekst in ballonnen en op hangkaartjes.
- **Nunito** (altijd vet, 700–900): alle overige tekst.
- Tekst is nooit kleiner dan 16 px op een telefoon. Gewone tekst is 18 px, ballonnen 23 px, getallen in een spel 28–40 px.
- Nooit Inter, Arial, Helvetica of de systeemletter.

## Oppervlakken

| Oppervlak | Klasse | Gebruik |
|---|---|---|
| Vloeibaar glas | `.ck-glas` | alle vaste zones, panelen, hangkaartjes, bellen |
| Papier | `.ck-papier`, `.ck-speelkaart` | kaartjes met een illustratie (menu's, winkelitems) |
| Hout | `.ck-hout` | naam van een wereld, titel van een paneel, To Do-bord |
| Speelstuk | `.ck-knop`, `.ck-tegel`, `.ck-bel` | alles wat je tikt of sleept |

Zet de glans van het glas mee met de muis of vinger door `--ck-glans-x` te vullen (zie voorbeelden). Laat de wereld ook licht meebewegen (parallax, een paar pixels).

## Onderdelen

- **Hangkaartje** (`.ck-hangkaartje`): prijs, maat of hoeveelheid aan een touwtje bij het ding in de wereld. Het schommelt zacht.
- **Doel** (`.ck-doel`): de plek waar het antwoord heen moet, met een stippelrand die zacht pulseert. Krijgt `.is-over` als je er iets boven sleept.
- **Bel** (`.ck-bel`): glazen antwoord dat zweeft. Tikken = kiezen, slepen naar het doel = kiezen. Goed: de andere bellen worden `.is-weg`. Fout: `.is-fout` (wiebel).
- **Statuseiland**: bij een goed antwoord vliegen munten van de bel naar de munt in het eiland. Het eiland rekt uit (`.is-open`) en toont "+5", een verzamelkaart en een titel ("Kassa-held"), en krimpt na ongeveer 2 seconden weer.
- **Gereedschap**: een hulpmiddel dat in gebruik is, of dat oplicht als hint na een fout, krijgt `.is-aan`.
- **Hoofdknop** (`.ck-knop--hoofd`): als een scherm geen bellen heeft (bijvoorbeeld "Start kookavontuur"). Precies één, in zone 6, in de wereldkleur.
- **Tekstballon** (`.ck-ballon`): het gezicht van het personage, de naam in bes-roze en maximaal twee regels. Het personage springt blij op bij een goed antwoord (`.is-blij`).
- **Speelkaartje** (`.ck-speelkaart`): keuzes in een menu of winkel. Bovenin een illustratie, eronder de naam of prijs.
- **Paneel** (`.ck-paneel`): glas, schuift van rechts, met een houten titel.

## Beweging en geluid
- Alles komt binnen met een veer (`--ck-veer`). Niets springt hard aan of uit.
- Bellen zweven, hangkaartjes schommelen, doelen pulseren. Er is altijd iets dat leeft.
- Elke tik geeft een zacht geluidje. Goed geeft een oplopend belletje en munten-tikjes. Fout geeft een zacht "boing", nooit een zoemer.
- Respecteer "minder beweging" van het apparaat (`prefers-reduced-motion`). Dat staat al in de CSS.

## Belonen en voortgang
- Na elke goede actie verschijnt binnen een halve seconde een beloning: vonken, munten naar de teller, en het statuseiland rekt uit.
- Weetjes worden **verzamelkaarten**, geen alinea's.
- Voortgang in een spel is bolletjes in het statuseiland. Voortgang in een opdracht mag ook zichtbaar worden in de wereld: plantjes die groeien, ingrediënten op de plank, meubels in de boomhut.
- Beloon nieuwsgierigheid en doorzetten, niet snelheid. Gebruik geen tijdsdruk zonder keuze, geen "je verliest je reeks" en geen straf voor fouten.

## Schermtypes

| Scherm | Opbouw |
|---|---|
| Eiland (laag 1) | Volledige illustratie. Logo, statuseiland (alleen munten) en menu. Glimmende ronde wereldknoppen op de gebouwen. Zoomknoppen in glas rechtsonder. |
| Wereld (laag 2) | Volledige illustratie met het personage groot in beeld. Houten naambord. Keuzes als speelkaartjes onderin of rechts, nooit over het gezicht. Zones 1, 2 en 3. |
| Spel of opdracht (laag 3) | Alle zeven zones. Het onderwerp zit in de wereld, met hangkaartjes en een doel. Personage linksonder, bellen rechtsonder, gereedschap rechts. |
| Paneel (winkel, To Do, boeken) | Glazen paneel van rechts over de huidige laag. Bovenbalk blijft gelijk. |
| Tekenen / versieren | Werkvlak in het midden. Penselen en kleuren in de gereedschapsbalk rechts, "Klaar" als hoofdknop in zone 6. |

## Teksttoon
- Personages spreken het kind aan met "je", kort en vrolijk, zonder uitroeptekens achter elke zin.
- Knoppen beginnen met een werkwoord en zijn maximaal drie woorden.
- Vermijd schoolwoorden in het spel: liever "Help Seb", "Ontdek", "Bak" dan "opgave", "oefening" of "toets".
- Geen lange uitleg in beeld. Die komt van het personage via de hint-knop, of staat achter het profiel voor ouders.

## Nooit doen
- Grote witte of beige vlakken over de illustratie, of een vraag in een wit kader.
- Hulpmiddelen ergens anders dan in de gereedschapsbalk rechts, of twee terugknoppen.
- Bladerknoppen, keuzelijsten of tussenschermen in een spel ("Som 1 van 10", "Volgende som").
- Dunne grijze randen, tabellen of rijen met vinkjes.
- Grijs, saliegroen of kleuren die niet in `cocokiki-tokens.css` staan.
- Het standaardlettertype of tekst kleiner dan 16 px.
- Meer dan één hoofdknop, of een grijze uitgeschakelde knop.
- Meer dan twee regels in een ballon.
- Rood of kruisjes bij een fout antwoord.
- Emoji als iconen. Gebruik de eigen 3D-illustraties of de vaste lijn-iconen.
- Losse kleurcodes of afmetingen in componenten. Alles komt uit de variabelen.
