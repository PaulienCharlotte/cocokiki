---
name: cocokiki-ui
description: De vormtaal van CocoKiki — tokens, design-system-componenten, schermopbouw en de regels per speltype. Gebruik dit vóór het bouwen of verbouwen van een scherm, een spel of een dialoog in deze repo, en bij elke vraag of iets "er consistent uitziet".
---

# De vormtaal van CocoKiki

CocoKiki is één wereld met meerdere spellen. De spellen mogen anders
*werken*, maar ze moeten er familie uitzien. Dit bestand is de bron van
waarheid daarvoor. Lees het voordat je CSS of een scherm schrijft.

De doelgroep is een kind van ongeveer negen. Dat betekent: grote raakvlakken,
weinig tekst tegelijk, één vraag per keer, en iets om naar te kijken.

## 1. Gebruik nooit een eigen kleur, maat of ronding

Alles staat in `design-system/tokens.css`. Schrijf `var(--…)`, nooit een hex,
px-ronding of px-lettergrootte.

| Waarvoor | Token |
|---|---|
| Paginavlak | `--color-background` |
| Kaart of paneel | `--color-surface` + `--shadow-soft` |
| Rustig vlak in een kaart (chip, tegel, tekstballon) | `--color-background-soft` |
| Groene actie, actieve staat | `--color-primary` / `--color-on-primary` |
| Goed gedaan | `--color-success-soft` + `--color-primary` als tekst |
| Fout gegaan | `--color-peach` (achtergrond) of `--color-error` |
| Beloning, munten | `--color-reward` / `--color-reward-strong` |
| Gewone tekst | `--color-text` |
| Bijtekst, labels, eenheden | `--color-text-muted` (of `--color-text-soft`, dezelfde) |
| Lijn | `--color-border`, nadrukkelijk `--color-border-strong` |
| Ronding: knop/chip | `--radius-control`, pil `--radius-pill` |
| Ronding: kaart | `--radius-card`, dialoog `--radius-dialog` |
| Ruimte | `--space-1` … `--space-12`, nooit losse px |
| Lettergrootte | `--font-size-xs` … `--font-size-2xl` |
| Beweging | `--motion-fast` / `--motion-default` + `--ease-storybook` |

Alleen een transparante schaduwkleur mag hard in de CSS staan
(`0 6px 16px #3b241a1f`), omdat daar geen token voor is. Verzin er geen nieuwe
token bij zonder dat Charlotte dat vraagt.

## 2. Bouw knoppen nooit zelf

Importeer uit `design-system`:

```tsx
import { Button, Dialog, IconButton, Surface } from '../design-system';
```

- `Button` — varianten `primary | secondary | quiet | danger | reward`,
  maten `small | medium | large`, plus `pill` en `fullWidth`.
  **Eén `primary` per scherm.** De rest is `quiet` of `secondary`.
- `IconButton` — een knop zonder woorden. Altijd een `label` meegeven; dat is
  wat een voorleesprogramma zegt.
- `Dialog` — alles wat over het scherm heen komt. Zorgt zelf voor de
  focusval, Escape en het portaal. Bouw geen eigen overlay.
- `Surface` — een kaart in een pagina.

Een eigen `<button>` mag alleen als het geen knop-met-tekst is: een raakvlak
op een plaatje, een tegel in een raster, een sleepbaar voorwerp. Geef die dan
een eigen klasse en gebruik gewoon de tokens.

Zie `/design-system` in de app voor alles naast elkaar.

Naast het design system staan er twee gedeelde vormen in `components/ui`.
Die zijn niet optioneel: ze zijn de reden dat de spellen familie blijven.

```tsx
import CardGrid from '../ui/CardGrid';
import ChoiceList from '../ui/ChoiceList';
import SpeechBubble from '../ui/SpeechBubble';
```

- `SpeechBubble` — de spraakwolk. Hierin praat de app.
- `ChoiceList` — de meerkeuzelijst. Hierin kies je een antwoord.
- `CardGrid` — het keuzeraster. Hiermee kies je waar je heen gaat.

## 3. Hoe een vraag eruitziet

Elke meerkeuzevraag in de app heeft dezelfde twee onderdelen, in deze
volgorde, en niets ertussen:

```
<SpeechBubble character="kiki" label="vraag van de dag">   ← wie vraagt het
<ChoiceList choices={…} />                                 ← de antwoorden
```

**De spraakwolk.** Het personage staat links, de wolk ernaast met een puntje
naar hem toe. Op de naamregel staat in kapitalen waar het over gaat
(`label`), en rechts mag één kort getal staan (`aside`, bijvoorbeeld een
stand). Het personage *is* de kop: zet er nooit een titel boven die hetzelfde
zegt. Eén wolk per scherm. Hoort er een ander personage bij een ander stuk,
dan is dat een ander scherm.

