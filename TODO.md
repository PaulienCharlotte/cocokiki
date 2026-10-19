# CocoKiki backlog

Laatst bijgewerkt: 18 oktober 2026

De volgorde hieronder volgt de afhankelijkheden: eerst gedeelde structuur, daarna de visuele basis, vervolgens merkonderdelen en ten slotte het interactieve spelmaatje.

## 1. Navigatie

- [x] Vereenvoudig de header binnen spellen tot één homeknop.
  - De afzonderlijke knoppen `Boomhut` en `Spellen` zijn vervangen door één knop `Home`.
  - De knop keert terug naar de centrale boomhut-homepage (`/`).
  - Het merk links is niet langer een tweede, verborgen homeknop.
  - De knop heeft een toegankelijke naam en een aanraakvlak van minimaal 44 pixels.

## 2. Visuele basis en stijlgids

- [x] Bepaal de eerste gedeelde CocoKiki-interfacebasis.
  - Leg kleur, typografie, oppervlakken, witruimte, randen, schaduwen en beweging vast.
  - Houd rekening met desktop, tablet en mobiel.
  - Werk de regels en componentvoorbeelden bij in `docs/cocokiki-style-skill/SKILL.md`.

- [x] Moderniseer de actieve pop-ups, menuvensters en resultaatdialogen volgens de nieuwe stijl.
  - Gebruik een lichtere, rustigere uitstraling met consistente witruimte en uitlijning.
  - Controleer verticale en horizontale centrering op desktop, tablet en mobiel.
  - Maak knoppen, velden, focusstaten en afsluitacties overal consistent.
  - Controleer daarna Topo en Red Baby Lua op afwijkingen van de stijlgids.

## 3. Merk en spelidentiteit

- [ ] Ontwerp een nieuw overkoepelend CocoKiki-logo.
  - Maak per spel een herkenbaar sublogo dat duidelijk bij het hoofdmerk hoort.
  - Leg vaste regels vast voor kleur, vorm, typografie en gebruik van hoofd- en sublogo's.
  - Vervang de huidige tijdelijke kompasbranding pas nadat de complete set is goedgekeurd.

## 4. CocoCoins

- [ ] Geef CocoCoins een eigen visuele identiteit die aansluit op het definitieve merk.
  - Ontwerp een herkenbare munt die niet hetzelfde beeld gebruikt als het CocoKiki-logo.
  - Gebruik hetzelfde muntbeeld en dezelfde benaming in de header, spellen, beloningen en resultaten.
  - Behoud de bestaande gedeelde valuta en opgeslagen saldi.

## 5. Spelmaatje Kiki

- [ ] Ontwerp Kiki binnen de definitieve CocoKiki-stijl.
  - Bepaal uiterlijk, poses, toestanden en gedrag voordat de interface wordt gebouwd.
  - Leg vast welke hulp Kiki per scherm kan bieden.

- [ ] Implementeer Kiki als vaste hulpavatar.
  - Kiki blijft rechtsonder zichtbaar op de homepage en in alle spellen.
  - Kiki biedt op verzoek contextuele, kindvriendelijke hulp.
  - Kiki mag spelbediening of belangrijke inhoud niet afdekken, ook niet op mobiel en tablet.
  - Voeg pas later AI-functionaliteit toe als daar een duidelijke en veilige rol voor is.
