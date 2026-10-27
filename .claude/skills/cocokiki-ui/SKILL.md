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

## 3. De opbouw van een scherm

Het spreekuur (`pages/PlantClinicScreen.tsx`) en de encyclopedie
(`pages/EncyclopediaScreen.tsx`) zijn de twee voorbeelden om na te doen:

```
rustige achtergrond (--color-background)
└── één witte kaart, max ~480–620px breed
    ├── kop: klein label in kapitalen + één titel
    ├── voortgang: streepjes of stipjes, geen "stap 2 van 3"
    ├── het ding zelf: groot plaatje, raakbaar
    ├── één stem: Kiki in een tekstballon, die de vraag stelt
    └── de keuze: een rij chips of een raster van maximaal 4 kaartjes
```

Harde regels:

- **Eén kaart, niet drie blokken.** Losse tekstvakken naast elkaar maken het
  rommelig.
- **Eén stem per scherm.** De uitleg komt van het personage, niet van een kopje
  erboven dat hetzelfde zegt.
- **Iconen in plaats van tekst** op een actie, zodra het icoon duidelijk is.
  Houd het label in `aria-label`.
- **Alle uitleg in een `Dialog`**, niet in een `<details>` in het overzicht.
  Een overzicht blijft een overzicht.
- Raakvlak minstens `--touch-target` (44px).
- Werkt op 360px breed. Test dat.
- Elke animatie heeft een `@media (prefers-reduced-motion: reduce)`-uitzondering.

## 4. De personages

- **Kiki** hoort bij de planten. De plaatjes met bruine krullen
  (`avatars/kiki/kiki-*`) zijn de goede.
- **Coco** hoort bij het koken.
- Verwissel ze nooit, ook niet "even" voor een tip.

## 5. Per spel mag de dynamiek verschillen, de vorm niet

Verschillend mag: hoe je speelt, welke beweging erbij hoort, welke
achtergrond, hoe je scoort.

Hetzelfde moet: tokens, de knoppen uit het design system, de opbouw van
hierboven, het topmenu (`AppShell`), de munten, de taal, en waar overkoepelende
dingen staan (de encyclopedie zit in het topmenu, niet in een kamer).

## 6. Taal

Nederlands, tegen een kind van negen. Korte zinnen, geen schoolse termen.
Variabelen en commentaar in de code ook Nederlands, zoals in de rest van de
repo. Commentaar legt uit *waarom*, niet wat de regel al zegt.

## 7. Voor je klaar bent

1. `npm test` — alles groen (de tests zijn ook de plek waar botsingen met de
   andere agent opvallen).
2. `npx tsc --noEmit`.
3. Na elke CSS-wijziging: tel de accolades. Eén zwerf-`}` sloopt het hele
   bestand en geen enkele test ziet dat.
4. Kijk er in de browser naar op 360px en op desktop.
5. Commit en push alleen als Charlotte erom vraagt.

## 8. Wat nu nog niet klopt

`docs/ui-consistentie.md` houdt bij welke oude stukken nog niet aan dit
bestand voldoen, en in welke volgorde ze opgeruimd worden. Bouw niets nieuws
in de oude stijl erbij.
