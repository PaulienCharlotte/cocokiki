# Getekende menu's en het taartenatelier

Keuze van de gebruiker: de encyclopedie en het To Do-bord zijn de materiaalreferentie voor de onderdelen van het hoofdmenu. De To Do-stijl blijft behouden. Dieper in de spellen mag het werkvlak functioneler zijn. Deze afspraak staat nu ook in `docs/HUISSTIJL.md` en gaat voor op eerdere ontwerpverkenningen met gladde kaartvlakken.

## Aangepast

- Homepage-uitnodigingen en het spellenoverzicht hergebruiken de getekende vastgepinde briefjes via `ck-paper-surface`.
- Het bestaande To Do-bord en de encyclopedie zijn niet opnieuw vormgegeven.
- Het vrij te spelen taartenatelier heeft een eigen ingang in Alle spellen.
- Na een afgeleverde verjaardagstaart kan het kind via 'Versier nog een taart' naar het vrije atelier. De afgeleverde bestelling, het ontwerp en de eenmalige beloning worden niet gereset.
- De taart krijgt een expliciet bemeten werkvlak. De bestelstatus heeft een eigen rij en kan het werkvlak niet wegdrukken.
- De dubbele terugknop is uit het atelier gehaald. De vaste bovenbalk verzorgt terugnavigatie.
- De taart ligt op een keukenachtergrond; bediening gebruikt glas en de keukenwereldkleur. De kleurkeuze verwijst naar de bestaande huisstijltokens.
- Het wisselen van gereedschap deselecteert de versiering voordat tekenen begint, zodat het werkvlak tijdens het beginnen van een streek niet verspringt.

## Controle

Desktop en 360 px; taart openen via de afgeleverde bestelling, plaatsen en slepen van fruit, tekenen met een huisstijlkleur en ongedaan maken; hoofdmenukaartjes en briefjes; geen horizontale overflow. Een regressietest controleert dat vrij versieren bereikbaar blijft na afleveren en dat alleen renderen niets aan bestelling of opslag verandert.

Typecheck geslaagd. Laatste volledige controle: 479 tests geslaagd. Bij een eerdere run faalde een bestaande, wisselende redactiesomtest ('een latere stap verklapt nooit de uitkomst van een eerdere'); de taarttest bleef slagen en de hercontrole van de volledige suite slaagde. Aan die rekencode is voor deze wijziging niets aangepast.
