# Dreamworld-migratie

## Architectuur

De React 19 / TypeScript / Vite-app houdt zijn eigen router en lazy-loaded
modules. `/` is de application entry, geen marketingpagina. Een toekomstige
publieke website kan onafhankelijk worden toegevoegd. Geen backend, auth,
valuta of opslagformaat toegevoegd.

`platform/dreamworld.ts` koppelt zes eilanden aan locaties, bestaande modules,
achtergronden, beschikbaarheid en toekomstige uitbreidingen. `WorldMapViewer`
deelt een beeldvlak met genormaliseerde hotspots; beeld en hotspots krijgen
dezelfde pan/zoom-transformatie. Pointerbeweging van 8px wordt slepen, geen klik.
Toetsenbordfocus brengt de bestemming in beeld. Mobiel kun je slepen en de
linker-/rechterpijl gebruiken. Er zijn geen zichtbare naampillen of eilandenstrip.
`?hotspots` toont ontwikkelgrenzen.

`IslandEnvironment` hergebruikt bestaande achtergronden en losse activiteitassets.
Er zijn nog geen definitieve illustraties voor elk individueel eiland. De
officiele wereldkaart blijft een ongewijzigd geheel in `public/dreamworld/`.
Het boekenhuis links is Taleneiland; het verre kasteel blijft onderdeel van
het landschap, zonder een verzonnen zevende activiteit.

## Audit en bestemmingen

| Eiland | Bestaande modules / routes |
| --- | --- |
| Mijn boomhut | TreehouseRoom, TreehouseInterior, RoomInventoryDrawer, RoomNavigation, kameruitbreidingen; `/treehouse/*`. Winkels via het globale menu. |
| Rekeneiland | Alle zes MATH_GAMES uit de echte configuratie via MathModule: Lua, Bessenplukkers, Bosavontuur, Koekjeschaos, Honingfabriek en Winkelgekte. Directe `/school/math/:game`-ingangen; bestaande engines, moeilijkheid, geluid, beloning en voortgang blijven. |
| Kookeiland | CookbookScreen, InteractiveKitchen, CookingExperience en ontdek-/reken-/geheugenstappen. Voeding opent het bestaande encyclopedietabblad. Receptboodschappen blijven verbonden met de globale supermarkt. |
| Planteneiland | PlantFamilyPanel, PlantClinicScreen, EncyclopediaScreen. Een geadopteerde plant blijft hetzelfde object, ook in de boomhut. Planten kopen gaat via het globale winkelmenu. |
| Ontdekkingseiland | Game / GameEngine / ToetsGame met Leaflet en learning-data; vlaggenmemory; ClockModule met geheugen-, zet-, race- en wereldtijdspel. Reizen blijft gereserveerd. |
| Taleneiland | Binnenkort-scherm; geen verzonnen taalengine. |

Oude bookmarks blijven geldig, waaronder `/cooking`, `/topo`, `/treehouse/encyclopedia`,
`/games/red-baby-lua`, `/challenges`, `/shop` en `/school/math`. Het School-overzicht
op die laatste twee oefenroutes wordt vervangen door het rekeneiland; de oude
componenten blijven beschikbaar in de repository.

## Gegevens en economie

Geen bestaande sleutel wordt verwijderd of gewist. Behouden zijn onder meer:

- De atomaire wallet/document-store in `localState` en het currency-ledger.
- `cocokiki:cooking:v1`, kooksession en receptreizen, ingredientvoorraad,
  keukengerei, ontdekkingen en afgeronde recepten.
- `cocokiki:shopping:v1:*`: winkelmandjes met prijssnapshots.
- `cocokiki:room-inventory:v1`: bezit, transacties, plaatsingen, draaiing en lagen.
- `cocokiki:room-expansions:v1`: gekochte binnenkamers en balkonzones.
- `cocokiki:plant-family:v1`, plant-knowledge en plant-clinic: namen, conditie,
  adopties, verzorging, diagnoses, stempels en ontdekkingen.
- Reken-/racevoortgang, klokvoortgang en topo learning/test drafts.
- `cocokiki:profile-avatar:v1` en bestaande avatarmigratie.

