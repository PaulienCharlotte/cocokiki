# CocoKiki – Netlify-verbruik optimaliseren

Datum: 12 november 2026. Alleen lokale wijzigingen; geen push, productie-deploy of wijziging van Netlify-projectinstellingen.

## Vastgesteld en vermoed

**Vastgesteld in de huidige code/build:**

- Het startscherm gebruikte een PNG van 2.977.727 bytes.
- Er stonden geen projectspecifieke browsercacheheaders in de repository. Dat betekent niet dat de Netlify-CDN zelf niet cachet: de CDN-cache en de browsercache zijn verschillende lagen.
- Recept- en keuzerasters laadden afbeeldingen zonder lazy loading.
- De topografische componenten haalden dezelfde GeoJSON-bestanden opnieuw op bij wisselen van scherm/modus. Nederland en Europa werden ook aangevraagd bij een werkblad dat eigen geometrie heeft.
- De URL's voor vijf kookingrediënten hadden `?v=2`, terwijl dezelfde bestanden elders zonder querystring worden gebruikt. Dat zijn verschillende browsercachesleutels.
- De hoofd-JavaScriptbundel bevatte React samen met veranderlijke appcode. Phaser zat al achter een dynamische import, maar was gecombineerd met spelcode.
- Leaflet-CSS werd op alle pagina's van unpkg geladen. Dezelfde versie kan lokaal worden meegebundeld.

**Niet aangetoond als oorzaak van deze teamkosten:**

- Geen Netlify Functions, Edge Functions, AI Gateway of CI-workflows gevonden in deze repository.
- `services/geminiService.ts` bevat directe Gemini-aanroepen, maar wordt nergens geïmporteerd door de huidige app. De production build laadt die integratie niet. Niet verwijderd: geen noodzaak om mogelijke toekomstige functionaliteit weg te halen.
- De bestaande optionele analytics gaat naar Supabase, niet naar een Netlify Function. De bestaande privacy- en configuratiepoorten zijn behouden; niets aangezet of toegevoegd.
- De aangetroffen intervallen dienen lokale spelklokken en voortgang. Geen onnodige periodieke netwerkpolling gevonden. Deze spelklokken zijn behouden.
- Er zijn geen automatische GitHub-workflows gevonden. Of automatische builds in het Netlify-dashboard uitgeschakeld zijn, is niet geverifieerd: de browsercontrole liep vast. Geen instellingen gewijzigd en automatische deployments niet opnieuw ingeschakeld.
- De opgegeven production-, AI- en computecredits zijn teamtotalen. Ze kunnen niet op grond van deze codeanalyse aan CocoKiki worden toegeschreven. AI inference kan bij Netlify onder andere uit Agent Runners of AI Gateway komen.

## Uitgevoerd

1. Wereldkaart verliesvrij naar WebP: **2.977.727 → 2.210.962 bytes**. Resolutie en alle RGBA-pixels zijn identiek. Vite geeft de afbeelding automatisch een inhoudshash. De oorspronkelijke PNG blijft als bron in `source-assets/`, buiten de publicatiemap. De gegenereerde `_redirects` behoudt de oude PNG-URL via een rewrite naar de nieuwe kaart.
2. Lazy loading en async decoding voor afbeeldingen in `CardGrid`, receptkaarten en het boodschappenraster. Achtergronden en noodzakelijke interactieve spelbeelden blijven direct laden. Alle bestaande onderdelen blijven bereikbaar.
3. Een gedeelde, alleen-in-geheugen JSON-loader deelt lopende en afgeronde aanvragen. Mislukte aanvragen mogen opnieuw geprobeerd worden. Geen verandering aan localStorage, recepten, beloningen of spelvoortgang.
4. Kaartcomponenten vragen alleen hun benodigde geometrie aan. De bestaande Europese contextlaag bij Nederlandse kaarten blijft behouden. Werkbladen slaan de ongebruikte Nederland-/Europa-aanvragen over; de toets vraagt uitsluitend de relevante algemene kaart op.
5. Nederlandse provincie-GeoJSON compacter opgeslagen: **25.993 → 9.350 bytes**, met dezelfde JSON-waarden en geometrie. De grote Europa- en werkbladbestanden waren al compact; niet vereenvoudigd of met minder precisie opgeslagen.
6. React en Phaser in afzonderlijke gehashte vendorbestanden. Ze worden herbruikbaar over deploys heen wanneer alleen app-/spelcode verandert. Phaser zit niet in de initiële importboom en wordt alleen bij Lua geladen. Het totaal aan JavaScript wordt hiermee niet substantieel kleiner.
7. Leaflet-CSS lokaal meegebundeld, vóór app-CSS om de bestaande cascade te behouden. Geen extra CDN nodig. De overbodige shortcut-icondeclaratie verwijderd; favicon en Apple-touch-icon blijven bestaan. In de meting vraagt de browser het logo nog steeds meerdere keren op; geen onbewezen requestbesparing daarvoor geclaimd.
8. De vijf ingrediënten-URL's gelijkgetrokken. Vaste, niet-gehashte bestanden blijven opnieuw gevalideerd worden, zodat deze normalisatie geen langdurig verouderde afbeeldingen oplevert.

