# CocoKiki Rekenavonturen

Route: `/school/math`, bereikbaar vanuit School. De bestaande spel-ID's en
`cocokiki:math-progress:v1` blijven hetzelfde. Er wordt geen voortgang of geld gewist.

## Architectuur

- `MathModule`: selectie, niveau, gedeeld walletsaldo, geluid en resultaat.
- `MathControls`: een compacte zwevende navigatie, niveauselectie en bestaande
  toegankelijke resultaatdialoog. Deze route gebruikt geen tweede AppShell-HUD.
- `MathSession`: tien opdrachten, kleine sterren, herkansingen en automatische
  overgang na 650 ms. Geen Volgende- of Controleer-knop. Acht meteen goede
  antwoorden ontgrendelen het volgende niveau. Een fout wist nooit oude voortgang.
- `flashcard.css`: een enkele ondoorzichtige witte opdrachtkaart met ronde
  hoeken en vaste visuele volgorde: voortgang, opdracht, spelobjecten, antwoorden
  en feedback/hint. De achtergrond is gedimd/vervaagd. Geen losse tekstpanelen
  of geneste taak-kaarten. Lange opdrachten mogen verticaal meegroeien; de
  navigatie blijft buiten de kaart. Lua is alleen bereikbaar via Tafels oefenen
  en gebruikt het eigen schermvullende Phaser-speelveld zonder witte buitenkaart.
- `engine`: bestaande expressiebomen, evaluatie, omgekeerde bewerkingen,
  getalgrenzen en unieke keuzemogelijkheden; aangepaste honing- en winkelvragen.
- `DragChoice`: pointer capture voor muis/touch, annuleren, verloren capture,
  en een native button als tik-/toetsenbordalternatief.
- `assets`: centrale mapping van bestaande werelden en aangeleverde illustraties.
- `AdventureScenes`: wintervoorraad, kleine beloningsillustraties, bakplaat
  en honingpotten. Dynamische aantallen en tekst blijven React-content.
- `useMathSound`: optioneel geluid, standaard uit, met de bestaande Lua-audio;
  voorkeur via een document in de bestaande lokale opslag.

## Spellen

### Bosavontuur: redactiesommen

De zichtbare spelkeuzes Bessenplukkers en Wintervoorraad zijn samengevoegd als
Het Bosavontuur. De bestaande add-subtract-ID, voortgang en beloningsbewijzen
blijven behouden. De oude divide-voortgang blijft bewaard maar is geen tweede
spelkeuze meer. De onderstaande oude telmodellen blijven alleen beschikbaar
als interne compatibiliteitscomponenten, niet als het nieuwe bosavontuur.

Vijf niveaus voor circa 9-12 jaar: twee stappen, voorraad en eerlijk verdelen,
breuken, percentages en gecombineerde bewerkingen. Elke ronde heeft tien unieke
verhalen. De vraag toont geen kant-en-klare som vooraf: kinderen bepalen zelf
de bewerkingen. Na een juist antwoord verschijnt de berekening; hints geven
een aanpak. Bestaande bessen-, mand-, boomholte- en eekhoornillustraties worden
als rustige scene gebruikt, niet als letterlijk te tellen antwoord.

### Red Baby Lua!

De bestaande `games/red-baby-lua/RedBabyLuaGame` en Phaser-scene worden lazy geladen.
Geen tweede Lua-implementatie. Via een optionele `mathAdventure`-koppeling gebruikt
de game de vijf tafelgroepen, tien vragen, vallende stenen, drie levens, bestaande
poses en reddingsanimaties. Vroegtijdig verlies slaagt niet voor het niveau.
Succesreacties gaan na 750 ms automatisch door. `luaBridge` koppelt de bestaande
vraaggenerator en resultaten aan de math-voortgang. In deze modus zijn per-vraag
Lua-uitbetalingen uitgeschakeld: alleen de normale math-niveaubeloning geldt.
De zelfstandige route behoudt de bestaande modi, voorkeuren en muntbeloningen.
Dit is de enige ingang vanuit School; de dubbele Lua-kaart bij Rekenen is
verwijderd. De bestaande multiply-voortgang en de optionele adapter blijven
bewaard, maar die adapter is niet langer een tweede zichtbare spelkeuze.
Een fout in factor-afleiders bij factor 1 is hersteld: er staat precies een
wiskundig juiste som tussen de drie keuzen.
Elke moeilijkheid wisselt nu keer- en deelsommen af, naast de bestaande
aanvul-/vergelijkvragen. Een deelsom gebruikt het product en de gekozen tafel
als deeltal en deler, met een positief geheel antwoord zonder rest. De tafel,
modi, retry-vragen, levens en beloningsberekening blijven behouden.

### De Bessenplukkers

