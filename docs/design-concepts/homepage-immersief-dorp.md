# Immersief CocoKiki-dorp

De volledige bovenbalk is behouden. De gebouwen zelf vormen de navigatie; een zachte lichtvlek en een kort glazen label verschijnen alleen bij aanwijzen of toetsenbordfocus. Tikken opent direct dezelfde bestemming. Geen losse medaillons, actieborden of personagebadges. Het terrein vult het venster, met een kleine overloop voor parallax. Mobiel heeft een eigen portretillustratie en dezelfde vijf bestemmingen.

Dag/nacht wordt gedeeld door het dorp en het boomhutoverzicht via `cocokiki:world-light:v1`. Zonder opgeslagen keuze volgt het dagdeel de klok. Ramen behouden 's nachts een warme gloed. De modulaire boomhut heeft een apart gegenereerde nachtelijke open plek als achtergrond; bestaande kamers, bouwindeling en navigatie zijn behouden.

## Productiebeelden

Gemaakt met de ingebouwde image_gen-tool. PNG-bronnen blijven in de gegenereerde afbeeldingenmap; productiebeelden zijn als WebP in het project opgeslagen. De bestaande beelden blijven bewaard.

- `public/dreamworld/village/landscape-v2.webp`
- `public/dreamworld/village/portrait-v2.webp`
- `public/assets/library/treehouse/overview/treehouse-clearing-night.webp`

## Generatieprompts

### Dorp, landschap

Create a replacement production game environment asset for CocoKiki using reference as layout and artistic reference. Warm exquisite modern stylized 3D storybook miniature village, tactile hand crafted wood, rounded bevels, soft realistic ambient occlusion, terracotta, warm cream, lush green, glass greenhouse with beautiful reflections, highly polished professional children's adventure game. Exactly five destinations SAME normalized layout: bakery centered x24 y34, greenhouse x76 y34, beloved treehouse x50 y52, school workshop x24 y73, explorer cottage with globe telescope x76 y73. Every door clearly visible facing camera and large inviting. One continuous landscape with winding paths and creek. More sculpted 3D depth and thoughtful exquisite small details than reference, soft light, coherent scale, welcoming. Landscape wide 3:2. Critical: no buildings near outer 12% of image, all architecture fully inside central 76%, only expendable foliage and grass at edges. Grass and creek extend fully to left right and bottom image edges, no rectangular scene sitting on sky. GENUINE TRANSPARENT sky above irregular tree and roof silhouettes; no opaque sky. Upper 14% mostly transparent free for app navigation. No UI, no icons, no badges, no people, no animals, no lettering, no logo, no signs. This is navigable immersive environment, not interface mockup. Preserve five clearly recognizable buildings, spatial layout and continuous paths. Full bleed terrain at sides and bottom.

### Dorp, portret

Create portrait mobile 2:3 version of this exact CocoKiki polished 3D village environment. SAME buildings, style, warm exquisite hand crafted rounded wood, flowers and reflections and coherent paths and creek. Rearrange for portrait phone: bakery centered x24% y29%, greenhouse x77% y29%, central treehouse x50% y49%, school workshop x24% y70%, explorer house x77% y70%. Buildings each about32% image width and22% height, separated fully visible doors. Five destinations only. Continuous lush landscape extends FULL BLEED to left right bottom edges, absolutely no visible rectangular boundary on left/right, grass rocks and stream run to edge. GENUINELY transparent sky above tree silhouettes, upper12% mostly empty transparent space. No text, no icons, no characters, no badges, no UI. Keep tactile sculpted modern 3D delightful professional adventure game style. Clear doorways are interactive destinations. Full scene, not individual floating islands. Image aspect 2:3 portrait.

### Boomhut, nacht

Edit target: exact same CocoKiki treehouse cutaway scene at magical blue hour NIGHT. Lighting-weather edit only. Preserve pixel composition, camera, all four rooms, furniture, doors, ladders, tree shape, branches and every object location. Replace visible blue daytime sky with deep indigo starry night, tiny soft stars, distant forest in cool moonlight. Leaves cooler emerald softly moonlit. Interior remains inviting warmly illuminated amber by existing pendant lamps and fairy light strings. Beautiful tactile polished 3D storybook light, cozy, never scary, readable and detailed. No text, no UI, no added objects. Entire image same aspect ratio and framing as reference. Night scene should visibly differ from daytime while retaining bright cozy rooms.

## Aanvulling op de huisstijl

Gebouwnavigatie met labels die alleen bij aanwijzen/focus verschijnen volgt het bestaande kamerpatroon, op uitdrukkelijk verzoek. Op een aanraakscherm blijven de grote gebouwvlakken direct aantikbaar. De dag-/nachtknop gebruikt de bestaande zon/maanbediening.


### Modulaire boomhut, nachtelijke open plek (productie)

Lighting-weather edit of reference game background ONLY. Preserve exact landscape framing, camera, all ground rocks plants branches distant mountains lake and clear EMPTY CENTRAL SPACE for modular treehouse. Change daytime to magical welcoming moonlit night. Deep indigo starry sky, tiny warm fireflies low around bushes, soft cool moonlight on grass and tree leaves, distant mountains in gentle blue haze. Polished tactile 3D storybook CocoKiki art. Keep ground clearly readable. No buildings, no treehouse, no characters, no interface, no lettering. Same 3:2 composition. Do not add any central objects. Bright cozy magical night, not scary or overly dark.

De eerdere doorsnedevariant is bewaard als ongebruikte ontwerpverkenning in `artifacts/homepage/treehouse-cutaway-night.webp`; de app gebruikt uitsluitend de modulaire boomhut.

