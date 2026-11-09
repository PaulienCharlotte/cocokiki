# Dreamworld 2.0 (lokaal)

## Milo: visuele catalogus

Milo gebruikt nu de configureerbare `presentation: 'game'` binnen de bestaande
WorldLocationLayout. `LocationAdventureWidgets.tsx` bevat generieke
ActivityBadge, AdventureBadge, AdventureClipboard en LocationGameView; de
vormgeving staat in `location-game.css`. Novi en Felix houden hun bestaande UI.
De zes `adventurePreviews` zijn uitsluitend presentatieconfiguratie, geen
AdventureDefinitions: allemaal vergrendeld, selecteerbaar om te bekijken, zonder
voortgang, startactie, engine-import of opslag. Selectie blijft alleen in React.
Het klembord kan later expliciet aangeleverde echte voortgang tonen; er wordt
nu geen voortgang berekend of gefingeerd.

Recepten opent het bestaande kookboek en Voedingsstoffen de bestaande memory,
beide met de bestaande terugweg naar Milo. Boodschappen en Bakrekenen zijn
volgens de nieuwe UI-opdracht tijdelijk niet startbare locatie-ingangen; de
onderliggende winkel- en schoolroutes blijven intact. Alle beelden zijn bestaande
assets. Desktop en 360px mobiel zijn gecontroleerd, inclusief de laatste badge
in de intern scrollbare rij en het bijbehorende klembord. Geen nieuwe assets,
enginekoppeling of deployment. Tests: 333 geslaagd; typecheck en build geslaagd.

De wereldkaart gebruikt de aangeleverde afbeelding met losse React-iconen.
Zoom, pan en mobiele kaartpijlen blijven in de bestaande WorldMapViewer.
Milo en Novi zijn al onderdeel van hun achtergronden; er is geen tweede
personagebeeld of nieuwe illustratie toegevoegd.

## Configuratie

- `platform/activityRegistry.ts`: bestaande schoolmodules, recepten, planten
  en voedingsstoffenmemory, met unieke IDs en routes. Dit is de basis voor een
  latere centrale spellenbibliotheek, zonder nu zo'n interface te bouwen.
- `platform/worldLocations.ts`: locatie, achtergrondposities, accent, bewoner,
  hoofdingangen en verwijzingen naar bestaande activiteiten.
- `WorldLocationLayout`: desktop heeft twee onderste secties; mobiel heeft
  activiteiten/avonturen-tabs en native horizontale carrousels.
- Avonturen hebben een afzonderlijk type. Beide lijsten zijn leeg: recepten
  en planten zijn geen verhalen of nieuwe voortgang. Kweken is niet startbaar.

Een nieuwe bewoner gebruikt dezelfde layout en een nieuwe configuratie. Een
nieuwe activiteit verwijst naar een echte route in de activiteitenregistratie.
De bestaande boomhut, schoolspellen en hun opslagservices zijn niet verplaatst.
Coco/Kiki blijven de begeleiders binnen bestaande activiteiten; Milo/Novi zijn
uitsluitend bewoners van hun eigen locaties.

## Routes en terugweg

`/islands/cooking` en `/islands/plants` zijn nu locatiepagina's in plaats van
doorverwijzingen. `/treehouse/cookbook`, `/plantendokter`, alle `/school/math/*`,
`/school/clock` en overige spelroutes blijven bestaan.
`/games/nutrient-memory` opent de bestaande memory met dezelfde voedingsfeiten,
maar zonder receptvereisten, journey-mutaties, munten of nieuwe opslag.
`/treehouse/cookbook?recipe=<bestaand-id>` opent alleen het bestaande recept-
overzicht; het begint of reset niets en bewaart de bestaande toegangsregels.
Plantkaarten hergebruiken de bestaande verzorgkaart; uitgebreidere kennis blijft
volgens de bestaande encyclopedieregels beschikbaar.

`from=milo` of `from=novi` bewaart de terugweg bij een gestarte activiteit.
Alleen deze vaste waarden en goedgekeurde activiteitpaden zijn toegestaan;
er is geen willekeurige return-URL, nieuwe storage of open redirect.
Vervolgstappen binnen een recept behouden die context via de centrale navigatie.
Wereldkaart, boomhutoverzicht, locaties en privacy krijgen geen context mee.
Een losse spel-URL zonder context behoudt zijn oorspronkelijke terugweg.

## Grenzen

Geen avonturenengine, accounts of backend toegevoegd. Supabase en analytics
zijn niet gewijzigd of geactiveerd. Geen deployment uitgevoerd. De eerder
uitgestelde privacypagina blijft uitsluitend lokaal.
De aangeleverde PNG's zijn ongewijzigd overgenomen (ongeveer 2-3 MB per bestand).
De taalroute blijft bereikbaar als toekomstige plek; de nieuwe kaart heeft
geen afzonderlijk taalgebouw. Tests behandelen bestaande redirects en nieuwe
locatiepagina's afzonderlijk.

## Bestanden en verificatie

Nieuw: `platform/activityRegistry.ts`, `platform/worldLocations.ts`,
`services/locationNavigation.ts`,
`components/dreamworld/WorldLocationLayout.tsx`,
`components/dreamworld/world-location.css`, `pages/NutrientMemoryScreen.tsx`,
`tests/worldLocations.test.tsx` en de drie PNG-bestanden onder
`public/dreamworld/` en `public/dreamworld/locations/`.

Aangepast: `App.tsx`, `platform/routes.ts`, `platform/dreamworld.ts`,
`components/dreamworld/DreamworldMap.tsx`,
`components/dreamworld/WorldMapViewer.tsx`, `pages/CookbookScreen.tsx`,
`tests/index.test.ts`, `tests/dreamworld.test.tsx` en
`tests/worldArchitecture.test.tsx`.

Verificatie: 323 tests geslaagd, TypeScript-controle geslaagd en productiebuild
geslaagd. De bestaande waarschuwing voor een grote Phaser-bundel blijft staan.
Browsercontrole op desktop (1280x720), Milo mobiel (390x844) en Novi mobiel
(360x800): personages zichtbaar, tabs bereikbaar en geen horizontale
pagina-overflow. Terugwegen Milo -> Bakrekenen -> Milo en Novi ->
Plantendokter -> Novi handmatig gecontroleerd. Memory laadt 12 kaarten uit de
bestaande component. Niet ieder spel is volledig uitgespeeld tijdens deze
browsercontrole; de bestaande speltests blijven van toepassing.
