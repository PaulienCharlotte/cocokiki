# Waar de vormtaal nog niet klopt

De regels staan in `.claude/skills/cocokiki-ui/SKILL.md`. Dit bestand is de
lijst met oude stukken die er nog niet aan voldoen, op volgorde van wat het
meest opvalt. Bouw niets nieuws in de oude stijl erbij.

Gemeten op 27 oktober 2026, bij commit `ff42872`.

## De cijfers

| Bestand | Regels | Harde hexkleuren |
|---|---|---|
| `pages/world.css` | 1551 | 483 |
| `components/cooking/foundation.css` | 90 | 30 |
| `design-system/components.css` | 210 | 20 |
| `components/treehouse/expansion.css` | 20 | 14 |

Daarnaast staan er 51 keer `border-radius: 8px` en ruim tien verschillende
px-rondingen door de CSS, waar vier tokens voor zijn.

## 1. Twee soorten knoppen naast elkaar

Er bestaat een `.cooking-button` (`pages/world.css:164`) die precies hetzelfde
probeert te zijn als `ck-button--primary`, maar met eigen maten. Het kookspel
gebruikt die, de rest gebruikt het design system. Daardoor zien de knoppen in
de keuken er anders uit dan die in het spreekuur.

**Doen:** `.cooking-button` vervangen door `<Button>` in
`components/cooking/*`, en de klasse daarna weghalen.

## 2. `pages/world.css` is één bestand van 1551 regels

Alles wat buiten het kookspel valt staat erin: de wereldkaart, de boomhut, de
winkel, de planten, het spreekuur en nu de encyclopedie. Het is ook de plek
waar de wijzigingen van twee agenten op elkaar botsen.

**Doen:** opsplitsen per gebied (`world.css`, `treehouse.css`, `shop.css`,
`plants.css`) zodra er een moment is waarop er niemand anders in zit.

## 3. 483 harde kleuren in `world.css`

De meeste zijn bruintinten voor de boomhut en groentinten voor de planten die
ook als token bestaan. Sommige wijken net een tikje af, en dat zie je als twee
schermen naast elkaar staan.

**Doen:** per gebied omzetten, niet in één keer. Begin bij de planten, want
dat deel wordt het meest bekeken.

## 4. Elf schermen bouwen hun eigen knoppen

`pages/ShopScreen.tsx` (13 eigen `<button>`s),
`components/treehouse/RoomInventoryDrawer.tsx` (13),
`components/shop/DecorShop.tsx` (11),
`components/cooking/CookingInteraction.tsx` (11), `components/Game.tsx` (11),
`components/MnemonicGame.tsx` (9), en nog een paar.

Niet allemaal fout: een raakvlak op een plaatje of een tegel in een raster is
geen knop-met-tekst. Maar waar er woorden op staan hoort een `Button`.

**Doen:** per bestand nalopen, beginnend bij de winkel, omdat een kind daar
geld uitgeeft en de knoppen er dus duidelijk moeten zijn.

## 5. Drie keer dezelfde vraag, drie keer anders

Sinds de vraag van de dag staan de spraakwolk en de meerkeuzelijst in
`components/ui` (`SpeechBubble`, `ChoiceList`). Drie plekken vragen nog iets
op hun eigen manier:

| Waar | Nu | Hoort te worden |
|---|---|---|
| `pages/PlantClinicScreen.tsx:281` | `.clinic__bubbel`, eigen wolk met eigen puntje | `SpeechBubble character="kiki"` |
| `pages/PlantClinicScreen.tsx:303` | `.clinic__kaarten`, raster van zes kaartjes | `ChoiceList` met `icoon` per oorzaak |
| `components/cooking/CookingInteraction.tsx:100` | `.cooking-choices`, losse knoppen | `ChoiceList` |
| `components/TipCoach.tsx` | doet het al goed (wrapper om `SpeechBubble`) | — |

Het spreekuur is de lastigste: het heeft er zes keuzes in een raster van twee
kolommen, en de wolk zit vast aan een knop (Kiki aantikken geeft een hint).
Dat kan met `ChoiceList` plus iconen, maar het is een eigen klus.

