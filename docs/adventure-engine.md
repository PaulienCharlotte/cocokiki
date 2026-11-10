# Lokale avonturenengine: stap 1

Er is nog geen productiecatalogus, avontuur, route, interface of speladapter
toegevoegd. De engine is niet vanuit de app aangeroepen. Testconfiguraties
leven uitsluitend in `tests/adventures.test.ts`.

## Contracten

`data/adventures/types.ts` beschrijft definities, pogingen en adapters.
Een definitie heeft een uniek ID, positieve gehele versie, locatie/personage,
tekst, stappen, ontgrendelvoorwaarden en beloningen. Alleen `story`, `activity`
en een afsluitende `finish` zijn geldig. Stappen en beloningen hebben unieke IDs.
Ontgrendeling ondersteunt aanvankelijk alleen eerder voltooide avonturen.
Parameters zijn benoemde keuzelijsten met getallen, strings of booleans, geen
uitvoerbare formules of generators in opgeslagen data. Dit ondersteunt later
aantallen, moeilijkheidsniveaus en ingrediënten-IDs. Onderlinge afhankelijkheden
horen in later gevalideerde varianten; nu zijn de keuzes onafhankelijk.

`new AdventureEngine(definitions, adapters)` registreert configuratie, geen UI.

- `start(id)` kiest parameters en slaat een nieuwe poging op; weigert wanneer
  er al een actief avontuur is. Nieuwe pogingen mogen dezelfde willekeurige
  keuze treffen, maar krijgen altijd een nieuwe selectie en sessie-ID.
- `resume()` leest de opgeslagen actieve poging zonder stappen af te ronden.
- `advanceStory(runId, stepId)` vereist de actuele verhaalsstap expliciet.
- `prepareActivity(runId, stepId)` maakt een opgeslagen context met poging-ID.
  Opnieuw aanroepen/hervatten levert dezelfde context, niet een nieuwe poging.
- `completeActivity(runId, stepId)` vraagt een geregistreerde adapter om
  bewijs, valideert dat en gaat alleen daarna verder.
- `finish(runId, stepId)` rondt uitsluitend de laatste stap af. Beloningen
  worden nooit betaald; de status wordt bij geconfigureerde beloningen `pending`.
- `replay(runId)` start een nieuwe poging na een voltooide poging.
- `abandon(runId)` bewaart een afgebroken poging en maakt een nieuwe mogelijk.

Resultaten zijn kopieën. De caller kan opgeslagen parameters niet via een
teruggegeven object veranderen. Stap-IDs voorkomen dat een dubbele klik op
de vorige stap ongemerkt een volgende stap voltooit.

## Grens met bestaande activiteiten

Een toekomstige adapter moet een NIEUWE eigen domeinpoging beginnen na
`prepareActivity`, en die koppelen aan de opgeslagen run/stap/poging-ID. Hij
moet deze koppeling ook kunnen herstellen na herladen. `readCompletion` leest
het afgeronde resultaat uit de eigen spelopslag; `validateCompletion` controleert
succes, de opgeslagen koppeling en de bestaande spelregels. Hij mag niet een
oud resultaat voorzien van nieuwe context of tijdstempels. De engine controleert
identiteit, start- en eindtijd, ongebruikte bronpoging en stapvolgorde opnieuw.
Een URL, terugknop, eerder gehaald niveau of globaal receptvinkje is geen bewijs.
Adapters zijn vertrouwde lokale code: de engine kan hun inhoudelijke oordeel
niet onafhankelijk bewijzen. Er zijn nu bewust GEEN adapters voor echte spellen.

## Opslag en veiligheid

`services/adventures.ts` schrijft alleen een nieuw document
`cocokiki:adventures:v1` via de bestaande `commitLocalState`, zonder
muntentransacties. Bestaande documenten, legacy-sleutels en saldo blijven staan.
Opslagfouten geven een fout terug, geen schijnbaar opgeslagen voortgang.
Corrupte data/onbekende opslagversies blokkeren writes en blijven onaangeroerd.
Bij een ontbrekende of gewijzigde definitieversie bewaart `resume` de poging als
`incompatible`; er wordt geen voortgang overgezet of beloning verdiend. Daarna
kan een nieuwe poging worden gestart. Verhoog de definitieversie altijd wanneer
inhoud, spelvoorwaarden of beloningen veranderen. Bewaar historische definities
voordat later oude beloningsclaims verwerkt gaan worden.

Iedere mutatie leest verse data en controleert de revisie voor het schrijven.
Dit weigert verouderde snapshots, maar localStorage biedt geen echte
cross-tab-transactie: exact gelijktijdige writes in verschillende tabs blijven
een beperking van de bestaande architectuur. Voor latere beloningsuitkering is
expliciete serialisatie tussen tabs nodig. Lokale data is geen anti-cheatopslag
en verdwijnt bij wissen van browsergegevens. Pogingen worden nog niet opgeruimd.

## Beloningen en vervolg

Beloningen hebben stabiele IDs, `once` (eenmaal per avontuur/beloning) of
`per-run` (eenmaal per sessie), plus munten of een bestaand inventarisproduct.
Dit is uitsluitend een contract: geen claim-API, muntuitkering of voorraadwijziging.
De toekomstige beloningsadapter moet stabiele transactiesleutels, catalogusvalidatie,
inventarislimieten en gezamenlijke opslag van claim, munten en voorraad toevoegen.

Voor Milo resteert: echte avontuurconfiguratie, hoeveelheid-/batchlogica,
geisoleerde receptpogingen, winkel- en kookadapters, interface en beloningen.
Boomhut, inventaris, spelmechanieken, analytics en backend zijn niet aangepast.