## Gids met echte To Do-uitnodiging

Het bestaande `SpeechBubble`-component toont één uitnodiging. De selectie leest de bestaande voortgang: een lopende bakbestelling, Sebs actieve reis of Luna's lopende babykamer krijgen voorrang; anders volgt een beschikbare onafgeronde opdracht. Bakken wordt door Coco aangeboden, reizen door Seb en inrichten door Luna. Een afgeronde bestelling wordt niet opnieuw voorgesteld. Renderen start geen opdracht en schrijft geen voortgang of beloningen weg. Nieuwe bak- en reisopdrachten verwijzen naar hun bestaande To Do-gebied; lopend bakken en de babykamer openen direct. Het dagaanbod is de laatste optie; als ook dat klaar is, blijft het dorp zonder uitnodiging in beeld.

Desktop: linksonder in de voorgrond. Op 360 px: onder het menu in de vrije lucht, boven de gebouwen. De oorspronkelijke algemene ondertekst verdwijnt zolang de gids er staat, zodat er één uitnodiging is.

## Keuze uit drie uitnodigingen

Op verzoek staan meerdere personages tegelijk rechts, met maximaal drie open opdrachten uit verschillende gebieden. Lopend werk staat eerst; per gebied staat er één keuze. De lijst leest dezelfde To Do-voortgang en start pas iets na de bestaande opdrachtkeuze. Op mobiel wordt dit een horizontaal veegbare rij; de volgende uitnodiging is gedeeltelijk zichtbaar en elke actie is met het toetsenbord bereikbaar.

De desktopillustratie is hiervoor opnieuw gecomponeerd: vijf huizen links en een rustige open plek rechts. Productiebeeld: `public/dreamworld/village/landscape-quests.webp`. De eerdere versies blijven bewaard. Gemaakt met de ingebouwde image_gen-tool.

### Prompt landschap met ruimte voor uitnodigingen

Recompose reference CocoKiki village illustration for an immersive game homepage with three character speech bubbles over the RIGHT quarter. Preserve exact beautiful polished tactile 3D storybook art, same FIVE recognizable buildings, wood, flowers, glass greenhouse, creek, trees. Critical NEW COMPOSITION: all five destinations entirely within LEFT 70% of canvas. Bakery center x18% y33%, greenhouse center x57% y33%, treehouse center x37% y50%, school workshop center x18% y70%, explorer cottage with telescope globe center x57% y70%. Each building footprint around21% image width. Rightmost 28% from x72% to100% is a continuous peaceful unoccupied meadow and softly detailed stream with low plants ONLY, NO BUILDINGS or focal objects there: this is breathing room behind live quest UI. Seamless continuous terrain extends fully to all left right bottom edges, no visible rectangle boundary, no separated islands. Keep small surrounding bushes, coherent connecting winding paths, rich warm lighting. GENUINELY TRANSPARENT SKY above irregular tree canopy silhouettes in upper15%, no painted sky. Overall landscape 3:2. No text, no labels, no interface, no icons, no badges, no people, no animals, no signboards. Keep village magical but calm. Only rearrange layout as specified; retain all five destinations.

## Warme geïllustreerde uitnodigingen

De drie uitnodigingen gebruiken nu het bestaande `SpeechBubble`-component met een optionele illustratie. Binnen de homepage staan taakillustratie, kleine afzenderavatar, naam, korte uitnodiging en actie in één rustig vlak. Warme roomtinten en glas komen uit de bestaande tokens; er is geen papiertextuur toegevoegd. Bij bakken wordt een beschikbaar gerecht gekozen dat bij de bestelwens past, of het reeds gekozen recept. Luna's babybedje en de bestaande dagelijkse illustratie worden hergebruikt. De reis heeft een nieuwe wereldbolillustratie in `public/dreamworld/quest-travel.webp`.

De bestaande spraakwolken zonder illustratie veranderen niet. Desktop en mobiel hebben dezelfde leesvolgorde; op mobiel schuift de wereld iets omlaag om de uitnodigingen vrij te houden.

### Prompt reisillustratie (ingebouwde image_gen)

One isolated compact CocoKiki children's adventure quest illustration on genuinely transparent background. A small beautiful tactile 3D desktop globe with turquoise oceans and softly embossed green land on warm honey oak stand, with a neatly folded little map and a tiny brass compass leaning against its base. Exquisite cozy rounded storybook game asset, sculpted beveled edges, warm cream and wood, soft amber studio daylight, polished modern rendering with ambient occlusion. Clear iconic silhouette, readable at 80px. Objects form ONE tight cohesive cluster with globe dominant, no floating pieces. Entire object visible with generous transparent margin. No background, no floor, no text, no lettering, no badges, no interface, no parchment board, no treasure chest, no people, no animals. Square composition. Match warm handcrafted premium CocoKiki game world, not flat icon.
# Vrijliggende uitnodigingen — 18 november

De kop 'Waar heb je zin in?' en de glazen onderlaag zijn verwijderd. Vier uitnodigingen delen één componentindeling, inclusief de ingang naar alle To Do's. De hele kaart is aanklikbaar met één toegankelijke actienaam. Illustratie, avatar, personagenaam en actie hebben vaste posities. De bestaande `pinned-paper.webp` blijft behouden via negenvlakschaal: boven- en onderrand behouden hun beeldverhouding, alleen het midden rekt verticaal. Hierdoor blijft de punaise rond. Extra ruimte boven de naam voorkomt dat deze tegen de punaise staat. Op mobiel blijven de briefjes horizontaal veegbaar. Geen nieuwe afbeelding gegenereerd.
