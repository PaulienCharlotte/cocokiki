# De grote muffinbestelling

Lokaal speelbaar via `/islands/cooking`, in de bestaande avonturenbalk.
Alleen deze bestelling is aangesloten; de vijf andere badges blijven vergrendeld.

## Bestanden

Nieuw:
- `data/adventures/catalog.ts`: het avontuur, scenario's, tekst en beloningen.
- `services/adventureRuntime.ts`: generieke coördinatie en activiteitadapters.
- `components/adventures/AdventureRunner.tsx`: klembordacties en activiteitweergave.
- `components/adventures/adventure-runner.css`: beperkte responsive opmaak.
- `tests/muffinAdventure.test.ts`: volledige integratieketen op testopslag.

Aangepast:
- `data/adventures/types.ts` en `services/adventures.ts`: optioneel vermijden van
  het vorige parameterantwoord en gezamenlijke voltooiing/muntuitkering.
- `components/dreamworld/WorldLocationLayout.tsx`: configureerbare runner-ingang.
- `components/dreamworld/LocationAdventureWidgets.tsx`: optionele klembordactie,
  rendering en mobiele starttab; geen locatiespecifieke spelregels.
- `pages/ShopScreen.tsx`: optionele eigenaarsterugweg; gewone journeys worden in
  die context niet verdergezet en gewone receptbeloningen niet geclaimd.
- `services/shopping.ts`: optionele scope voor een afzonderlijk mandje per run.
- `services/shoppingPractice.ts`: bestaand oefenbudget gebruikt dezelfde scope.
- `tests/index.test.ts` en `tests/worldLocations.test.tsx`: nieuwe tests en de
  gewijzigde beschikbaarheid van de muffinbestelling.
- `tests/plantKnowledge.test.tsx`: de bestaande controle op verborgen plantkennis
  is afgebakend tot de kennisafdeling. De datumafhankelijke dagquiz mag soortnamen
  als antwoordopties tonen; aan de quiz of plantenfunctionaliteit is niets veranderd.

## Flow en hergebruik

De definitie heeft vijf stappen: verhaal, rekensom, ingrediëntencontrole, koken
en aflevering. De bestaande AdventureEngine verzorgt alle stapovergangen.
AdventureRuntime gebruikt de bestaande adaptercontracten; het is geen tweede
avonturenengine. Zowel locatiegegevens als scenario's staan buiten React.

Vier rekenscenario's vragen 10/2, 10/5, 10-4 of 10-3-4. De engine bewaart het
gekozen scenario in AdventureRun.parameters en vermijdt de vorige keuze wanneer
alternatieven bestaan. Antwoorden worden uit de geconfigureerde bewerking
berekend. Alleen een correct antwoord schrijft een lokaal, poginggebonden bewijs.
De interface hergebruikt AmountInput, Button, Dialog en ProgressIndicator.

De voorraadcontrole gebruikt ingredientRequirements van het bestaande muffinrecept.
De gewone ShopScreen, prijzen, checkout en voorraad zijn hergebruikt. Een scoped
mandje voorkomt overschrijven van een gewoon receptmandje. Teruggaan vanuit de
winkel keert terug naar dezelfde avonturenstap; kopen rondt die stap niet af.
Als CocoCoins ontbreken blijft de bestaande mandjesoefening beschikbaar. Die
leerbeloning staat los van de avonturenbeloning; prijzen worden niet aangepast.

Voor het bakken gebruikt CookingExperience de bestaande afzonderlijke opslagadapter.
De run-ID, stap-ID en door de engine uitgegeven poging-ID blijven gekoppeld. Alleen
het opgeslagen kookvoltooiingsbewijs met bijbehorend voorraadtransactiebewijs telt
mee. De bestaande kookinteracties zijn niet aangepast. Een normale receptvoltooiing
telt niet mee en de gewone journey, voorbereiding en receptbeloning worden niet
overschreven. Herladen hervat via het klembord dezelfde poging; een kookbewijs dat
al opgeslagen is kan na een fout in de volgende stap opnieuw worden verwerkt
zonder opnieuw ingrediënten te verbruiken.

## Beloningen

De eerste aflevering geeft 10 per-run + 20 eenmalig = 30 CocoCoins. Latere runs
geven alleen de 10 per-run. De generieke engine gebruikt stabiele transactiesleutels
`adventure:run:<runId>:<rewardId>` en
`adventure:first:<adventureId>:<rewardId>`. Afgeronde run, claimstatus en alle
muntentransacties worden samen via commitLocalState geschreven. Een herhaalde
aflevering retourneert dezelfde afgeronde run. De oude finish-API zonder claimoptie
blijft ongewijzigd bruikbaar voor alleen-pending beloningen. Inventarisbeloningen
blijven een contract en worden nog niet uitgekeerd; er is geen nieuw object toegevoegd.

## Verificatie en grenzen

350 tests slagen. De nieuwe integratietests doorlopen kopen, bakken, aflevering,
30/10-beloningen, herhalen, foutieve antwoorden, ontbreken van kookbewijs,
gelijktijdige afleverpogingen en een mislukte gezamenlijke opslagactie.
De bereidingsinteracties worden geautomatiseerd via hun bestaande domeinfuncties
doorlopen, niet via een volledige browserkliktest van alle oven- en mengstappen.
Browsercontrole: starten, verkeerd/goed antwoord, hervatten na herladen,
voorraadvenster, bestaande winkel en terugweg; desktop en 360px mobiel zonder
horizontale pagina-overflow. TypeScript en productiebuild slagen. De bestaande
waarschuwing voor de grote Phaser-bundel blijft.

Run-acties en afzonderlijke kookopslag delen hetzelfde Web Lock. Dat voorkomt
onderlinge races en dubbele verwerking tussen samenwerkende tabbladen. Oudere
opslagmodules gebruiken dit slot niet; volledige cross-tab-isolatie voor de hele
website blijft de eerder beschreven beperking. Zonder Web Locks worden deze
avontuurmutaties geweigerd. Voortgang is lokaal, niet anti-cheatbestendig en niet
gesynchroniseerd tussen apparaten. De korte activiteitweergave sluit bij herladen;
het klembord heropent de opgeslagen stap/poging. Een incompatibele actieve definitie
wordt door de bestaande engine gearchiveerd, niet stilzwijgend gereset.

Geen nieuwe assets, backend, inventarisobject, analyticsactivatie of deployment.