Elke bes heeft een eigen ID en locatie: oogst of mandje. Bessen kunnen direct
worden gesleept, of geselecteerd en met een tik/Enter op een mandje geplaatst.
Ook geplaatste bessen kunnen worden verplaatst of teruggelegd; undo is beschikbaar.
Pas wanneer alle bessen geplaatst zijn, wordt automatisch gecontroleerd op exact
gelijke aantallen. Een onjuiste verdeling blijft bewerkbaar. De eerste vraag toont
een tijdelijk handgebaar; bij reduced motion wordt dat niet geanimeerd.

Alle vragen gebruiken nu de visuele verdeling. Niveau 1 gebruikt twee mandjes
en vijf mogelijke positieve deelsommen, zonder herhaling binnen elke cyclus.
De bestaande hogere bereiken blijven behouden: de latere niveaus wisselen kleine
oogsten tot 24 af met grotere tot 100/144, met delers tot en met 12. De voorraad
toont steeds maximaal 18 individuele bessen en vult zichzelf aan uit de overige
oogst. Elk geplaatst item behoudt zijn eigen ID en blijft herverdeelbaar. Mandjes
en inhoud schalen in een responsive grid; bij veel mandjes kan de pagina verticaal
scrollen. Daar blijft tikken/selecteren plus scrollen en plaatsen beschikbaar.
Er is geen voorwerp dat meerdere versleepbare bessen voorstelt.

### Wintervoorraad

Dezelfde plus/min-generator en grenzen: 10, 20, 100, grensoverschrijdingen en 1000.
Eikels in de holte, vondst/vogel, voorraadmand en succesanimatie ondersteunen de som.
De kleine illustratieve voorraad is een beloning, geen telmodel van de som.
Geen vermenigvuldigingsbadges of tweede reeks aantallen; de opdracht en som
dragen de rekeninformatie. De voorraadmand groeit per afgeronde opdracht.

### Koekjeschaos

De bestaande ontbrekende-getalvragen voor plus, min, keer, delen en gemengd.
Een getaltegel kiezen of op de bakplaat slepen is meteen het antwoord. De
bakplaat toont een vraagteken en na succes een kleine gebakken beloning, niet
het aantal uit de som. De som blijft leidend bij elke positie van het lege vak.
Na succes licht de oven op; een fout geeft een
korte meelwolk en laat opnieuw proberen toe.

### De Honingfabriek

Geen vergelijking van een kaal getal met hetzelfde zichtbare antwoord meer.
Beide zijden zijn expressies; rechts moet een ontbrekende hoeveelheid worden
berekend. Het bekende getal rechts en de oplossing komen niet voor als zichtbaar
getal links: overschrijven van een term is uitgesloten. Niveau 1-2: plus-relaties; 3: plus/min; 4: keer/delen;
5: gemengde expressies. Elk vak heeft precies een geldige oplossing. De
vulmeter naast elke aangeleverde honingpot komt uit dezelfde exacte evaluator
als de antwoordcontrole; de animatie is geen bron voor het valideren. De PNG-pot
zelf heeft een vaste afgebeelde vulling en wordt niet vervormd of opnieuw
gegenereerd. Tikken of slepen valideert direct.

### Winkelgekte

Zestig seconden vanaf Open de winkel, met een echte deadline. Geen pauze,
confirmatie, bonuspunten of wachttijd tussen goede antwoorden. Elke goede som
is een klant en precies een punt. Nieuwe vragen worden on-demand gegenereerd,
zonder vaste deck-lengte of maximumscore. Fouten trekken geen punten af en
laten meteen opnieuw proberen toe. Achtergrond/throttling verlengt de ronde niet.
Producten wisselen per bestelling. Niveau 1: plus/min; 2: keer; 3: delen;
4: gemengd; 5: twee prijzen of wisselgeld. De winkel toont aantallen/prijzen
naast bestaande productassets, niet ingebakken in de afbeeldingen. Bij keer staat
er een product met aantal en prijs per stuk. Bij delen staan geld en klanten;
bij wisselgeld een betaald bedrag en de prijs van de boodschappen. Geld en
klanten worden met passende Lucide-symbolen getoond, niet als andere fruitsoort.
`checkoutCatalog` gebruikt echte afbeeldingen en productgegevens uit de bestaande
voedings- en meubelwinkel, met afzonderlijke afgeronde euro-oefenprijzen. Appel
en banaan kosten bijvoorbeeld EUR 1, een bakje bessen EUR 3, kaas EUR 4 en
olijfolie EUR 8. Meubels (vanaf niveau 4) lopen van een poef van EUR 75 tot een
hoekbank van EUR 900. Dit zijn geen live marktprijzen en ze veranderen geen
CocoCoin-prijzen. Dezelfde productprijs voedt afbeelding, etiket, prompt en som.
Bij delen wordt de volledige productrekening verdeeld over klanten; bij min
staat het gekozen product tegenover het betaalde bedrag. Verpakkingen zoals
bakjes bessen en flessen olie worden expliciet benoemd.

