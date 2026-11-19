# CocoKiki backlog

Laatst bijgewerkt: 19 november 2026

De volgorde hieronder volgt de afhankelijkheden: eerst gedeelde structuur, daarna de visuele basis, vervolgens merkonderdelen en ten slotte het interactieve spelmaatje.

## Huisstijl-ombouw en snelheid (19 november 2026)

Lees eerst `docs/OMBOUWPLAN.md` (het plan met de stand per stap) en
`docs/briefing/WENSEN.md` (Charlottes wensen met screenshots). De huisstijl in
`docs/HUISSTIJL.md` en `styles/cocokiki-tokens.css` is leidend. Afgesproken:
gereedschapsbalk **links** (versleepbaar), één terugknop, voortgang als bolletjes,
spraakwolk vast linksonder (`<SpeechBubble vast>`), redactiesom blijft op een schrift.

### Al gedaan (19 november)
- [x] Gedeeld `<SpelScherm>` met de zeven zones + testpagina `/spelscherm-test`.
- [x] Gereedschapsbalk overal links, ook op telefoon, en versleepbaar.
- [x] Oude kleuren in `design-system/tokens.css` verwijzen naar de huisstijl.
- [x] Rekenen: geen losse kleurcodes, bolletjes in plaats van tellers, ruimte voor de balk.
- [x] Menu rechtsboven: munten · winkel · To Do · profiel; de rest in het profielmenu.
- [x] Keuken: spraakwolken vast linksonder; kookavontuur-ontdekken met één terugknop.
- [x] Snelheid: afbeeldingen een week in de browsercache; 98 grote afbeeldingen −31%
  (`npm run afbeeldingen:comprimeer` voor nieuwe plaatjes).

### Nog te doen (op volgorde)
- [ ] **Keuken:** geen pop-ups meer ("Goed ontdekt!", "Coco's kooktip"); reactie in de
  spraakwolk, munten, vanzelf verder. Eerst uitleg, dan de vraag. Wolken max. 2 regels.
- [ ] **Keuken:** fornuis/kookstap zonder gestapelde doorzichtige panelen; één stap
  tegelijk, geen "6/18"-balk. Groenten wassen: één terugknop, wolk onderin.
  Andere kookavontuur-stappen ook één terugknop (`registerBackHandler`).
- [ ] **Moestuin:** grote bakken (2 per rij), plaatje van het gewas in de bak in plaats
  van een afgekapte naam, Kiki onderin, "Tuindag · Lente" als naambord.
- [ ] **Plantendokter:** plant groot in beeld, Kiki onderin, antwoordtegels, bolletjes,
  geen "Ik weet genoeg"-knop.
- [ ] **Topografie:** kaart als speelveld, verzameling in plaats van vinkjeslijst, Seb onderin.
- [ ] **Boodschappen:** tik op ingrediënt in het lijstje = winkel springt naar dat
  product en laat het oplichten; één terugknop; geen tekst over tekst.
- [ ] **Interieur:** voortgangsbolletjes liggen over een label; verplaatsen.
- [ ] **Rekenen:** getekend schrift voor de redactiesom (wacht op asset); lichte tekst op
  de bladenkiezer; statuseiland voor de klok.
- [ ] **Snelheid:** kleinere telefoonversies van de zwaarste achtergronden.
- [ ] **App-breed:** munten naar het statuseiland zodra elk spel `<SpelScherm>` gebruikt;
  `app.css` en `pages/world.css` zonder losse kleurcodes.
- [ ] **Test:** economietest "na een half uur hetzelfde spel…" faalt (181 ≠ 182); al vóór 19 nov.

### Assets die Charlotte laat maken (komen in `_inbox-…`)
- [ ] Moestuin: 6 gewassen × 3 groeistadia (`_inbox-moestuin/`).
- [ ] Rekenen: opengeslagen getekend schrift (`_inbox-rekenen/`).

## Nieuwe klusjes — spelevaring en navigatie (14 november 2026)

Uitgevoerd op 14 november 2026: winkelretour, centraal opdrachtenoverzicht, vijf dagelijkse kennisvragen, compact hoofdmenu en de avatarset inclusief Luna. De reeks gebruikt de bestaande kennisvragen; adaptieve niveaus zijn een mogelijk vervolg. Oudere afgeronde punten beschrijven de situatie van toen.

