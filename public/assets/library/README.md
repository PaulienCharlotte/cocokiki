# CocoKiki assetbibliotheek

De centrale catalogus staat in `data/assetLibrary.ts`. Nieuwe beelden krijgen daar altijd een stabiele sleutel voordat ze in een scherm worden gebruikt.

`inventory.json` bevat daarnaast automatisch ieder raster- en vectorbestand onder `public`. Werk deze lijst na nieuwe uploads bij met `npm run assets:inventory`.

## Indeling

- `treehouse/icons`: transparante kamer- en navigatieknoppen
- `treehouse/overview`: overzichtsbeelden van de boomhut
- `treehouse/rooms`: achtergronden per kamer
- `/public/games/world-hub`: wereldachtergronden en losse eilanden
- `/public/games/shop/products`: individuele winkelproducten
- `/public/games/cooking`: recepten en kookgerei
- `/public/assets/baby-lua`: achtergronden en karaktersprites
- `/public/images/avatars`: profielavatars
- `/public/images`: logo's en merkassets

## Naamgeving

Gebruik kleine letters en koppeltekens, bijvoorbeeld `living-room.png`. Bewaar samengestelde illustraties, losse objecten en iconen in aparte mappen. Verwijs vanuit React altijd via `ASSET_LIBRARY` wanneer een asset daarin beschikbaar is.
