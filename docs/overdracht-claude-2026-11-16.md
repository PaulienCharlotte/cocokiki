# Overdracht voor Claude — 16 november 2026

## Uitgevoerd door Codex

- Homepage: één knus dorp met vijf aanklikbare gebouwen, paadjes, beek en brug. Authentieke bakkerij en Sebs ontdekkershuis, geen vuurtoren. Desktop- en mobiele illustratie delen ieder hun eigen genormaliseerde klikvlakken. Bestaande routes en dag-/nachtlucht behouden.
- Lua en Seb gebruiken nu eigen getekende klemborden; Coco en Kiki behouden hun bestaande klemborden. Lua heeft meerdere rijen keuzes, Seb drie keuzes. Lange namen blijven binnen de keuze.
- Vier wereldschermen delen een gedetailleerd houten naambord en ronde houten knopbasis. Teksten en spelillustraties blijven dynamisch.
- To Do: getekende papieren opdrachtbriefjes, messing punaise, houten titel. Vijf voor vandaag heeft een eigen illustratie en een prominente kaart. Witte onderlaag verwijderd; startknop onder de tekst uitgelijnd.
- Dagvragen betalen nu 10 CocoCoins per zelfstandig goed antwoord, maximaal 50 voor vijf. De bestaande eenmalige, atomaire uitbetaling blijft behouden. Oudere dagantwoorden tonen hun oude beloning van 2 munten, zonder opnieuw uit te betalen.
- Generatieprompts en materiaalafspraken staan in docs/design-concepts/*.md. De productiebeelden staan in public/dreamworld/village, public/assets/library/ui, school en travel. Oude losse planeetassets zijn bewaard voor eventueel hergebruik.

## Afgesproken: Mijn spellen via het hoofdmenu

Nu geïmplementeerd: /mijn-spellen, een spelcontrollerknop in het desktophoofdmenu en een item Mijn spellen in het mobiele navigatiemenu. Sterren bij spelkeuzes bewaren/verwijderen via services/favoriteGames.ts en de bestaande localState-opslag. De boomhut is expliciet NIET de ingang.

Gedrag en verdere afspraken:

1. Een ster bij een spel in het keuzescherm: toegankelijk label 'Bewaar in Mijn spellen' / 'Verwijder uit Mijn spellen'. Geen geneste knoppen; de ster staat naast de spelknop. Geen extra bediening midden in een lopend spel.
2. Een vaste ingang 'Mijn spellen' in het hoofdmenu. Op mobiel via het bestaande navigatiemenu; niet verstoppen onder de boomhut of profielinstellingen.
3. Een kleine verzameling met de vertrouwde illustraties; tikken opent direct het echte spel. Geen kopie van voortgang of eigen beloningslogica.
4. Opslaan met stabiele activiteit-ID's en de bestaande localState-infrastructuur. Dubbele routes/aliassen (bijvoorbeeld Baby Lua) normaliseren naar één favoriet. Filter onbekende of verdwenen activiteiten bij laden.
5. Geen verplicht minimum, geen automatische favorieten en geen nieuwe wereld op de homepage. Ster opnieuw aantikken verwijdert alleen de favoriet; voortgang blijft.

## Rekenen: hoofdmenu verkleind, inhoudelijke integratie nog open

Gebruiker wil minder losse spellen, en noemt Baby Lua, Winkelgekte, de honingpotten en het bessen verdelen als sterke spelvormen. Redactiesommen zijn schoolmateriaal en blijven inhoudelijk en qua stappen ongewijzigd.

Uitgevoerd: vijf herkenbare hoofdkeuzes in de rekenwerkplaats en MathHub — Baby Lua, Bessen verdelen, Honingpotten, Winkelgekte, Redactiesommen. Kloklezen staat alleen bij Seb. De oude missing- en maten-routes en hun voortgang bestaan nog. Het weglaten van hun menukaarten betekent NIET dat de opgaven al in andere spelvormen geïntegreerd zijn. Dat inhoudelijke vervolg staat hieronder.

| Huidig onderdeel | Voorstel |
|---|---|
| Het ontbrekende getal (`missing`) | Oefenvorm bij honingpotten en/of Winkelgekte, geen extra hoofdkaart. Winkelgekte heeft al ontbrekende-getalvragen; onderzoek de bestaande checkoutCatalog en engine vóór uitbreiding. |
| Maten (`maten`) | Geen los kaal vragenraster als einddoel. Oefen inhoud door afgemeten honing, gewicht door de oogst te verdelen, prijzen en hoeveelheden in Winkelgekte. Lengte/oppervlakte horen bij een concrete meetopdracht (bijvoorbeeld de bestaande moestuin/babykamer), niet geforceerd op de lopende band. |
| Baby Lua, delen, honingpotten, winkel | Bestaande spelbeleving behouden; breder oefenen via niveaus of een kleine instelling vóór de ronde. Niet elk type som als nieuw spel aanbieden. |
| Redactiesommen (`add-subtract`) | Onaangeroerd laten: schoolvragen, rekenstappen, volgorde en voortgang behouden. |

Niet alvast verwijderen: oude routes, opgeslagen sterren en voortgang. Eerst oefendoelen en bestaande generators inventariseren, dan één integratiegebied tegelijk bouwen en testen. Redirects pas wanneer de vervangende spelvorm dezelfde oefendoelen werkelijk dekt. Favorieten moeten oude spel-ID's kunnen blijven herkennen.

## Samenwerking

Tijdens deze sessie waren andere lokale wijzigingen aanwezig, onder meer aan rekenhulpmiddelen, hulp-panelen, GardenScreen, RedBabyLuaGame en gedeelde huisstijltokens. Die zijn niet teruggedraaid of meegenomen in de Codex-commit. Niet aannemen dat alle resterende lokale wijzigingen van dit werk zijn.

Niet gepusht. Controleer git status voordat je verdergaat.

## Validatie

Desktop en 360px visueel gecontroleerd, inclusief uitlijning en verwijderde witte onderlaag van de dagopdracht. Typecheck slaagt. De volledige suite telt 448 tests; de test 'een latere stap verklapt nooit de uitkomst van een eerdere' voor gegenereerde redactiesommen faalt soms bij willekeurige input. Dat is tijdens meerdere runs waargenomen, ook vóór deze To Do-correctie. Niet in deze commit aangepast: de schoolinhoud blijft ongewijzigd. Controleer deze instabiliteit apart.