**De antwoorden.** Eén blok met `--color-background-soft`, haarlijnen tussen
de regels, geen rand of schaduw om de losse antwoorden. Het moet lezen als
één keuze, niet als drie knoppen. Dus: geen `Button` voor antwoorden, geen
pillen naast elkaar, geen raster van kaartjes.

- Twee tot vier antwoorden. Meer kan een kind niet overzien.
- **Getallen zijn de uitzondering.** Vier losse cijfers lezen slecht onder
  elkaar; die staan naast elkaar als tegels (`.math-answers`), groot genoeg om
  te raken. Woorden en zinnen blijven een `ChoiceList`.
- Een icoon vóór het antwoord (`icoon`) is beter dan een woord erbij.
  Zegt het plaatje het al, laat de uitleg dan weg.
- Na het kiezen kleurt de regel zelf: goed is `--color-success-soft`, mis is
  `--color-error-soft`, met een vinkje of kruisje rechts. Geen extra
  uitslagregel eronder die hetzelfde nog eens zegt.
- Hoort er een weetje bij, dan komt dat ná het kiezen als één rustige regel
  (`--color-text-soft`, `--font-size-sm`). Eén zin, geen alinea.
- Gekozen is klaar: `disabled`, niet opnieuw proberen in dezelfde vraag.

Wil je iets wat hier niet in past, dan is het antwoord niet een nieuw paneel
maar een `Dialog`, of een stap minder.

## 4. Hoe een keuzescherm eruitziet

"Welk spel?", "welk werelddeel?", "welk niveau?" is geen vraag met een goed
antwoord, dus geen `ChoiceList`. Het is een raster van kaarten: `CardGrid`.

```tsx
<CardGrid label="Kies een rekenspel" cards={…} onChoose={…} />
```

Eén vorm voor alle menu's in de app, zodat het rekenmenu en het vlaggenmemory
familie blijven:

- **Schone witte kaarten.** `--color-surface`, `--radius-card`, één
  `--shadow-soft`. Geen rand *en* een schaduw; geen eigen achtergrondkleur
  per spel of per onderdeel.
- **Lucht.** `--space-5` tussen de kaarten, `--space-4` erbinnen. Liever vier
  kaarten met ruimte dan zes die tegen elkaar aan staan.
- **Het plaatje is de kop.** De tekening vult het bovenvlak op een rustig
  `--color-background-soft`. Is er geen tekening, dan een icoon in een klein
  vierkantje — niet een leeg groot vlak.
- **Hoogstens drie regels tekst:** een titel, eventueel één korte regel
  eronder (`onder`), en één kort ding rechtsonder (`meta`, bijvoorbeeld
  "2/5 niveaus"). Geen knop ín de kaart: de kaart zelf is de knop.
- Drie kolommen breed, twee op een tablet, één op een telefoon. Kaarten
  zonder tekening blijven op een telefoon met twee naast elkaar staan.

## 5. Minder is de regel, niet de smaak

Charlotte's voorkeur, en de maat waaraan een scherm wordt afgemeten:

- **Schoon en simpel.** Twee elementen op een kaart is beter dan vijf. Kun je
  iets weghalen zonder dat de vraag onduidelijk wordt, haal het weg.
- **Iconen waar het kan, tekst waar het moet.** Een icoon met `aria-label`
  boven een woord; een plaatje boven een uitleg.
- **Niet zwaar.** Geen zware randen, geen dubbele schaduwen, geen kaders om
  dingen die al in een kaart staan. Vlakken scheiden met een haarlijn of met
  rust, niet met een lijstje lijnen.
- **Eén ding tegelijk.** Eén vraag, één stem, één primaire actie.

## 6. De opbouw van een scherm

Het spreekuur (`pages/PlantClinicScreen.tsx`) en de encyclopedie
(`pages/EncyclopediaScreen.tsx`) zijn de twee voorbeelden om na te doen:

```
rustige achtergrond (--color-background)
└── één witte kaart, max ~480–620px breed
    ├── kop: klein label in kapitalen + één titel
    ├── voortgang: streepjes of stipjes, geen "stap 2 van 3"
    ├── het ding zelf: groot plaatje, raakbaar
    ├── één stem: `SpeechBubble`, die de vraag stelt
    └── de keuze: `ChoiceList` (zie sectie 3)
```

**Een spel staat op zijn eigen achtergrond.** De tekening van de plek vult
het scherm. Nooit een wit vel over het hele venster: dan is de achtergrond weg.

Daarboven zijn er twee vormen, en je kiest er één per spel:

- **Een flashcard** als er iets te lezen valt — een verhaal, een bestelling,
  een vraag in woorden. Eén witte kaart: `--color-surface`, `--radius-card`,
  `--shadow-raised`, maximaal ~720px breed.
- **Een toneel** als het plaatje de vraag al stelt, zoals de honingpotten of
  de lopende band. Dan ligt er geen kaart overheen en zie je het spel zelf.
  Losse dingen die erop liggen (streepjes, een som, een knop) krijgen een
  rustig vlakje van `--color-surface-glass`, geen eigen kleur.

Op een toneel staat **geen vaste uitleg**. Lua's spraakwolk komt pas als je op
de tipknop drukt, en zegt het dan in één keer goed. In de rekenspellen regelt
`.math-session.is-toneel` dat.

Ook op een toneel **zweeft niets los**. Alles wat niet bij het spel zelf hoort
staat in hoogstens twee rustige vlakken van `--color-surface-glass`: wat je
moet weten bovenaan, wat je moet kiezen onderaan. Daartussen zie je de potten,
de band of het mandje. Losse chips over de hele foto verspreid lezen als rommel,
ook als ze elk op zich netjes zijn.

**De uitgang staat in elk spel op dezelfde plek.** Links in de balk boven het
spel, als rond icoon van `--touch-target` groot, met de bestemming in
`aria-label` en `title`. Daarnaast de instellingen, rechts het geluid: drie
dingen op één lijn, even hoog, in elk spel dezelfde volgorde. Een knop die per
scherm verspringt moet je elke keer opnieuw zoeken.

**Moeilijkheid is een schuifbalk, geen slot.** Een kind dat al verder is hoeft
zich niet eerst door niveau 1 te werken. De balk staat in de balk boven het
spel; wat je op dat niveau oefent staat in `aria-valuetext`, niet op het
scherm. Zie `games/math/MathControls.tsx`.

Harde regels:

- **Eén kaart, niet drie blokken.** Losse tekstvakken naast elkaar maken het
  rommelig.
- **Eén stem per scherm.** De uitleg komt van het personage, niet van een kopje
  erboven dat hetzelfde zegt.
- **Iconen in plaats van tekst** op een actie, zodra het icoon duidelijk is.
  Houd het label in `aria-label`. Is het icoon níét duidelijk — "naar voren" en
  "naar achteren" zijn twee bijna gelijke vierkantjes — dan zet je het woord er
  gewoon bij. Een icoon dat je moet uitproberen is geen icoon.
- **Alle uitleg in een `Dialog`**, niet in een `<details>` in het overzicht.
  Een overzicht blijft een overzicht.
- Raakvlak minstens `--touch-target` (44px).
- Werkt op 360px breed. Test dat.
- Elke animatie heeft een `@media (prefers-reduced-motion: reduce)`-uitzondering.

## 7. De personages

`data/characters.ts` is de lijst: naam, plaatje en gebied. Kies een
personage met zijn id (`kiki | coco | lua | seb`), nooit met een pad naar een
plaatje. Zo kan een scherm ze niet verwisselen.

- **Kiki** hoort bij de planten (de plaatjes met bruine krullen).
- **Coco** hoort bij het koken.
- **Baby Lua** hoort bij het rekenen.
- **Seb het stokstaartje** hoort bij de topografie.

Verwissel ze nooit, ook niet "even" voor een tip. Een vraag over eten is van
Coco, ook als hij in het plantenboek staat.

## 8. Per spel mag de dynamiek verschillen, de vorm niet

Verschillend mag: hoe je speelt, welke beweging erbij hoort, welke
achtergrond, hoe je scoort.

Hetzelfde moet: tokens, de knoppen uit het design system, de opbouw van
hierboven, het topmenu (`AppShell`), de munten, de taal, en waar overkoepelende
dingen staan (de encyclopedie zit in het topmenu, niet in een kamer).

## 9. Taal

Nederlands, tegen een kind van negen. Korte zinnen, geen schoolse termen.
Variabelen en commentaar in de code ook Nederlands, zoals in de rest van de
repo. Commentaar legt uit *waarom*, niet wat de regel al zegt.

## 10. Voor je klaar bent

1. `npm test` — alles groen (de tests zijn ook de plek waar botsingen met de
   andere agent opvallen).
2. `npx tsc --noEmit`.
3. Na elke CSS-wijziging: tel de accolades. Eén zwerf-`}` sloopt het hele
   bestand en geen enkele test ziet dat.
4. Kijk er in de browser naar op 360px en op desktop.
5. Commit en push alleen als Charlotte erom vraagt.

## 11. Wat nu nog niet klopt

`docs/ui-consistentie.md` houdt bij welke oude stukken nog niet aan dit
bestand voldoen, en in welke volgorde ze opgeruimd worden. Bouw niets nieuws
in de oude stijl erbij.