## Cachebeleid en nieuwe versies

De Vite-build genereert `dist/_headers` met **exacte paden naar gehashte buildbestanden**:

- Gehashte JS, CSS en afbeeldingen: `Cache-Control: public, max-age=31536000, immutable`.
- HTML, SPA-routes en vaste public-URL's: `Cache-Control: public, max-age=0, must-revalidate`.
- Geen brede immutable-regel op `/assets/*`: daaronder staan ook veranderlijke library-afbeeldingen.
- Bij een gewijzigde kaart, JavaScript- of CSS-inhoud genereert Vite een nieuwe URL. HTML wordt bij een volgende paginalading opnieuw gevalideerd en verwijst naar die nieuwe bestanden.
- Een reeds geopende app wordt niet automatisch herladen: geen verstoring van een lopend spel. De nieuwe versie verschijnt bij de volgende paginalading. De oude wereldkaart-URL blijft werken via `_redirects`.

Dit beleid is lokaal in de builduitvoer en met regressietests gecontroleerd. Het is niet op Netlify uitgerold; werkelijke Netlify-responseheaders moeten bij de eerstvolgende **handmatige** deployment worden gecontroleerd.

## Gemeten

Twee lokale production builds op afzonderlijke origins, desktop **1280 × 720**. De lokale meetserver comprimeert tekst met gzip en registreert uitsluitend lokale testrequests in `/tmp`. Dit is geen ingebouwde analytics en wordt niet gepubliceerd. Geteld zijn requests naar de lokale site en response-bodybytes, zonder HTTP-headers, externe kaarttiles of unpkg-verkeer. Het zijn geen Netlify-factuurmetingen.

| Meting | Voor | Na |
| --- | ---: | ---: |
| Gepubliceerde bestanden, opgeschoonde build | 82.413.876 B | 81.734.332 B |
| Alle JavaScript, ongecomprimeerd | 3.097.831 B | 3.099.459 B |
| Alle JavaScript, gzip | 823.403 B | 824.729 B |
| Alle CSS, ongecomprimeerd | 367.697 B | 383.303 B |
| Wereldkaart | 2.977.727 B | 2.210.962 B |
| Hoofd-JSbestand | 307.146 B | 112.842 B |
| Afzonderlijk React-vendorbestand | inbegrepen | 193.858 B |
| Startscherm, lokale requests | 14 | 15 |
| Startscherm, response-bodybytes | 3.391.637 B | 2.631.336 B |
| Start → bakkerij → voedingslijst, cumulatieve requests | 76 | 76 |
| Dezelfde route, response-bodybytes | 5.202.524 B | 4.442.420 B |
| Daarna: topografie Nederland → werkblad → toets, extra requests | 31 | 28 |
| Dezelfde topografieroute, GeoJSON-requests | 5 | 3 |
| Dezelfde topografieroute, response-bodybytes | 1.428.001 B | 1.428.173 B |

De hoeveelheid lokaal gepubliceerde CSS neemt toe doordat Leaflet-CSS nu lokaal staat in plaats van op unpkg. De totale JavaScriptomvang blijft nagenoeg gelijk.

Tijdens de eindcontrole stonden er ook 34 byte-identieke bestanden met een suffix ` 2` in de gegenereerde `dist`-map. Die overbodige buildkopieën zijn verwijderd (4.614.223 bytes), uitsluitend waar het originele bestand identiek aanwezig was. Alle bestanden waarnaar het buildmanifest verwijst zijn daarna gecontroleerd. Bronbestanden met vergelijkbare namen zijn niet aangeraakt. Deze incidentele opschoning is niet als structurele browserbesparing meegerekend.

Het extra startrequest is het afzonderlijke React-bestand. De initiële JS-overdracht blijft daardoor ongeveer gelijk; de kleinere hoofdchunk is geen besparing van 194 kB aan totale initiële JavaScript. De netwerkbesparing op de startpagina komt voornamelijk van de kleinere kaart.

De twee verdwenen GeoJSON-aanvragen waren in deze route voorheen `304`-antwoorden. Hun responsebody was dus al leeg. Minder requests is hier gemeten; een grote extra bandbreedtebesparing in deze specifieke route is niet gemeten.

De desktopvoedingslijst laadt ook met native lazy loading alle 21 producten, doordat ze binnen de vooruitlaadgrens van de browser vallen. Op een langere lijst of mobiel kan meer worden uitgesteld, maar daar wordt geen ongefundeerd besparingsgetal voor opgegeven.

