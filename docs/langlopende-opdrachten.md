# Voorstel: opdrachten met een groter verhaal

Status: Luna’s babykamer is de eerste speelbare pilot (zie hieronder). De gekoppelde moestuin-kookmissie is nog een concept. Winkelgekte staat als ingang in het opdrachtenoverzicht en gebruikt zijn bestaande spelregels en beloningen.

## Een maaltijd voor de buurt

Coco wil voor een groep koken. Het kind kiest samen met Kiki wat in de moestuin komt. Eén actieve stap tegelijk:

1. Kies een recept en reken het aantal porties om naar het aantal gasten.
2. Maak een lijst: welke ingrediënten kunnen we zelf telen, welke moeten uit de winkel komen?
3. Plan de benodigde oogst met expliciete spelopbrengsten. Toon waar de hoeveelheden vandaan komen; geen echte landbouwopbrengsten beloven.
4. Leg tuinvakken aan, bereken ruimte en meet water. Groei volgt eigen tuindagen; dagen niet spelen kosten niets.
5. Tel de oogst en bereken wat nog ontbreekt. Gebruik de oogst echt in Coco’s voorraad; boek niets dubbel af.
6. Doe boodschappen binnen een gegeven budget, schaal het recept en kook de maaltijd.
7. Lever af en krijg een afsluiting van de gasten, plus een eenmalige missiebeloning.

Op het overzicht staat alleen de volgende stap met een klein voortgangsbeeld. Details en het grotere plan staan achter het klembord. Een kind kan altijd pauzeren of een ander spel spelen.

## Een drukke dag in de winkel

Een klant heeft boodschappen nodig voor een picknick. Begin zonder tijdsdruk met een boodschappenlijst en een budget. Oefen bedragen optellen, vergelijken, gepast betalen en wisselgeld. Winkelgekte kan een vrijwillige oefenstap zijn; een snelheidsscore mag de hele missie niet blokkeren.

## Bouwbasis voor beide missies

- Eén opgeslagen missierun met parameters, gekozen recept, aantal gasten, volgende stap en afgeronde stapbewijzen.
- Elke bestaande spelservice levert een controleerbaar resultaat; een scherm bezoeken telt niet als voltooiing.
- Werkelijke voorraadtransacties en beloningen hebben stabiele run-/stap-id’s, zodat herladen niet dubbel uitbetaalt of verbruikt.
- Houd tussentijdse oefenbeloningen en de afsluitbonus inzichtelijk; een kind hoeft geen geld te verliezen om te mogen oefenen.
- Hulp geeft de aanpak en het antwoord, zonder bonus voor die rekenstap; voortgang gaat verder.
- Schaal moeilijkheid via gasten, eenheden en budget, niet via meer tekst tegelijk.

Voorgestelde eerste pilot: één maaltijd, twee te telen ingrediënten en drie heldere hoofdstukken: plannen → kweken → koken. Eerst deze complete route testen voordat er veel losse verhalen bijkomen.

# Eerste speelbare pilot: Luna’s babykamer — 15 november 2026

De gekozen eerste pilot is Luna’s babykamer, bereikbaar via `/opdrachten/luna-babykamer`. De soepmissie blijft een vervolgidee.

## Leerroute

1. Briefing van Luna: bed links, kast rechts, een vloerlamp en eventueel een boekenkast of leesstoel.
2. 260 cm plafondhoogte omrekenen naar 2,6 m.
3. Muur van 320 cm, bed van 120 cm en kast van 80 cm: 120 cm over.
4. Eigen projectwinkel: bed 180, kast 140, lamp 45, boekenkast 95, stoel 60. Budget 500. Beide extra’s samen overschrijden het budget. Er zijn dus keuzes nodig.
5. Zelf het gekozen mandje optellen.
6. Het restant van 500 berekenen.
7. De bedbreedte van 120 cm omrekenen naar 1,2 m.
8. Plaatsen in Luna’s eigen projectkamer, met controle op de wensen en overlap.
9. Afleveren met een reactie van Luna.

Er zijn vijf rekenvragen. Elke zelfstandig opgeloste vraag geeft 12 CocoCoins direct en nog 8 bij aflevering: maximaal 100. Met hulp wordt de uitwerking plus het antwoord gegeven; die vraag levert zowel direct als bij aflevering nul op. Fouten zijn opnieuw te proberen zonder tijdslimiet. Alleen inrichten of klikken betaalt niet.

## Afgescheiden economie

De 500 projectmunten zijn uitsluitend een budget voor Luna’s project. Ze worden niet bijgeschreven in de persoonlijke portemonnee. Gekochte spullen en het restant zijn van het project; ze komen niet in de persoonlijke inventaris. Persoonlijke CocoCoins worden niet afgeschreven. De eigen boomhut blijft de plek waar verdiende CocoCoins besteed kunnen worden.

Het project is eenmalig te belonen; hervatten en herladen gebruiken dezelfde voortgang en transactie-id’s. Tussentijds stoppen is altijd mogelijk. De oude groene-zithoekbonus voor alleen spullen plaatsen is ingetrokken; eerder ontvangen munten blijven behouden.

## Eerste balansproef

De 100 CocoCoins zijn een voorstel voor de pilot, gekozen als zichtbare beloning voor vijf rekenstappen en een afgerond project. Na spelen beoordelen we samen duur, hulpgebruik en de meubelprijzen. Verhoog niet blind alle bestaande beloningen: vergelijk verdiende munten per leerstap en de tijd tot een aantrekkelijk boomhutmeubel. De soepmissie kan meer stappen en een hogere totaalbeloning krijgen, op dezelfde meetbare basis.

## Technische basis

`nurseryProject.ts` bewaart revisie, stap, antwoorden, hulp, mandje en projectplaatsingen als eigen document. Beloningen en voortgang slaan samen op. Oude revisies worden geweigerd; aflevering vereist alle rekenstappen en een geldige inrichting. Er worden geen persoonlijke inventaris- of kooptransacties gebruikt. Browseropslag blijft dezelfde technische beperking houden als de bestaande app; meerdere apparaten delen deze voortgang nog niet.

Tests dekken de hele route, projectbudget versus echte munten, overschrijding van het budget, hulp na herladen, een volle opslag, dubbele aflevering, onjuiste antwoorden, verouderde acties en overlappende meubels.

## Inrichten verfijnd — 15 november 2026

Alle gekozen meubels staan direct klaar in de projectkamer. Slepen houdt het aangrijppunt vast, toont beweging per animatieframe en schrijft alleen bij loslaten naar opslag. Pointer-annulering herstelt de vorige positie. Bestaande plaatsingen blijven bewaard. De plus- en minknoppen gebruiken dezelfde grenzen (0,6–3) en stap (0,15) als de boomhut. De overlapcontrole rekent de gekozen schaal mee. Transparante assetmarges worden bij het tonen uitgesneden, zodat de onderkant van het voorwerp op het vloeranker aansluit.

De inrichtstap toont alleen de titel, kamer, contextuele maatknoppen en aflevering. De wens staat achter het vraagteken; pijltjestoetsen blijven beschikbaar voor precies verplaatsen.
