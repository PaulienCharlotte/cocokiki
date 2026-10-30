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

## Al opgelost

- `--color-text-soft` werd zeventien keer gebruikt maar bestond niet, dus al
  die "zachte" teksten stonden op volle sterkte. Staat nu als alias van
  `--color-text-muted` in `design-system/tokens.css`.
- De encyclopedie stond met eigen bruine achtergrond en eigen 8px-rondingen in
  een kamer. Staat nu in het topmenu, met tokens.
- De vraag van de dag had eerst een eigen kop en eigen keuzeknoppen. Die zijn
  nu `SpeechBubble` en `ChoiceList`, en `components/tip-coach.css` is van zes
  regels naar één teruggebracht omdat de wolk daar nu ook vandaan komt.
- De plaatjes van de personages stonden los in drie bestanden. Ze staan nu in
  `data/characters.ts`, met hun gebied erbij, en een test let erop dat Kiki
  bij de planten blijft.