De rugzak leest het bestaande kamerbezit, geen tweede inventaris. Boodschappen
blijven via de keuken bereikbaar. Prestaties blijven binnen de bestaande
spelvoortgang; er wordt geen nieuw XP- of achievementsysteem verzonnen.

## Navigatie en samenwerking

De globale shell houdt logo, wallet, profiel, kaart en rugzak beschikbaar.
De terugbestemming van een activiteit komt uit de eilandconfiguratie. Interne
spelstappen en de bestaande topo-verlaatbeveiliging blijven gehandhaafd.

Werkbranch: `codex/dreamworld-migration`. Niet automatisch deployen of pushen.
De andere checkout op Desktop wordt niet stilzwijgend naar deze branch gezet.
Synchroniseer deze migratie bewust met Claude voordat beiden dezelfde bestanden
gaan aanpassen.

## Validatie op 28 oktober 2026

- 210 tests groen, inclusief bestaande wallet-, aankoop-, recept-, planten-,
  kamer-, topo-, reken- en kloktests. Nieuwe tests controleren zes eilanden,
  unieke routes, bestaande assets, niet-overlappende hotspots, alle rekenmodules,
  globale winkels, kaartgrenzen, beeldverhouding en receptlinks.
- TypeScript en productiebuild slagen. De bestaande waarschuwing over de
  grote lazy-loaded Phaser/Baby Lua-bundel blijft staan.
- Ingebouwde browser: alle zes eilanden via de wereldkaart geopend. Via
  eilanden getest: kookboek, supermarkt, koekjes, topo, klokoverzicht,
  plantendokter, plantenverzameling, plantenwinkel, meubelwinkel en woonkamer.
- Een bestaande topo-toets met ingevuld antwoord en rekenniveau 3 blijven
  zichtbaar. Verlaten van de topo-toets vraagt nog steeds bevestiging.
- Lopend fruityoghurtrecept hervat; de voorraadwaarschuwing linkt met hetzelfde
  recept naar `/shop/groceries?recipe=fruit-yogurt`, inclusief receptlijstje.
- Desktop 1440x900 en mobiel 360x800 bekeken; horizontale pagina-overflow
  gecontroleerd. Zoom, slepen zonder activeren, centreren en mobiele
  eilandpositionering getest. Rekenplekken krijgen op mobiel twee kolommen.
- Geen echte telefoons getest en geen volledige nieuwe aankoop/kookronde in
  de browser voltooid. Transacties en kookengine zijn wel automatisch getest.

## Resterende verfijning

De eilandachtergronden zijn bestaande illustraties. Eigen eilandartwork kan
later per configuratieregel worden vervangen; geen nieuwe engine nodig.
De rugzak toont bestaande meubels en planten; boodschappen blijven in de
keukenvoorraad. Taalspelletjes zijn bewust nog niet gebouwd.
De marketingwebsite, accounts en backend vallen buiten deze migratie.

## Vereenvoudiging na eerste preview

Winkels zijn verplaatst naar een vaste winkeltas in het globale menu.
`WORLD_SHOPS` bevat Boodschappen, Meubels en Planten. Een gedeelde dialoog
opent de bestaande winkelmodules; de eilandactiviteiten bevatten geen winkels
meer. Bezit, prijzen, receptlijstjes en transacties zijn ongewijzigd.
Mobiel zit de rugzak in het profielmenu om de winkelknop ruim bereikbaar te houden.
De oude winkelpleinroute blijft beschikbaar als terugweg tussen de winkels.

De keuze tussen eigen keuken en kookstudio staat nog open. Advies: laat de
eigen keuken de enige kookplek zijn; gebruik Kookeiland voor recepten en
voeding. De kookstudio-ingang is in afwachting van die keuze niet gewijzigd.

## Opruiming van de eilanden

