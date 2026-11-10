# Een nieuwe set taartplaatjes inladen

De taarten en de versieringen in het taartenatelier komen uit contactvellen.
Dit is wat er nodig is om een vel te vervangen of toe te voegen.

## Wat je aanlevert

Losse bestanden met een doorzichtige achtergrond (PNG of WebP), in de map
`_inbox-taartenatelier/` in de projectmap:

| Bestand | Inhoud |
| --- | --- |
| `taartbodems-contactvel.webp` | 6 taarten in een raster van 3 breed en 2 hoog |
| `versieringen-bovenaanzicht-contactvel.webp` | de losse versieringen, met ruimte ertussen |
| `taartvormen-contactvel.webp` | extra taartvormen, los van elkaar |

Die map hoort niet in de repo; alleen de uitgeknipte plaatjes gaan mee.
Ontbreekt een vel, dan slaat het script dat deel over: de taartbodems komen
dan uit de bestanden die er al liggen.

## Waar het op aankomt

- **Bovenaanzicht.** De taart wordt van bovenaf gezien, dus de versieringen
  ook: een aardbei van boven, een toef van boven, een bloem van boven. Een
  zijaanzicht ligt er verkeerd op.
- **Ruimte ertussen.** Minstens tien pixels tussen twee versieringen. Raken
  ze elkaar, dan ziet het script ze als één stuk.
- **Niet te klein.** Een los stukje van minder dan ongeveer 120 pixels
  oppervlak valt weg. Hoort een wolkje sprinkles bij elkaar, dan is dat juist
  goed; staat er een los snoepje, maak het dan wat groter.
- **Doorzichtig.** Geen witte of gekleurde achtergrond, ook geen schaduw die
  tot de rand doorloopt.

## Het inladen zelf

1. Zet het vel in `_inbox-taartenatelier/`.
2. Pas in `scripts/knipTaartAssets.py` de bijbehorende lijst aan:
   - `VERSIERINGEN` voor het versieringenvel. Per versiering een id, een
     naam, een soort (`slagroom`, `fruit`, `snoep`, `chocolade` of
     `versiering`) en een kader `(x1, y1, x2, y2)` in pixels op het vel. Een
     stuk hoort bij het kader waar zijn midden in valt, dus de volgorde van
     het zoeken hoeft niet te kloppen.
   - `WEGGELATEN` voor stukken die wel op het vel staan maar er niet op
     horen, bijvoorbeeld een zijaanzicht.
   - `SPLITSEN` voor twee stukken die elkaar raken: geef het kader van het
     samengeklonterde stuk en de kolommen waar het doorgesneden moet worden.
   - `VORMEN` voor het vel met taartvormen. Die raken elkaar niet, dus daar
     zijn alleen namen nodig, in leesvolgorde: van boven naar beneden en
     binnen een rij van links naar rechts.
3. Voer uit: `python3 scripts/knipTaartAssets.py`
4. Open het controlevel op `/tmp/taart-controlevel.png` en kijk of elk vakje
   het juiste plaatje bij de juiste naam heeft.
5. Draai `node scripts/generateAssetInventory.mjs`, zodat de assetinventaris
   klopt.
6. Pas in `tests/cakeStudio.test.tsx` de aantallen aan als er taarten of
   versieringen bij zijn gekomen.

Het script schrijft de plaatjes naar
`public/assets/library/cooking/taarten/` en
`public/assets/library/cooking/versieringen/`, en vernieuwt
`data/cake/catalog.ts` helemaal. Oude bestanden die niet meer in de lijst
staan, verwijder je zelf: `rm public/assets/library/cooking/versieringen/*.webp`
vóór het inladen is de veiligste manier.

## Als het aantal niet klopt

Het script stopt met een melding als een kader leeg blijft of als er een stuk
buiten alle kaders valt, en bij het vormenvel als er meer of minder stukken
zijn dan namen. Kijk dan op het controlevel: twee versieringen die elkaar
raken belanden in één vakje, een versiering die uit losse delen bestaat kan
in twee vakjes vallen. Meer ruimte op het vel lost dat op.
