# Achtergronden voor de drie locaties

De nieuwe wereldkaart van Codex heeft drie locatieachtergronden, met daarop
personages die niet van ons zijn: Milo in de bakkerij, Novi in de kas en Felix
in de werkplaats. Die moeten vervangen worden door onze eigen personages:

| Locatie | Bestand | Nu | Wordt |
|---|---|---|---|
| Bakkerij | `public/dreamworld/locations/milo-bakery.png` | Milo, jongen met donker haar | **Coco** |
| Plantenkas | `public/dreamworld/locations/novi-greenhouse.png` | Novi | **Kiki** |
| Rekeneiland | `public/dreamworld/locations/felix-workshop.png` | Felix de Uitvinder | **Baby Lua** |

Seb hoort bij topografie en heeft hier geen locatie; dat eiland zit niet in
deze drie.

## Wat er klopt moet blijven

De bestaande tekeningen zijn 1672 × 941 (16:9). De compositie is bewust zo:
het personage leunt links in beeld, en rechts blijft een groot leeg vlak over
waar de app de activiteitenknoppen overheen legt. **Houd die lege rechterkant**,
anders vallen de knoppen over het personage heen.

Verder: warme 3D-prentenboekstijl, zacht avondlicht, veel groen, geen tekst of
letters in de tekening.

## Hoe de personages eruitzien

Niet uit `public/images/avatars/` halen voor Coco en Kiki — daar staat een
oude, blonde Kiki die niet meer klopt. Gebruik deze:

- **Coco** — `public/assets/library/cooking/coco-chef-tip.webp` (met koksmuts
  en schort) of `public/games/treehouse/world-v2/coco-cutout.webp`.
  Lang golvend bruin haar, zwart topje, lichte spijkerbroek.
- **Kiki** — `public/games/treehouse/world-v2/kiki-cutout.webp`.
  Lang golvend bruin haar, bordeauxrood joggingpak, witte gympen.
- **Baby Lua** — `public/images/avatars/luiaard.webp`. Een klein luiaardje met
  bruin-crème vacht en grote oranjebruine ogen.

## De opdrachten

Elke tekening maak je door de bestaande achtergrond én het personage als
referentie mee te geven, en alleen het kind te vervangen. Zo blijven de stijl,
het licht en de lege rechterkant hetzelfde.

### Bakkerij — Coco

> Houd de bakkerij van afbeelding 1 precies zoals hij is: dezelfde warme 3D-
> prentenboekstijl, dezelfde houten toonbank, groene lambrisering, planken met
> brood en glazen potten, het boogvenster met bergen, de koperen hanglamp, de
> planten, de cupcakes onder de glazen stolp, hetzelfde licht en dezelfde
> kleuren, en dezelfde brede compositie met het grote lege toonbankvlak rechts.
> Verander alleen het kind links: vervang de donkerharige bakkersjongen door het
> meisje van afbeelding 2. Zij heeft lang golvend bruin haar, een zachte witte
> koksmuts, een crèmekleurig schort over een zwart topje, warmbruine ogen en
> sproeten. Ze leunt in precies dezelfde houding op de toonbank, kin op haar
> hand, vrolijk lachend. Zelfde leeftijd, zelfde formaat en zelfde verhoudingen
> als het oorspronkelijke kind. Geen tekst, geen letters, geen logo.

### Plantenkas — Kiki

> Houd de kas van afbeelding 1 precies zoals hij is: dezelfde stijl, planten,
> potten, werkbank, licht en kleuren, en dezelfde brede compositie met het lege
> vlak rechts. Verander alleen het kind: vervang het door het meisje van
> afbeelding 2. Zij heeft lang golvend bruin haar, een bordeauxrood joggingpak
> en witte gympen. Zelfde houding, zelfde leeftijd, zelfde formaat en zelfde
> verhoudingen als het oorspronkelijke kind. Geen tekst, geen letters, geen logo.

### Rekeneiland — Baby Lua

> Houd de werkplaats van afbeelding 1 precies zoals hij is: dezelfde stijl, het
> meubilair, het licht en de kleuren, en dezelfde brede compositie met het lege
> vlak rechts. Haal het kind weg en zet op dezelfde plek het luiaardje van
> afbeelding 2: een klein, pluizig luiaardje met bruin-crème vacht en grote
> oranjebruine ogen, dat over de werkbank leunt en vriendelijk kijkt. Ongeveer
> even groot als het kind dat er stond. Geen tekst, geen letters, geen logo.

## Daarna

Zet de nieuwe tekeningen als **WebP** in `public/dreamworld/locations/` onder
dezelfde namen (met `.webp` in plaats van `.png`) en werk de paden bij in
`platform/worldLocations.ts`. De huidige PNG's zijn 2,3 tot 2,5 MB per stuk;
als WebP gaat dat naar ongeveer een tiende. Zie `docs/cooking-engine.md` voor
waarom alles in deze app WebP is.
