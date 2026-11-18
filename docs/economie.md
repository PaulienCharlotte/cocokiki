# De economie van CocoKiki

Alle bedragen staan in `services/economie.ts`. Spellen, kaartjes en de winkel halen ze daaruit; een test (`tests/economie.test.ts`) houdt losse bedragen elders tegen.

## Uitgangspunten
1. **Leren levert geld op, niet klikken of tijd.** Munten komen uit goede antwoorden die je zelf bedacht. Met hulp of een voorgezegd antwoord krijg je niets.
2. **Eén tempo:** ongeveer 6 munten per leerminuut (zo'n 3 goede sommen per minuut).
3. **Opdrachten geven een kleine, voorspelbare afrondbonus** bovenop de sommen. Creatief spel zonder sommen (taart versieren) krijgt geen grotere bonus dan rekenwerk.
4. **De boomhut is een lang doel:** vol in ongeveer 100 dagen van 20 minuten. Je eerste meubel koop je na één dag.
5. **Afwisselen loont:** na ongeveer een half uur hetzelfde spel op één dag krijg je de helft.

## Verdienen
| Bron | Munten |
|---|---|
| Goed antwoord | 2, +1 op niveau 4–5 |
| Redactiesom (meerdere stappen) | 6, +1 op niveau 4–5 |
| Moestuin, per verzorgstap | 4 |
| Plant genezen | +10 |
| Recept klaar | +10 |
| Oogst verkopen | +10 |
| Bakken voor een bewoner | +15 |
| Taart versieren | +15 |
| Kamer inrichten (en verkopen) | +25, naar rato van zelf opgeloste stappen |
| Vijf voor vandaag | +25 (5 per vraag) |
| Hele reis met Seb | +50 |

## Uitgeven
| Wat | Prijs |
|---|---|
| Klein decor, plantje | 20–45 |
| Meubel | ongeveer 60–150 |
| Groot meubel | tot 250 |
| Extra kamer | binnen 300, balkon 250, elke volgende +150 (tuinkamer +150) |
| Daken | 150 en 200 |
| Boodschappen | 3–46 |

Een volle boomhut kost zo ongeveer 14.000 munten: rond de 118 speeldagen van 20 minuten. De balanstest bewaakt dat dit tussen de 80 en 120 dagen blijft.

## Iets toevoegen
Een nieuw spel betaalt per antwoord via `rewardAnswer` met `muntenVoorAntwoord()`. Een nieuwe opdracht krijgt een bonus uit `OPDRACHT_BONUS`. Een nieuw meubel krijgt een basisprijs; `winkelPrijs()` maakt er de winkelprijs van. Gaat de balanstest daarna rood, dan klopt de verhouding niet meer.
