# Afzonderlijke kookopslag

Deze technische uitbreiding voegt geen avontuur, route of interface toe.
Er is geen adapter aan een productiescherm gekoppeld. De bestaande kookroutes
geven geen adapter door en gebruiken de ongewijzigde domeinfuncties.

## Contract

`CookingExperience` accepteert optioneel `storageAdapter: CookingStorageAdapter`.
Het contract staat in `services/cookingStorage.ts`:

- `load`: verse werkstatus lezen;
- `begin`: starten of hervatten;
- `complete`: de bestaande kookvalidaties uitvoeren;
- `save`: opslaan, met een boolean of Promise<boolean> als resultaat.

Zonder adapter blijven `loadCookingProgress`, `beginCookingAttempt`,
`completeCookingAttempt` en `saveCookingProgress` de standaard. Alle bestaande
kookinteracties, hoeveelheden, ovencontroles en receptbeloningen blijven bestaan.
De component wacht bij asynchrone opslag op succes voordat hij de werkstatus
accepteert. Fouten gebruiken de bestaande foutmelding, geen nieuw scherm.

## Afzonderlijke poging

`createIsolatedCookingStorage(recipe, context)` maakt een opslagadapter.
Context bevat `runId`, `stepId`, `cookingAttemptId` en `recipeId`. Maak de unieke
attempt-ID bij de eigenaar van de opdracht en bewaar die daar. Gebruik dezelfde
context bij hervatten en houd de adapterinstantie stabiel tijdens de rendercyclus.
De aanroeper moet de juiste eigenaar en stap controleren; deze opslagservice
heeft bewust geen afhankelijkheid van een specifieke avonturenengine.

Pogingen staan in een nieuw versieerbaar document:
`cocokiki:isolated-cooking:v1`, binnen de bestaande lokale state-envelop.
Er is geen migratie of hernoeming van bestaande kookdata. Onbekende versies,
conflicterende bindings en corrupte afzonderlijke documenten worden geweigerd,
niet vervangen. Een gewijzigde bereidingsversie wordt niet stilzwijgend hervat.

`load()` projecteert de aparte sessie op een tijdelijke CookingProgressState,
zodat de bestaande kookfuncties kunnen worden hergebruikt. Deze projectie heeft
een eigen revisie. De callback `onProgressChange` ontvangt deze werkstatus:
bewaar hem alleen als viewstate, NIET opnieuw met `saveCookingProgress`.
Alle opslag moet via dezelfde adapter lopen. De gewone journeys, completions,
preparationSessions en activeRecipeId uit die projectie worden nooit weggeschreven.

Voor een herhaling maakt de eigenaar een nieuwe run/stapcontext met een nieuwe
cookingAttemptId. De bestaande knop Opnieuw kan een afgeronde afzonderlijke
poging niet resetten of opnieuw laten consumeren. De toekomstige avontuurinterface
moet het starten van zo'n nieuwe eigenaarspoging afhandelen.

## Voltooiing en voorraad

De bestaande `completeCookingAttempt` en `consumeRecipeIngredients` blijven de
bron van validatie, inclusief ovenresultaat, afgevinkte stappen, hoeveelheden en
de optionele suiker. Er wordt geen eigen bereiding of parallelle voorraadlogica
ingevoerd. Gewone prepaid-ingrediënten gelden niet als betaald voor een aparte
poging.

De save-controle leest onder het slot de actuele gedeelde voorraad en valideert
de voltooiing opnieuw. In één `commitLocalState` worden opgeslagen:

1. De aparte afgeronde sessie en het bijbehorende voltooiingsbewijs.
2. Alleen de aangepaste gedeelde kookinventaris en verhoogde kookrevisie.
3. Een unieke nultransactie `cooking-consume:<cookingAttemptId>` als ontvangstbewijs.

De nultransactie verandert geen saldo. Er wordt geen gewone receptvoltooiing of
receptbeloning opgeslagen. Het bewijs bevat de volledige binding, bereidingsversie,
start-/eindtijd en werkelijk verbruikte hoeveelheden. `adapter.receipt()` geeft dit
alleen terug als het bijbehorende transactiebewijs bestaat. Een herhaalde save van
een voltooide poging levert hetzelfde resultaat zonder opnieuw voorraad af te trekken.
Bij een opslagfout blijven zowel de voorraad als de aparte sessie ongewijzigd;
de caller krijgt false en mag de voltooiing niet tonen als opgeslagen.

## Gelijktijdige toegang

Alle saves via deze adapter vragen hetzelfde exclusieve Web Lock
`cocokiki:isolated-cooking-write` aan. Binnen het slot worden de actuele poging,
revisie, voorraad en transacties gelezen. Dit serialiseert samenwerkende tabbladen,
weigert verouderde tussensaves en voorkomt dubbele verwerking bij twee gelijktijdige
afrondingen. Zonder Web Locks weigert de afzonderlijke adapter te schrijven.
Gebruik localhost of HTTPS; er is geen onveilige lease-lock als fallback.

De bestaande algemene localStorage-opslag is GEEN database-transactie of globale
compare-and-swap. Andere bestaande modules gebruiken dit Web Lock niet. Een
overlappende, niet-meewerkende schrijver in een ander tabblad kan nog altijd een
race veroorzaken in de gedeelde envelop. De bestaande kookrevisie weigert wel een
oude gewone kooksave nadat de aparte voorraadwijziging is opgeslagen. Volledige
cross-tab-bescherming vraagt een latere gezamenlijke lockingafspraak voor alle
schrijvers; dat zou buiten deze technische stap vallen.

## Verificatie

Geautomatiseerd getest met gedeelde in-memory opslag en een gesimuleerde
exclusieve Web Locks-wachtrij voor twee adapterinstanties. Getest: normaal koken,
afzonderlijk koken, hervatten, normale en aparte voortgang naast elkaar, optioneel
ingrediëntenverbruik, geen dubbele verwerking, geen gewone receptbeloning,
voorraadtekort, opslagfouten en retries, incompatibele data, verouderde snapshots,
ontbrekende locks en gelijktijdige afronding. Dit is geen end-to-end-test met twee
echte browserprocessen. De bestaande kook- en recepttests blijven onderdeel van
de volledige testset.
