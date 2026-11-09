# GeoBas: Frankrijk, Spanje en Portugal

De bestaande topografiemodule (`/games/topo`) heeft een nieuw leergebied onder
**Gebied → Leergebieden**. Alle 36 onderdelen zijn beschikbaar in verkennen,
aanwijzen, spellen, aanwijzen + spellen en de volledige topo-toets. Bestaande
memoryvragen zijn beschikbaar voor zover er al weetjes voor deze namen bestaan.
Er zijn geen nieuwe spellen, routes, opslagmechanismen of beloningen toegevoegd.

## Bestanden en uitbreiden

- `data/topography/france-spain-portugal.json`: ongewijzigde aangeleverde bronlijst,
  met oorspronkelijke IDs, namen en nummering.
- `data/topography/datasets.ts`: kleine generieke registratie en omzetting naar
  bestaande `Location`/`Province`. Nieuwe werkbladen registreren hier een eigen
  lijst, geometriebestand, ankers en kaartuitsnede.
- `public/data/geojson/france-spain-portugal.geo.json`: 36 echte geometrieën plus
  niet-interactieve land- en grenscontext. Wordt alleen voor dit leergebied geladen.
- `data/topography/france-spain-portugal-geography.json`: bronhashes,
  gecontroleerde stadsankers en labelankers. De 21 puntcoördinaten blijven exact
  gelijk aan de aangeleverde coördinaten.
- `data/topography/geometry.ts`: gedeeld contract en volledigheidscontrole.
- `components/topography/worksheetGeometry.ts`: één gedeelde Leaflet-laag voor
  `InteractiveMap` én `ToetsGame`, zodat de vormen in alle modi gelijk zijn.

De oorspronkelijke `sourceNumber` wordt niet als speel- of toetsnummer gebruikt.
De bestaande toets genereert zijn eigen plek-, water- en gebiedslabels, ook bij
schudden en deelsets. Voortgang en toetsconcepten blijven via de bestaande functies
opgeslagen. Nieuwe IDs overlappen niet met bestaande opdrachten.

## Geografische bron

Alle vormen komen uit **Natural Earth v5.1.2**, publiek domein, WGS84-lengte/breedte.
De reproductie gebruikt vastgezette GeoJSON-bestanden uit de officiële repository:

`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/`

| Onderdeel | Natural Earth-laag |
| --- | --- |
| Landen, inclusief Monaco en Andorra | `ne_10m_admin_0_countries.geojson` |
| Mallorca en Corsica | afzonderlijke eilandpolygonen uit dezelfde landsgrenzen |
| Seine en Rhône | `ne_10m_rivers_lake_centerlines.geojson` |
| Atlantische Oceaan en Middellandse Zee | `ne_10m_geography_marine_polys.geojson`, oceaan inclusief Golf van Biskaje |
| Pyreneeën en Alpen | `ne_10m_geography_regions_polys.geojson` |
| Onafhankelijke controle van de 21 puntankers | `ne_10m_populated_places.geojson` |

Verantwoording en gebruiksvoorwaarden:

- https://www.naturalearthdata.com/about/terms-of-use/
- https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/
- https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/
- https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/

Vormen zijn uitgesneden op de regionale context en licht vereenvoudigd (0,002°,
rivieren 0,001°, Monaco 0,0001°; topologie behouden). Zeevlakken zijn uitgesneden
langs de landskust; er komen geen verzonnen cirkels rond locatieankers. Kunstmatige
uitsnederanden worden niet als grens getekend. Naburige landen zijn kaartcontext,
geen extra toetsvragen. Overzeese gebieden vallen buiten deze uitsnede.

Gebergte- en zeegebieden uit de fysieke labeldata zijn **gegeneraliseerde
geografische gebieden**, geen exact vastgelegde grenzen. Natural Earth vermeldt
voor fysieke gebieden een nauwkeurigheid van ongeveer schaal 1:50 miljoen.
Deze beperking is relevant voor detailgebruik, maar verandert de algemene ligging
van de Alpen en Pyreneeën niet.
De rivierlaag is eveneens cartografisch gegeneraliseerd: de Seine-lijn loopt tot
het estuarium bij Tancarville; het brede zeewaartse mondingswater bij Le Havre is
geen zelfgetekende verlenging van die rivierlijn.

## Overeenstemming met het schoolblad

De lijst en nummering zijn met de twee aangeleverde GeoBas-foto's vergeleken.
De plaatsankers zijn tegen gelijknamige steden in Natural Earth gecontroleerd
(afwijking kleiner dan 5 km, grootste circa 2,9 km). Geen plaats is verzet om
labels beter te laten passen. Monaco ligt oostelijk van Nice; beide hebben een
apart kaartobject. Kleine landen krijgen een extra raakvlak op hun echte anker;
de echte grens blijft bestaan. Inzoomen helpt bij dicht bij elkaar liggende plekken.
Gibraltar is volgens de bronlijst een punt, geen nieuwe landopdracht.

Leaflet gebruikt Web Mercator. De gefotografeerde gedrukte schoolkaart is
gegeneraliseerd en heeft geen meegeleverde projectie. Daarom zijn ligging en
onderlinge oriëntatie geografisch correct, maar is de schermkaart **geen exacte
pixelkopie of gerectificeerde versie** van het werkblad. Nummers op het papier zijn
vaak naast het object geplaatst en mogen niet als echte plaatscoördinaten gelden.

## Reproduceren en controleren

Eenmalig Python + Shapely gebruiken, buiten de applicatie-dependencies. Download
de vijf bronbestanden hierboven en sla ze in een tijdelijke map op als
`ne-admin_0_countries.json`, `ne-rivers_lake_centerlines.json`,
`ne-geography_regions_polys.json`, `ne-geography_marine_polys.json` en
`ne-populated_places.json`.

```sh
python scripts/prepareGeobasGeometry.py /pad/naar/bronmap
npm test
npx tsc --noEmit
npm run build
```

De generator controleert bronankers en geldige topologie; tests controleren alle
36 IDs, geometriesoorten, ijkpunten, stad/land- en zee/landverhoudingen, registratie
in de bestaande modi en behoud van de oudere leergebieden. Controleer daarnaast
desktop en 360px: kaart laden, alle categorieën, aanwijzen, spellen, volledige
toets met 36 vragen en kleine landen na inzoomen. Als de lokale kaartdata niet
laadt, verschijnt een melding; er worden geen verzonnen puntvormen gebruikt.

De achtergrondtegels blijven de al gebruikte Esri-dienst. Lokaal gebundelde vormen
voegen geen externe runtime-dienst of analytics toe. De achtergrond en de kleine
naamlabels worden met de bestaande kaartinstellingen bediend.