**Doen:** eerst het kookspel (`.cooking-choices`, de kleinste), dan het
spreekuur. Per gebied, niet alles tegelijk.

## 6. Twee Kiki's

`public/images/avatars/kiki.webp` is blond met een knot.
`public/images/avatars/kiki/kiki-*.png` heeft bruine krullen en een donkerrood
pak. De plantenwereld gebruikt de krullen, het topmenu de knot.

**Doen:** Charlotte kiest welke de echte is, dan gaat de ander eruit.

## 7. De menu's zijn nog niet allemaal hetzelfde

Het rekenmenu en het vlaggenmemory gebruiken nu `components/ui/CardGrid`:
witte kaarten, lucht ertussen, één zachte schaduw. De rest van de app kiest
nog op andere manieren.

| Scherm | Hoe het nu kiest |
|---|---|
| `pages/ShopScreen.tsx` | eigen productraster in `app.css`, met harde hexes |
| `pages/CookbookScreen.tsx` | eigen receptkaarten |
| `pages/EncyclopediaScreen.tsx` | eigen lijst met plantkaarten |
| `pages/ChallengesScreen.tsx` | losse plaatjes op een achtergrond (met opzet) |

**Doen:** per gebied, niet allemaal tegelijk. Eerst de winkel, dan het
kookboek. De school blijft een kamer met plaatjes; dat is geen menu.

Let op: `games/math/MathHub.tsx` is op dit moment niet te bereiken. Het
rekeneiland stuurt je rechtstreeks naar een spel, dus het menu staat er wel
maar niemand ziet het. Het is nu wel in de nieuwe vorm, klaar voor het moment
dat het terugkomt.

## 8. De rekenspellen delen nu wel de vorm, nog niet de sommen

Alle zes de rekenspellen staan nu op hun achtergrond met één witte flashcard,
en de moeilijkheid is overal dezelfde schuifbalk. Wat er nog niet is:

- De sommen komen uit één functie van ruim honderd regels
  (`games/math/engine.ts`, `generateQuestion`). Elk nieuw soort som is daar een
  if-tak bij. Zolang dat zo is durft niemand er veel aan toe te voegen.
- `games/math/math.css` heeft nog harde kleuren in de spelonderdelen zelf
  (de honingpotten, de koekjes, de boomholte). Alleen de schil is omgezet.
- De Winkelgekte heeft zijn eigen `checkout.css` met eigen hexes.

**Doen:** eerst de sommen uit elkaar trekken in losse soorten met een eigen
moeilijkheid, dan pas de rest van de CSS.

## 9. Honderd megabyte aan tekeningen

`public` was 152 MB, waarvan 102 MB in 57 PNG-bestanden van gemiddeld 1,8 MB.
Die zijn omgezet naar WebP: 11,7 MB, dezelfde tekeningen. De map is nu 62 MB.

**Doen:** nieuwe tekeningen altijd als WebP aanleveren. Een PNG van twee
megabyte laat een kind seconden naar een leeg scherm kijken.

## Al opgelost

- Een kamer in de boomhut werd alleen op een telefoon op volle breedte getoond
  met schuiven naar links en rechts; op een laptop zag je het midden van de
  tekening en voelde de kamer klein. Die regels staan nu buiten de media query,
  dus overal.
- Meubels konden tot 1,8 keer hun maat; de douchecabine stond daar al op. Dat
  maximum is 3 geworden.
- De tekeningen van Baby Lua en van de rotsen liepen over de rand van hun
  vakje in het sprite-vel. Daardoor stond er een streepje van de pose erboven
  boven Lua's hoofd. Die randen zijn weggehaald.
- Een fout antwoord bij Baby Lua kostte niets: je kon alle antwoorden afgaan
  tot de goede. Nu kost een fout een hartje.
- De redactiesommen toonden één stap tegelijk. Nu staan alle stappen in beeld,
  elk in een eigen vak; de volgende wacht met een vraagteken op jouw getal.
- Het honingspel had drie losse witte vakjes. De potten staan nu vrij boven,
  met daaronder één vlak met de som, de antwoorden en de voortgang.
- Een bes die net op de rand van een mandje landde kaatste terug: er werd
  gemikt met de vinger in plaats van met de bes, en de oogstbalk erboven won
  van het mandje. Allebei rechtgezet, met een marge van 96px.