### Wereldkaart en Lua — toegevoegd op 14 november

- [x] Maak uitzoomen mogelijk naar een complete ronde wereld, met lucht rondom in plaats van rechthoekige afbeeldingsranden.
  - De vijf locaties blijven bereikbaar; daglicht met wolken en een wisselbare nachtweergave met sterren.
  - Behoud zoomen, slepen met ingedrukte klik, pinch en toetsenbordnavigatie.
- [x] Maak Lua's profielportret rechtop en gecentreerd, met behoud van zijn herkenbare uiterlijk.

### Eerst: makkelijk winkelen tijdens het inrichten

- [x] Rechtstreeks van een boomhutkamer naar de meubelwinkel en terug naar dezelfde kamer.
  - Onthoud de kamer en de inrichtmodus als terugkeerbestemming, ook na een aankoop.
  - Behoud de geplaatste meubels en de huidige inrichting.
  - Terug uit de winkel mag niet via het speloverzicht lopen.
  - Controleer ook rechtstreeks geopende winkels: zonder kamercontext werkt de gewone terugroute.

### Eén plek voor opdrachten

- [x] Breng de bak- en plantenopdrachten samen onder ‘Opdrachten’ in het hoofdmenu.
  - Aanleiding: de huidige toonbanken verschillen in presentatie en bediening.
  - Toon opdrachten voor bakken, tuinieren en inrichten met dezelfde schermopbouw; bouw voort op bestaande opdrachtlogica.
  - Voorstel: één centraal overzicht met gebiedsfilters. Een eiland mag een snelkoppeling hebben naar hetzelfde overzicht, al gefilterd op dat eiland. Geen aparte opdrachtvoorraad, voortgang of beloningslogica per ingang.
  - Een gekozen opdracht opent in het juiste gebied; lopende opdrachten zijn terug te vinden en te hervatten.
  - Kies één herkenbaar opdrachtenicoon met toegankelijk label en een korte zichtbare naam bij de eerste kennismaking.
  - Vervang bestaande toonbankingangen pas als de nieuwe route en terugnavigatie werken.

### Vijf dagelijkse oefeningen

- [x] Verplaats het losse dagelijkse quizelement uit de encyclopedie naar een dagelijkse oefenreeks.
  - Wens: vijf oefeningen met een hogere beloning, bijvoorbeeld dubbel.
  - Voorstel: ‘Vandaag’ binnen Opdrachten, zonder extra hoofdmenu-icoon.
  - Houd de encyclopedie gericht op opzoeken en ontdekken.
  - De eerste reeks gebruikt vijf afwisselende planten- en voedingsvragen uit de bestaande kennisbank en is hervatbaar.
  - [ ] Vervolg: maak de dagelijkse kennisvragen aanpasbaar aan het niveau van het kind.
  - Voorstel beloning: 2× de gewone oefenbeloning voor zelfstandig opgeloste oefeningen; de exacte bedragen en hulpregels vooraf vastleggen.
  - Keer de bonus maximaal eenmaal per oefening per dag uit, ook na herladen of via een tweede ingang.
  - Geen inhaalplicht, verloren reeks of straf als een kind een dag overslaat.

### Schaalbare, rustige navigatie

- [x] Herbekijk het hoofdmenu en de snelkoppelingen als één geheel.
  - Voorstel vaste basis: wereld/terug, Opdrachten, winkel met terugkeercontext, muntensaldo en profiel.
  - Voorstel profielmenu: encyclopedie, avatar, instellingen en overige persoonlijke opties. Controleer of kinderen de encyclopedie daar nog makkelijk vinden; een boekicoon is eventueel duidelijker dan verstoppen onder profiel.
  - Plaats gebiedsbediening bij het spel, bijvoorbeeld tuinbediening links. Voeg geen hoofdmenu-icoon toe voor iedere nieuwe functie.
  - Geef dezelfde bestemming altijd hetzelfde icoon en dezelfde naam. Voorkom meerdere terugknoppen met onduidelijke bestemmingen.
  - Toets het voorstel aan drie routes: opdracht kiezen → uitvoeren → beloning; kamer → winkel → dezelfde kamer; spelen → kennis opzoeken → terug.
  - Controleer desktop en 360px, raakvlakken, toetsenbord en herkenbaarheid van iconen.

