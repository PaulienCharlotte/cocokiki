# CocoKiki backlog

Laatst bijgewerkt: 31 oktober 2026

De volgorde hieronder volgt de afhankelijkheden: eerst gedeelde structuur, daarna de visuele basis, vervolgens merkonderdelen en ten slotte het interactieve spelmaatje.

## 1. Navigatie

- [x] Vereenvoudig de header binnen spellen tot één homeknop.
  - De afzonderlijke knoppen `Boomhut` en `Spellen` zijn vervangen door één knop `Home`.
  - De knop keert terug naar de centrale boomhut-homepage (`/`).
  - Het merk links is niet langer een tweede, verborgen homeknop.
  - De knop heeft een toegankelijke naam en een aanraakvlak van minimaal 44 pixels.

## 2. Visuele basis en stijlgids

- [x] Bepaal de eerste gedeelde CocoKiki-interfacebasis.
  - Leg kleur, typografie, oppervlakken, witruimte, randen, schaduwen en beweging vast.
  - Houd rekening met desktop, tablet en mobiel.
  - Werk de regels en componentvoorbeelden bij in `docs/cocokiki-style-skill/SKILL.md`.

- [x] Moderniseer de actieve pop-ups, menuvensters en resultaatdialogen volgens de nieuwe stijl.
  - Gebruik een lichtere, rustigere uitstraling met consistente witruimte en uitlijning.
  - Controleer verticale en horizontale centrering op desktop, tablet en mobiel.
  - Maak knoppen, velden, focusstaten en afsluitacties overal consistent.
  - Controleer daarna Topo en Red Baby Lua op afwijkingen van de stijlgids.

## 3. Merk en spelidentiteit

- [ ] Ontwerp een nieuw overkoepelend CocoKiki-logo.
  - Maak per spel een herkenbaar sublogo dat duidelijk bij het hoofdmerk hoort.
  - Leg vaste regels vast voor kleur, vorm, typografie en gebruik van hoofd- en sublogo's.
  - Vervang de huidige tijdelijke kompasbranding pas nadat de complete set is goedgekeurd.

## 4. CocoCoins

- [ ] Geef CocoCoins een eigen visuele identiteit die aansluit op het definitieve merk.
  - Ontwerp een herkenbare munt die niet hetzelfde beeld gebruikt als het CocoKiki-logo.
  - Gebruik hetzelfde muntbeeld en dezelfde benaming in de header, spellen, beloningen en resultaten.
  - Behoud de bestaande gedeelde valuta en opgeslagen saldi.

## 5. Spelmaatje Kiki

- [ ] Ontwerp Kiki binnen de definitieve CocoKiki-stijl.
  - Bepaal uiterlijk, poses, toestanden en gedrag voordat de interface wordt gebouwd.
  - Leg vast welke hulp Kiki per scherm kan bieden.

- [ ] Implementeer Kiki als vaste hulpavatar.
  - Kiki blijft rechtsonder zichtbaar op de homepage en in alle spellen.
  - Kiki biedt op verzoek contextuele, kindvriendelijke hulp.
  - Kiki mag spelbediening of belangrijke inhoud niet afdekken, ook niet op mobiel en tablet.
  - Voeg pas later AI-functionaliteit toe als daar een duidelijke en veilige rol voor is.

## 6. Gepersonaliseerde Memory

- [ ] Voeg een interessekeuze toe aan Memory.
  - Laat kinderen kiezen uit bijvoorbeeld voedingsmiddelen, geschiedenis, aardrijkskunde en economie.
  - Koppel iedere plaats per interessegebied aan een passend, controleerbaar weetje.
  - Gebruik dezelfde plaatsenset en spelregels; alleen het type weetje verandert.
  - Laat de definitieve weetjes per interessegebied eerst inhoudelijk samenstellen en controleren voordat ze in het spel komen.
  - Bewaar de gekozen interesse lokaal, maar bied altijd een neutrale standaardset met algemene aardrijkskundige weetjes.

## 7. Privacy en analytics - uitgesteld

Besluit van 31 oktober 2026: pas hervatten als CocoKiki serieuzer wordt.
De huidige concept-privacypagina en nieuwe analyticscode niet publiceren.
Geen persoonlijke beheerdergegevens openbaar maken zonder afzonderlijke
goedkeuring. Analytics uit laten; geen deployment of databasewijziging uitvoeren
op basis van deze backlog. De Supabase-serverfunctie is al gedeployed, maar
staat uit. De privacypagina is lokaal bereikbaar op `/privacy`.

Resterende acties, in deze volgorde:

1. [ ] Bij hervatting eerst de werkelijke live status opnieuw controleren:
   activatievlaggen, gepubliceerde code, toegangsrechten en eventuele Cron-taak.
   De verwijdermigratie is voorbereid, maar uitvoering en actieve planning zijn
   niet bevestigd; niet aannemen dat de bewaartermijn al wordt gehandhaafd.
2. [ ] Bepalen welke beheerder- en contactgegevens noodzakelijk zijn en hoe
   privacyvragen kunnen worden afgehandeld met zo weinig mogelijk publieke
   persoonsgegevens. Geen KvK-inschrijving of bedrijfsgegevens veronderstellen.
   Daarna pas het privacyconcept afronden, inclusief grondslag, belangen van
   kinderen, eventuele toestemming en beoordeling van de DPIA-noodzaak.
3. [ ] Open leveranciers- en beveiligingspunten afronden: Netlify/Supabase-logs
   en back-ups, Esri/unpkg, regio, doorgiften en afspraken waar nodig;
   beheerderstoegang beperken en MFA controleren. Deze controles zijn nog niet
   volledig afgerond.
4. [ ] Na vaststelling van de termijn de voorbereide verwijdermigratie
   `supabase/migrations/202610310002_activity_events_retention.sql` uitvoeren.
   Eerst in een testproject de SQL-integratietest draaien; daarna de dagelijkse
   planning, historie, verwijdergrens en behouden RLS-rechten controleren.
   De SQL is geimplementeerd als bestand, niet op Supabase getest.
5. [ ] End-to-end testen met synthetische events: succesvolle opslag,
   ontdubbeling, limiet van 120 nieuwe events per minuut, toegangsweigering,
   netwerkuitval en verwijdering. Lokale applicatietests/build zijn eerder
   geslaagd; succesvolle live ingestie en automatische verwijdering zijn nog
   niet bevestigd. Publicatie en activatie pas na afzonderlijke goedkeuring.

Uitwerking: `docs/privacy-activation-checklist.md` en
`docs/supabase-analytics.md`. Deze documenten en de privacypagina bevatten nog
open TODO's en zijn geen juridische vrijgave.
