# Sebs reisavonturen en studio-ingangen

17 november 2026. De getekende materialen van het To Do-bord blijven leidend.

## Reis als blijvende To Do

Een reis doorloopt weetjes → memory met weetjes en plekken → aanwijzen → aanwijzen en spellen → toets. De bestaande kaart, memory, oefenmotor en toets worden hergebruikt. Seb spreekt de reismeldingen uit. Het reisoverzicht gebruikt het bestaande vastgepinde papier en houten naambord; deze combinatie volgt de menuvoorbeelden waar een apart reisoverzicht nog niet beschreven stond.

`data/travel/adventures.ts` maakt reizen voor de bestaande provincies met voldoende gecontroleerde weetjes. Nieuwe gebieden gebruiken hetzelfde schema. Er wordt geen nieuwe kennis gegenereerd. Alleen bestaande plekken en memoryparen tellen mee.

`services/travelJourney.ts` bewaart elk ontdekt of behaald onderdeel per gebied. Wisselen tussen reizen bewaart de oorspronkelijke poging. Een volgende stap opent pas na de voorgaande; eerdere stappen blijven vrij oefenbaar. Hervatten gebruikt de nog ontbrekende plekken en setjes. Een lopende ronde krijgt een vaste lijst zodat nieuwe opslag geen kaarten of vragen verplaatst.

Stapbonussen zijn 10 + 20 + 25 + 25 munten; een volledig correct ingeleverde toets geeft 150 extra. Totaal 230 per gebied, naast de gewone oefenmunten. Stapbonus en voortgang worden atomair opgeslagen en kunnen niet dubbel worden uitgekeerd. De finale controle leest de opgeslagen toets, niet alleen een getoond cijfer. Bestaande oude reispogingen blijven compatibel.

Voortgang gebruikt de bestaande lokale documentopslag en accountback-up. Zonder account blijft hervatten afhankelijk van dezelfde browseropslag. De tempotoets staat als herhaalbare To Do onder Rekenen en opent de bestaande minuutspelmodus; er is geen tweede scoremotor toegevoegd.

## Uitnodigingen en studio's

Het To Do-bord toont nu één actuele opdracht per categorie, met voorrang voor de lopende kookbestelling of reis. Afgeronde eenmalige opdrachten maken plaats voor de volgende; herhaalbare spellen blijven staan. Geen nieuwe opdrachtplanner of daglimiet. De header gebruikt de volledige afgeronde papierasset in plaats van een uitvergrote uitsnede. Briefjes hebben vaste illustratie- en tekstruimte; het bord kan verticaal scrollen op lage schermen. Topografiemeldingen hebben extra ruimte binnen de gestikte rand en rond de sluitknop.

- Homepagebriefjes delen een raster voor illustratie, naam, tekst en actie. Een vierde briefje leidt naar alle To Do's; op telefoon bereikbaar door vegen.
- Taart: de witte bestelstrip is verwijderd. Coco geeft een korte opdracht in de gedeelde spraakwolk. Opslaan, downloaden en herstel staan verticaal rechts; Klaar rechtsonder. De taart onder de stolp in Coco's studio opent vrij versieren.
- Sebs wereldkaartkleed opent de bestaande vlaggenmemory met de aanklikbare wereldkaart. Terug leidt naar Seb.
- Lua's werkplaats heeft een telraam, weegschaal en meetplek met ingangen naar bestaande rekenspellen. Het projectboek en babykamerboek blijven bereikbaar.
- Topografiedialogen gebruiken het bestaande vastgepinde papier, wereldknoppen en Seb als gids.

## Illustratie Lua

Asset: `public/dreamworld/lua-workshop.webp`, gegenereerd met ImageGen vanuit de bestaande kamer. Bron: `/Users/charlottepaulien/.codex/generated_images/01a1e9dc-5d4f-7b93-899c-1b4da9a1812d/exec-57a0ae90-1728-43ba-9ae9-b19c14cb2bd0.png`.

Prompt:

> Edit this CocoKiki room background to become Baby Lua's rich inviting arithmetic workshop. Preserve exact camera, room dimensions, window on left, plants, shelving on both edges, open storybook at bottom left x16 y90, pencil dish and ruler bottom right x90 y92. Replace empty central wall with beautifully integrated handcrafted wooden learning furniture and objects, warm polished tactile 3D storybook, muted natural wood, cream, greens, amber daylight. Add three clear large clickable workstations: on a low wooden shelf against back wall place a colorful chunky wooden abacus centered x32% y48%, a brass balance with wooden weights centered x53% y48%, and wooden geometric blocks and a measuring tape centered x73% y48%. A simple illustrated pegboard behind them with wooden numeral tiles and little leaf illustrations, no legible writing. Shelf and stations are fully part of physical room with contact shadows, all distinct silhouettes. Keep plenty of clear foreground desk space, preserve existing bottom-left book and right-hand shelf with project books. Add a few cozy tactile details but no crowding. NO people, NO animals, NO text, NO UI, NO labels, NO buttons, NO badges, NO parchment panels. Same 3:2 landscape framing and warm cohesive art as reference. Not a flat school worksheet.

## Controle

Desktop en 360 px: homepage en extra To Do-briefje, reisoverzicht, weetjeskaart, Seb-dialoog, taartwerkvlak en rechter bediening, Lua's werkplaats. Ingangen naar taart, weegschaal, wereldkaartmemory en tempotoets gecontroleerd. Herladen bewaart een ontdekt weetje. Geautomatiseerd: stapvolgorde, gebied wisselen en hervatten, eenmalige beloningen, volledige toetscontrole en opslagfouten. Typecheck en 483 tests geslaagd. De volledige reisbeloning is via tests gecontroleerd; bij de browsercontrole is geen reis kunstmatig voltooid.
