# Wereldkaart en navigatie — 14 november 2026

De homepage gebruikt nu de vierkante, vrijstaande planeet `assets/world-map-v2-planet.webp`, op basis van de eerdere wereldkaart. De oude kaart blijft behouden. Alle vijf locaties zijn herkenbaar gebleven. `WORLD_DESTINATIONS` bevat de nieuwe genormaliseerde coördinaten; kaart en raakvlakken delen dezelfde transformatie.

De volledige planeet kan met lucht rondom in beeld komen. De minimale zoom gebruikt 80% van de passende breedte/hoogte. Bij openen start de wereld als overzicht; terugkeren uit een locatie onthoudt de gekozen zoom en positie in geheugen. Centreren toont de hele wereld. Verder inzoomen kan tot 2,5× de oorspronkelijke kaartmaat. Slepen vereist ingedrukt houden; muiswiel, pinch, toetsenbord en de bestaande zoomknoppen blijven werken. Raakvlakken en locatie-iconen houden hun bruikbare schermgrootte.

Een vaste luchtlaag vult het hele venster. Overdag is deze lichtblauw met wolken; 's nachts donker blauwgrijs met sterren. Bij openen kiest de kaart nacht vóór 07:00 en vanaf 19:00 lokale tijd. Met de zon/maan-knop kan het kind de weergave zelf wisselen. Dit verandert geen spelvoortgang en kent geen tijdsdruk. Er is geen continue animatie.

De winkelknop onthoudt de boomhutkamer. Opdrachten staan achter het klembord; de encyclopedie in het profielmenu. Bestaande spelroutes, voortgang en saldi blijven behouden. Afbeeldingsfouten tonen nog steeds een toegankelijke bestemmingenlijst.

De planeet en het rechte Lua-portret zijn met de ingebouwde image_gen gegenereerd. De PNG-bronnen en promptset staan in `output/world-planet-2026-11-14/`. Lua's profielbestand is `public/images/avatars/lua-profile.webp`; het oude bestand blijft behouden.

## Verfijning lucht en eilanden

De lucht gebruikt nu echte illustratiebestanden in `public/dreamworld/sky/day.webp` en `night.webp`; de eenvoudige CSS-wolken en sterpunten zijn verwijderd. Bronbeelden en prompts: `output/world-skies-2026-11-14/`. Op desktop liggen de eilandkeuzes als horizontaal schuifbare strook onderin, met het klembord voor opdrachten bij zowel Coco als Kiki. De bestaande mobiele kaartenindeling blijft behouden. De losse Privacy-link is verwijderd; de bestaande privacypagina en opgeslagen spelgegevens zijn niet gewijzigd.

Weersuggesties zijn een concept in de backlog: een ouder kiest eventueel een plaats; de app kan dan vrijwillige buitenactiviteiten voorstellen. Er is nog geen weerkoppeling of locatieverzoek toegevoegd.
