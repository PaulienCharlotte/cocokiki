# Dreamworld en muffinbestelling: overdracht voor vergelijking

Branch: `codex/dreamworld-adventures-review`.
Basis: `367474b` (de eerder gepushte GeoBas- en topografiewijzigingen).

Deze branch maakt het eerder lokale Dreamworld- en avonturenwerk beschikbaar
voor vergelijking. Hij is niet met de nieuwste `main` of een ander bestelsysteem
samengevoegd. Er is geen deployment uitgevoerd. De privacyverklaring,
privacyfooter, Supabase-voorbereidingen en analytics-hooks zijn niet opgenomen.
De lokale werkbestanden met die voorbereidingen blijven behouden.

## Wat deze implementatie bevat

- Nieuwe wereldkaart: `public/dreamworld/world-map-v2.png`, gekoppeld via
  `platform/dreamworld.ts` en `components/dreamworld/DreamworldMap.tsx`.
- Locaties Milo, Novi en Felix: `platform/worldLocations.ts`,
  `components/dreamworld/WorldLocationLayout.tsx` en de drie achtergronden in
  `public/dreamworld/locations/`.
- Gedeelde activiteitenbadges, avonturenbalk en klembord:
  `components/dreamworld/LocationAdventureWidgets.tsx`.
- Centrale activiteitenindex en veilige terugweg:
  `platform/activityRegistry.ts` en `services/locationNavigation.ts`.
- Zelfstandige voedingsstoffenmemory op `/games/nutrient-memory`, met de
  bestaande memorycomponent en vragen.
- Universele lokale avonturenengine: `data/adventures/types.ts` en
  `services/adventures.ts`.
- Eerste speelbare avontuur: `data/adventures/catalog.ts`,
  `services/adventureRuntime.ts` en `components/adventures/AdventureRunner.tsx`.
- Gescheiden kookpogingen via `services/cookingStorage.ts` en
  `services/isolatedCookingStorage.ts`; de bestaande CookingExperience gebruikt
  een optionele generieke adapter.
- De bestaande winkel met een afzonderlijk mandje en terugweg per avontuur;
  verbeterde winkeluitlijning in `components/shop/shop-layout.css`.

Milo's bestelling doorloopt verhaal → rekensom → voorraad/boodschappen →
bestaand muffinrecept → aflevering. Het rekenscenario wordt per poging opgeslagen.
De eerste aflevering geeft 30 CocoCoins, herhalingen 10, via unieke transacties.
Een kookbewijs is alleen geldig na opgeslagen voltooiing en voorraadverwerking.
Normale kookvoortgang en receptbeloningen worden daarbij niet gebruikt.

## Bekende overlap met het andere werk

Volgens de door de gebruiker doorgegeven beschrijving heeft Claude afzonderlijk
een bestelsysteem gebouwd in `data/cooking/orders.ts` en
`services/bakeryOrders.ts`, met toonbank, wens, receptkeuze, meerdere bakbeurten
en aflevering. Die implementatie is hier niet onderzocht of samengevoegd.
Deze branch bevat die twee bestanden niet.

Vergelijk vóór samenvoegen vooral:

1. Het spelverloop: de huidige vaste muffinbestelling tegenover een systeem
   met receptkeuze en meerdere bakbeurten.
2. Voortgang en hervatten: AdventureRun, activiteitspogingen en het andere
   bestelformaat; voorkom twee onafhankelijke registraties voor dezelfde bestelling.
3. Voorraad en beloningen: één daadwerkelijk ingrediëntenverbruik en één
   muntentransactie per geldige afronding, met behoud van bestaande spelgegevens.
4. De bakkerij-interface en terugnavigatie: gebruik één ingang voor bestellingen
   en behoud bestaande recepten en zelfstandige activiteiten.

De engine gebruikt het bestaande lokale opslagdocument en Web Locks. De
meewerkende avonturen- en kookmutaties zijn geserialiseerd; oudere opslagmodules
gebruiken niet allemaal hetzelfde slot. Volledige isolatie voor alle gelijktijdige
tabbladmutaties is daarmee niet gegarandeerd. Zonder Web Locks weigert de
afzonderlijke avonturenopslag mutaties. Er is geen nieuwe backend of synchronisatie
tussen apparaten toegevoegd.

## Lokaal bekijken en verifiëren

Gebruik een aparte checkout of worktree voor deze branch. Haal deze niet over
een map met ongecommit werk van een andere implementatie heen.

```sh
git fetch origin
git worktree add ../cocokiki-dreamworld-review origin/codex/dreamworld-adventures-review
```

Installeer daar de bestaande dependencies en start bijvoorbeeld met
`npm run dev -- --port 3004`. Een poort verwijst naar een draaiend proces; controleer
steeds vanuit welke checkout dat proces is gestart. De bestaande previews op 3000
en 3002 hoeven voor de vergelijking niet te worden gewijzigd.

Relevante routes: `/`, `/islands/cooking`, `/islands/plants`, `/islands/math`,
`/games/nutrient-memory` en de bestaande kookboek-, winkel- en schoolroutes.

Verificatie: `npm test`, `npx tsc --noEmit` en `npm run build`.
Voor bijzonderheden en eerdere browsercontroles:
`docs/dreamworld-locations.md`, `docs/adventure-engine.md`,
`docs/cooking-storage-adapters.md` en `docs/muffin-adventure.md`.

De oudere documenten beschrijven ook tussenstappen. Voor de actuele speelbare
muffinbestelling zijn `docs/muffin-adventure.md` en de huidige code leidend.