De wereldafbeelding bedekt nu het volledige venster, achter het vaste menu.
Slepen, zoomen en de mobiele pijlen blijven beschikbaar. Titelplaten en
naamknoppen op de eilanden zijn verwijderd; de raakvlakken houden hun
toegankelijke namen. Alle rekenmodules zijn beeldvullend zonder buitenkaart;
Lua gebruikt een vensterhoge Phaser-container zonder de oude vaste hoogte.

Planteneiland opent rechtstreeks de plantendokter. De oude eilandroute
verwijst door en de terugknop gaat naar de wereld, niet opnieuw naar de dokter.
Mijn planten is bereikbaar vanuit de rugzak, naast het inrichten van kamers.
De encyclopedie heeft een eigen vaste knop in het globale menu.
Ontdekkingseiland bevat vlaggenmemory in plaats van de onvoltooide Reiskamer.
Dat hergebruikt het bestaande memorybord met landen en vlaggen, eigen rondes,
bestaande voortgang/opslag en muntbeloningen, zonder de actieve topo-toets
te lezen of te wijzigen. Kookeiland blijft voorlopig ongewijzigd.

De boomhut-hotspot opent nu direct `/treehouse`; `/islands/home` verwijst
door. Ook de overige rekenmodules hebben geen extra titelbalk meer: hun
speelvlak vult het venster, met compacte niveau- en geluidsbediening.
Memory gebruikt een gedeeld compact raster voor vlaggen/weetjes, klokken en
voedingsstoffen. Vlaggen tonen zes paren tegelijk, weetjes vier en voeding
maximaal zes. Alleen toegankelijke kaartnamen houden een nummer; op de
achterkant staat geen zichtbaar cijfer. Tekstkaartjes blijven wat hoger dan
vlaggenkaartjes om leesbaar te blijven op mobiel.

Vlaggenmemory heeft een centrale catalogus van 197 landen/vlaggen:
Europa 45, Afrika 54, Azië 49, Noord-Amerika 23, Zuid-Amerika 12, Oceanië 14.
De geografische indeling volgt VN M49; Kosovo en Taiwan zijn ook opgenomen.
Antarctica krijgt geen landenvlaggen. Een kind kiest eerst een continent.
Elke ronde bevat zes paren; bestaande oefenvoortgang zorgt dat ongeoefende
vlaggen eerst komen. Alle eerdere vlag-ID's blijven gelijk. De topo-kaart
blijft zijn eigen locaties gebruiken; er zijn geen verzonnen kaartpunten
toegevoegd voor nieuwe vlaggen.

## Wereldtijden bij Klokkijken

Klokkijken bevat nu een vierde ingang: Wereldtijden. Het onderdeel combineert
een interactieve wereldklok (drie zelfgekozen steden uit dertien tijdzones)
met oefenen op vijf niveaus. De schuifregelaar en uurknoppen verschuiven
hetzelfde tijdstip voor alle steden; Nu hervat de actuele tijd.
`Intl.DateTimeFormat` berekent lokale tijden en datums, inclusief zomer- en
wintertijd. Er zijn geen vaste uurverschillen in de spelregels opgeslagen.

Oefeningen geven een lokale tijd en het tijdverschil. Het kind vult de tijd
en dezelfde/vorige/volgende dag in. Tips leggen optellen, aftrekken en het
passeren van middernacht uit. Een ronde van vijf opgeloste vragen gebruikt
de bestaande klokbeloningen en unieke rondetokens. Migratie van de bestaande
klokvoortgang behoudt alle drie oude spellen en voegt `world-times` toe.
Tests dekken onder andere Amerikaanse/Europese zomertijd op verschillende
datums, Sydney, halve/kwartiertijdzones, 00:00 en een jaargrens.

## Eilandiconen

De zes hotspots hebben een compact rond icoon uit het aangeleverde
afbeeldingsvel: huis, rekenmachine, koksmuts, plantje, wereldbol en boek.
Het originele vel wordt als gedeelde CSS-sprite gebruikt, zonder opnieuw
getekende iconen of naamknoppen. Elk icoon blijft 64 CSS-pixels groot bij
zoomen. Het hele eiland blijft klikbaar; tooltips, toetsenbordfocus,
schuiven en de directe ingangen naar boomhut en plantendokter blijven behouden.
