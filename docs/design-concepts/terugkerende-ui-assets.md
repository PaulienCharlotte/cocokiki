# Terugkerende UI-assets: materiaal en hergebruik

De nieuwe huisstijl is gecontroleerd in docs/HUISSTIJL.md, styles/cocokiki-tokens.css, components/platform/bovenbalk.css, components/ui/CardGrid.tsx en components/dreamworld/wereld-scherm.css.

## Bevindingen en uitvoering

| Onderdeel | Bestaande uitvoering | Verbetering |
|---|---|---|
| Houten wereldnaambord | CSS-verloop, rand en schaduw | Eén gedetailleerde lege houten illustratie; namen blijven echte tekst. Toegepast op de vier wereldschermen. |
| Ronde spelkeuze | CSS-glasvlak met wereldkleur en spelplaatje | Eén houten medaillon met messing detail en rustig roomkleurig midden. De bestaande illustratie en kleurmarkering blijven per spel behouden. Toegepast op de vier wereldschermen. |
| Klemborden | Vier thematische illustraties | Behouden als materiaalreferentie: dezelfde houtkleur, zachte belichting en roomkleurig papier. |
| Vaste bovenbalk en gereedschap | Vloeibaar glas met vaste lijniconen | In code behouden. Transparantie, focus, verschillende schermmaten en actieve toestanden vragen om dynamische weergave. |
| Antwoordbellen en voortgang | Dynamische kleuren, getallen, animaties | In code behouden. Geen cijfers of speltoestanden in een gegenereerd beeld vastzetten. |
| Hangkaartjes | CSS-papier/touw | Volgende geschikte illustratiekandidaat, maar pas per spelgebied beoordelen op ruimte en leesbaarheid. Niet in deze ronde gewijzigd. |

## Afspraken voor volgende generaties

- Genereer materiaal en lege houders; tekst, iconen, getallen en statussen blijven afzonderlijke lagen.
- Gebruik het bestaande kookklembord als referentie voor hout, papier, messing en licht.
- Eén frontale camera, licht van linksboven, zachte afgeronde randen en echte materiaaltextuur.
- Geen losse versieringen in het leesvlak; details blijven langs de rand.
- Transparante achtergrond, WebP met alpha, vaste bestandsnamen onder public/assets/library/ui.
- Controleer assets op hun werkelijke 44–88px gebruiksmaat. Detail mag het icoon niet verdringen.
- Pas geen volledig gerasterde knoppen toe: native knop, toetsenbordfocus, hover, ingedrukte toestand en label blijven in React/CSS.
- Breid materiaalgebruik per gebied uit. Niet alle bestaande schermen tegelijk omzetten.

## Generatie

Gemaakt met de ingebouwde image_gen-tool. Referentie: public/assets/library/cooking/klembord.webp. Originele PNG's blijven in de Codex-generated_images-map; de app gebruikt WebP-bestanden.

### Basisprompt

CocoKiki reusable game UI asset, warm highly detailed softly painted 3D hand-crafted wood-and-paper style matching the reference clipboard. Natural honey oak, warm ivory, restrained aged brass, subtle tactile wood grain, soft bevels, fine material detail, friendly rounded silhouettes, gentle diffuse lighting upper left. Production-ready isolated on genuinely transparent background, entire object visible with padding. No text, no letters, no symbols, no characters, no logos, no decorative plants, no scenery.

### wooden-nameplate

ONE horizontal wooden location name plaque, wide 5:1 shape, a single solid beautiful honey oak board with gently rounded irregular corners, refined carved raised beveled edge, subtle horizontal grain and a couple tiny natural knots ONLY near outer edges, two small recessed aged brass fasteners at far left and right. Broad central 80 percent is smooth quiet medium honey brown wood for WHITE live text overlay. No cream paper inlay, no lettering, no ropes, no shadows outside the asset. Keep profile slim and not chunky. Landscape image composition.

### navigation-medallion

ONE perfectly circular game navigation button base, centered in square image. Small sculpted honey oak outer rim with detailed grain, extremely thin aged brass inner fillet, inset warm ivory ceramic/paper-like center occupying 76 percent diameter, absolutely blank empty center for a separate game illustration. Subtle upper-left highlight and lower bevel, warm tactile craftsmanship, minimal restrained details, not ornate jewelry. No glossy plastic, no colored center, no gems, no symbols or icon. Equal thickness rim around whole circumference, front-on camera, circular not elliptical.