## Opslag en economie

De bestaande wallet in `services/localState` verzorgt alle transacties. De vier
niet-race-avonturen plus Lua houden de oude niveaubeloningen: 5 voor de eerste
geslaagde voltooiing, 3 voor de eerste foutloze voltooiing (ook later nog mogelijk),
10 eenmalig voor alle vijf niveaus. Vaste transactie-ID's voorkomen replay-uitbetaling.

Winkelgekte gebruikt voortaan 1 munt per klant, maximaal 50 per lokale kalenderdag.
`RACE_DAILY_COIN_CAP` in `config.ts` is de instelbare grens. Dit is de enige
winkelrace-uitbetaling; er komen niet ook nog de vroegere niveaubonussen bij.
De puntenscore is onbeperkt, ook nadat de muntlimiet is bereikt.

Elke ronde krijgt een UUID. `cocokiki:math-race-earnings:v1` bewaart per dag het
uitbetaalde aantal en per ronde een resultaatvingerafdruk. Herhaalde settlement
van dezelfde ronde betaalt niet opnieuw, ook niet de volgende dag. Een gewijzigde
uitslag met dezelfde ID wordt geweigerd. Resultaat, dagtotaal, receipt en coins
worden met een enkele bestaande wallet-write opgeslagen. Bij opslagfouten is
er geen gedeeltelijke betaling; de dialoog biedt opnieuw opslaan.

Oude race-comboscores blijven leesbaar en bestaande ontgrendelingen/beloningen
blijven staan. Er wordt geen geld achteraf opnieuw toegekend. Nieuwe rondes
gebruiken precies een punt per goed antwoord.

Beperkingen van deze lokale applicatie blijven bestaan: een actieve ronde wordt
niet tussentijds hervat na verversen; clientklok/opslag kunnen lokaal gewijzigd
worden en gelijktijdige writes uit verschillende tabs zijn niet server-geserialiseerd.
De daglimiet is een spelregel, geen fraudebestendige bankadministratie.

## Assets en ontbrekende illustraties

Gebruikt: bestaande jungle, terras als tuin, keuken, winkel, bakplaat, oven,
Coco-kok en producten. De negen losse aangeleverde PNG's staan onder
`public/games/school/math/adventures`. De samengestelde aardbeienmand met
zichtbaar dambord wordt bewust niet gebruikt: de individuele bessen vullen
de lege mand daadwerkelijk.

De zeven aanvullende illustraties zijn aangeleverd en aangesloten: eekhoorn,
eikel, boomholte, vogel, bij, honingpot en los koekje. De tijdelijke Lucide-
silhouetten en CSS-illustraties zijn vervangen. Alle afbeeldingen behouden hun
beeldverhouding. Er zijn geen ontbrekende spelillustraties meer.

De boomholte had een ingebakken dambord zonder alpha. Na expliciete toestemming
is alleen die achtergrond lokaal uitgeknipt, zonder AI en zonder RGB-kleuren te
wijzigen. De originele PNG blijft als `tree-hollow-original.png` bewaard;
`tree-hollow.png` bevat echte transparantie, ook in openingen tussen bladeren.
De poging via de beeldbewerkingstool werd door een gebruikslimiet geweigerd en
heeft geen nieuwe illustratie opgeleverd. Er is geen nieuwe dependency toegevoegd.

## Verificatie

Automatische tests controleren alle dertig moeilijkheden, exacte en unieke
oplossingen, antwoordopties, tafelgroepen, woordgrenzen, opslagmigratie,
herhaalde beloningen, daggrenzen, 0-score, meer dan 100 racepunten,
opslagfouten/herstel, alle vijf Lua-tafelgroepen en gewogen hoeveelheden.

Browsercontrole gebruikt uitsluitend eigen localhost-testopslag, niet de
gebruikersvoortgang op 127.0.0.1. Voltooide runs: Bessenplukkers (inclusief
ongelijke verdeling, direct slepen en herverdelen), Wintervoorraad niveau 3,
Koekjeschaos niveau 2, Honingfabriek niveau 2 na een fout, niveaus 3/4 en Lua 2/3.
Een echte winkelminuut haalde 63 punten en betaalde exact 50 munten uit.
Voltooiingen, ontgrendelingen en het gedeelde saldo zijn in de UI gecontroleerd.
Alle zes schermen zijn op 320px gecontroleerd zonder horizontale overflow of
ontbrekende afbeeldingen. Mobiele 375px- en desktop 1280px-composities zijn
visueel gecontroleerd, inclusief gemengde honingvragen op niveau 5. Enter
beantwoordt de vraag en behoudt toetsenbordfocus na de automatische overgang.
Terugnavigatie naar rekenen en School is getest; de browserconsole bleef zonder
waarschuwingen/fouten. Aanraakbediening is via Pointer Events gebouwd en op
mobiel formaat getest; fysieke touchscreenhardware is niet getest.