- In de boomhut kon je al kiezen wat vooraan staat, maar de twee knoppen waren
  twee bijna identieke iconen van overlappende vierkantjes zonder woord erbij.
  Niemand vond ze. Ze heten nu "Voor" en "Achter" en staan apart in de balk.

- `--color-text-soft` werd zeventien keer gebruikt maar bestond niet, dus al
  die "zachte" teksten stonden op volle sterkte. Staat nu als alias van
  `--color-text-muted` in `design-system/tokens.css`.
- De encyclopedie stond met eigen bruine achtergrond en eigen 8px-rondingen in
  een kamer. Staat nu in het topmenu, met tokens.
- De vraag van de dag had eerst een eigen kop en eigen keuzeknoppen. Die zijn
  nu `SpeechBubble` en `ChoiceList`, en `components/tip-coach.css` is van zes
  regels naar één teruggebracht omdat de wolk daar nu ook vandaan komt.
- De rekenspellen hadden elk een eigen schil: het ene spel een wit vel over
  het hele venster, het andere losse tekstbalkjes op een foto. Nu is het overal
  de achtergrond van het spel met één witte flashcard erop. De vraag komt uit
  de spraakwolk van Baby Lua, net als Kiki in het spreekuur.
- Je moest je bij elk rekenspel door niveau 1 heen werken. Nu kies je met een
  schuifbalk hoe moeilijk je het wilt; de sterren onthouden wat je gehaald hebt.
- De Bessenplukkers had op niveau 1 vijf sommen (2÷2 tot 10÷2) en gaf die twee
  keer per ronde. Nu zijn het er twaalf, en boven de 24 vruchten kies je het
  antwoord in plaats van honderd bessen te slepen.
- De redactiesommen toonden een bes, een mandje met een vraagteken en een
  stappenbalk met puntjes. Dat is weg: het verhaal staat in de spraakwolk, en
  eronder staat één som met één invoervak. Wat je al uitgerekend hebt blijft
  als kleine kaartjes staan.
- Op het toneel zweefde daarna alles los over de achtergrond: streepjes, een
  tipknop, twee sommen en vier tegels, elk op hun eigen vlakje. Nu staan ze in
  twee vlakken, boven en onder, met het spel ertussen.
- De terugknop was alleen een pijl in de balk van de app, die op elk scherm
  hetzelfde is. Elk rekenspel heeft nu een eigen ronde knop, links in de balk
  boven het spel, op dezelfde plek en even groot als het geluidsknopje.
- De winkel had een doos in een doos: een balk met de klok, en daaronder nog
  een vlak met de vraag. Dat is één vlak geworden. En de vraag in woorden stond
  los van de som die hetzelfde zei; die twee staan nu samen in het vak bij de
  antwoorden, zodat boven de band alleen de tijd overblijft.
- De honingpotten en de lopende band verdwenen onder een witte kaart. Die twee
  zijn nu een toneel: je ziet het spel, en Lua legt pas uit als je om een tip
  vraagt. De andere vier spellen houden hun flashcard.
- Munten waren overal twee per opgave, hoe moeilijk de som ook was. Nu komt er
  per niveau één bij, en in de winkel nog één zodra je zoveel klanten hebt
  geholpen dat de band hard loopt. Dat rekent de app zelf uit uit het aantal
  goede antwoorden, zodat het spel er niets over hoeft te melden.
- De Winkelgekte duurde een vaste minuut en je koos vooraf een snelheid. Nu
  begint de band rustig en gaat hij bij elke klant een stukje sneller, tot er
  een klant van de band valt. Dan sluit de winkel.
- Het vlaggenmemory koos een werelddeel met zes paarse `secondary`-knoppen in
  een raster, en het rekenmenu had zes kaarten met een eigen pastelkleur, een
  rand én een schaduw, in harde hexes en px. Beide gebruiken nu `CardGrid`;
  de oude `.math-mode`- en `.flag-continents__grid`-regels zijn weg.
- De plaatjes van de personages stonden los in drie bestanden. Ze staan nu in
  `data/characters.ts`, met hun gebied erbij, en een test let erop dat Kiki
  bij de planten blijft.