Volledige buildgroottes, gecomprimeerde totalen en meetsnapshots staan in `netlify-optimization-measurements.json`.

## Controle en beperkingen

- **407 tests geslaagd**, inclusief deduplicatie, delen van lopende aanvragen, opnieuw proberen na HTTP-/JSON-fouten en het cachebeleid.
- **Typecheck en production build geslaagd.** De waarschuwing voor de grote, afzonderlijk geladen Phaser-engine blijft staan; geen spelengine vervangen.
- **630 rasterbestanden** in `public` gecontroleerd: geen beschadigde bestanden. De nieuwe wereldkaart is pixel voor pixel identiek. Bestaande transparante assets zijn niet opnieuw gecodeerd.
- Startscherm, voedingsmiddelen, kaart, werkblad en toets geopend in de lokale production build. Zichtbare afbeeldingen laden. De Europese context en werkbladgeometrie blijven aanwezig.
- De opslag- en beloningsregressietests blijven groen. Geen opslagmigratie of wijziging van de spelregels uitgevoerd.
- Aanvullende mobiele browsermeting **niet afgerond**: automatische goedkeuringscontrole blokkeerde het openen van de aparte mobiele testorigin wegens een gebruikslimiet. Dit is geen geslaagde mobiele eindcontrole.
- Een afzonderlijke browsermeting van een herhaalbezoek is daardoor ook niet uitgevoerd. Langetermijneffecten van de browsercache zijn verwachte werking, geen gemeten creditsbesparing.

## Aangepaste bestanden

- Build/cache: `vite.config.ts`, `scripts/netlifyCacheHeaders.ts`, `netlify.toml`.
- Startpagina/CSS: `index.html`, `index.tsx`, `platform/dreamworld.ts`.
- Kaartasset: `assets/world-map-v2.webp`; oorspronkelijke `public/dreamworld/world-map-v2.png` verplaatst naar `source-assets/world-map-v2.png`.
- Netwerk: `services/staticJson.ts`, `components/InteractiveMap.tsx`, `components/ToetsGame.tsx`, `components/ProvincesGame.tsx`, `components/topography/worksheetGeometry.ts`, `src/lib/geojson/loadDutchProvinces.ts`.
- Afbeeldingen: `components/ui/CardGrid.tsx`, `components/cooking/CookingAssetImage.tsx`, `components/cooking/RecipeCard.tsx`, `pages/ShopScreen.tsx`, `data/cooking/catalog.ts`.
- Kaartdata: `public/data/geojson/nl-provincies-2026.geojson`.
- Tests: `tests/networkOptimizations.test.ts`, `tests/index.test.ts`, `tests/dreamworld.test.tsx`, `tests/worldArchitecture.test.tsx`.
- Documentatie: `docs/dreamworld-handoff.md`, dit rapport en het meetbestand.

Bestaande lokale wijzigingen zijn behouden. Deze lijst beschrijft deze optimalisatieronde, niet alle reeds aanwezige wijzigingen in de werkmap.

## Verwachte impact en vervolg

- **Bandwidth:** minder gegevens bij een eerste bezoek door de kleinere wereldkaart. Gehashte bestanden kunnen bij herhaalbezoeken zonder hernieuwde download worden gebruikt. De uiteindelijke besparing hangt af van bezoekpatronen, browsercaches en deployments.
- **Web requests:** minder herhaalde kaartaanvragen binnen een app-sessie. Vendor-splitsing voegt bij de eerste paginalading één request toe. Het effect is dus niet op iedere route een afname.
- **Production deploys:** geen kostenbesparing geclaimd. Het aantal handmatige production deployments bepaalt dit deel; bundel goedgekeurde wijzigingen per release.
- **AI inference/compute:** geen concrete CocoKiki-oorzaak aangetoond en geen besparing geclaimd. Controleer de uitsplitsing per project en de categorieën Agent Runners/AI Gateway in Netlify, zonder automatische AI-reparaties aan te zetten.
- **Resterend:** mobiele controle en herhaalbezoek meten; na een handmatige deployment headers/rewrite controleren; daarna eventueel zichtbare, grote library-assets afzonderlijk optimaliseren. Grote ongebruikte achtergronden en bronbladen zijn niet blind verwijderd. Een bredere versiebeheerstrategie voor alle library-afbeeldingen is een aparte afweging, geen ongeautoriseerde architectuurwijziging.

Bronnen: [Netlify caching](https://docs.netlify.com/build/caching/caching-overview/), [custom headers](https://docs.netlify.com/manage/routing/headers/), [prijzen AI-features](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/pricing-for-ai-features/), [Vite imports en code splitting](https://vite.dev/guide/features).