### Avatars corrigeren en uitbreiden

- [x] Laat de profielavatars van Coco en Kiki overeenkomen met hun daadwerkelijke personages.
  - Controleer de gebruikte afbeeldingen visueel, niet alleen op bestandsnaam; de bestaande bibliotheek bevat afwijkende afbeeldingen en verwisselde namen.
  - Kiki heeft de bekende bruine krullen, niet het blonde haar van de huidige afwijkende profielavatar.
  - Gebruik de echte Coco en Kiki als beeldreferentie en één centrale koppeling voor de avatarselectie en het profielmenu.
  - Behoud bestaande profielkeuzes via een migratie indien ids of paden wijzigen.
- [x] Maak een nieuwe blonde avatar met de naam **Luna**, in dezelfde CocoKiki-stijl.
  - Luna is een eigen profielavatar; houd haar apart van Baby Lua.
  - Genereer een transparant portret met dezelfde uitsnede en schaal als de andere profielavatars; controleer het op klein formaat.
  - Voeg Luna toe aan de bestaande avatarkiezer en test kiezen, opslaan en herladen.

Voorgestelde uitvoervolgorde: winkelretour → navigatie/opdrachtenstructuur → dagelijkse oefeningen. De avatarcorrecties en Luna kunnen als aparte, kleine wijziging worden uitgevoerd.

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

- [ ] Herzie het oude voorstel voor Kiki als vaste hulpavatar vóór uitvoering.
  - De huidige gebiedsafspraken gaan voor: Coco bij koken, Kiki bij planten, Baby Lua bij rekenen en Seb bij topografie. Geen universele Kiki-overlay invoeren op basis van dit oude punt.
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

## Verfijning eilanden en lucht — 14 november 2026

- [x] Verwijder de losse Privacy-link uit de spelomgeving.
- [x] Herstel het planten-klembord als ingang voor opdrachten.
- [x] Zet de eilandkeuzes op desktop in een horizontaal schuifmenu onderin; behoud mobiel.
- [x] Vervang de eenvoudige lucht door geïllustreerde dag- en nachtachtergronden.
- [ ] Verken een vrijwillig gekozen plaats voor actuele weersuggesties en passende buitenactiviteiten. Eerst het concept uitwerken; geen automatische locatievolging toevoegen.

## Opdrachten verder uitbouwen

- [x] Luna’s babykamer als eerste speelbare projectopdracht: meten, een apart budget van 500, meubels kiezen, totaal en wisselgeld berekenen en inrichten.
- [x] Belonen voor zelfstandig rekenwerk en aflevering (maximaal 100 CocoCoins); geholpen stappen betalen niets. De oude plaatsingsbonus is vervallen.
- [x] Het algemene To Do-overzicht een neutrale header geven zonder keuken-klembord.
- [ ] Speeltest Luna: benodigde tijd, begrip van het projectbudget, hulpgebruik en verhouding tot winkelprijzen beoordelen.
- [x] Winkelgekte bereikbaar maken vanuit het opdrachtenoverzicht.
- [ ] Pilot ‘Een maaltijd voor de buurt’: porties plannen → moestuin aanleggen → oogsten → boodschappen → koken → afleveren. Uitwerking: `docs/langlopende-opdrachten.md`.
- [ ] Opgeslagen missieruns en stapbewijzen koppelen aan bestaande spelservices, met eenmalige beloningen en echte voorraadtransacties.

## Speeltestverfijning 14 november, middag

- [x] Saldo in nachtmodus op een helder contrastrijk vlak tonen.
- [x] Plantendokter rechtstreeks op het planteneiland terugzetten, naast opdrachten en moestuin.
- [x] Losse antwoordknoppen uit de bakstudio hergebruiken bij dagelijkse vragen en bakbestellingen.
- [x] Kookboek ontdoen van de opdrachtbanner en de knop voor vrij taart versieren.
- [x] Geluid en meetlint verbergen in Winkelgekte.
- [x] Kas en tuinkamer een leeg houten/glazen interieur geven dat bij de gedeelde kasgevel past.
- [x] Vijf voor vandaag bovenaan uitlichten en de groene zithoek een bestaande bankafbeelding geven.
