# Ontwerp: extra kamers en balkonuitbreiding

Status: de vier PNG's zijn aangeleverd en geintegreerd. Binnenkamers en
balkonzones zijn via de plusbediening te kopen. De binnenkamerprijzen zijn
150/250/350; de afzonderlijk goedgekeurde balkonprijzen zijn 100/200 CocoCoins.
De uitwerking van nieuwe plantenlessen hieronder blijft een vervolgonderdeel.

## Uitvoering

- Vaste gratis kamers en hun inrichting blijven behouden. Nieuwe kamers krijgen
  een eigen stabiel ruimteslot (extra-1 t/m extra-5), template en gekozen naam.
  Twee kamers met hetzelfde template blijven afzonderlijk in te richten.
- Kamerbezit en afschrijving worden in dezelfde wallettransactie opgeslagen.
  Dubbele aankoop-ID's betalen niet opnieuw; onvoldoende saldo of een mislukte
  opslag levert geen kamer en geen afschrijving op. Corrupte eigendomsgegevens
  blokkeren nieuwe aankopen in plaats van bestaand bezit te overschrijven.
- Opgeslagen plaatsingen blijven bewaard, ook als een eigendomsdocument tijdelijk
  niet leesbaar is. Niet-gekochte kamer-URL's tonen geen toegankelijke inrichting.
- De kamerrij en pijlen lopen langs slaapkamer, woonkamer, keuken, extra
  binnenkamers, terras en balkonzones. Pijlen verplaatsen eerst de zichtbare
  uitsnede; aan de rand gaat de volgende klik naar de buurkamer. Binnenkomst is
  aan de aansluitende kant. Meubels slepen wisselt nooit vanzelf van kamer.
- Slepen gebruikt een live voorvertoning met behoud van het aangrijppunt en
  slaat pas bij loslaten op. Annuleren of verloren pointer capture bewaart de
  oude positie. Aan de schermrand schuift de kamer mee.
- Een geselecteerd meubel kan met pijltjestoetsen worden verplaatst: normaal
  0,5 procentpunt, Shift 2, Alt 0,1. Invoer in formulieren wordt niet overgenomen.
  De icoonknoppen Naar voren/Naar achteren bewaren de dieptelaag apart van de
  vloerpositie. Selecteren verandert niet langer de zichtbare stapelvolgorde.
- De meubelwerkbalk staat los van de ruimtelaag, zodat gereedschap niet achter
  andere meubels verdwijnt. De actieve kamertab blijft op mobiel in beeld.

## Minimalistische bediening

- Behoud de vier bestaande kamers en Mijn Planten.
- Het bestaande terras wordt het basisbalkon: dezelfde ruimte, hetzelfde bezit
  en dezelfde opgeslagen inrichting. Maak hiervoor geen tweede gratis kopie.
- Voeg een enkele ronde plusknop toe aan het boomhutoverzicht, met toegankelijke
  naam 'Ruimte toevoegen'. Deze biedt ook de kweekhoek en kas aan.
- De plus opent een compact wit venster: achtergrond kiezen, kamernaam en
  prijs. Een duidelijke bevestiging; bij onvoldoende saldo geen afschrijving.
- Er is geen navigatiebalk onderin kamers. Via de pijlen loop je tussen kamers;
  op kleine schermen schuiven die eerst naar de rand van de huidige kamer.
- In een kamer blijven inrichten, meubels draaien en planten verzorgen gelijk.
- Zet geen nieuwe getekende kamer willekeurig boven op de bestaande doorsnede.
  De huidige doorsnede heeft vier vaste kamers. Voor werkelijk zichtbare groei
  zijn losse aanbouwmodules of een nieuwe uitbreidbare doorsnede nodig.

## Prijsvoorstel in CocoCoins

De gebruiker bedoelt de kosten in CocoCoins, niet ontwikkelkosten in euro's.
Goedgekeurd: eerste extra kamer 150, tweede 250, derde 350 CocoCoins. De bestaande
kamers blijven gratis. Een aankoop is permanent; geen huur of onderhoudskosten.
De huidige winkelrace betaalt maximaal 50 munten per dag, andere activiteiten
betalen ook beloningen. Dit maakt sparen mogelijk zonder een nieuwe muntsoort.
Voor het vastzetten van prijzen moeten speeltijd en inkomsten in de praktijk
worden bekeken. Het gaat uitsluitend om spelmunten, niet om echte eurobetalingen.

## Technisch fundament

- Scheid kamertemplates van gekochte kamerinstanties. Een template bevat
  achtergrond, icoon, plaatsingsgebied en optionele overzichtspositie.
- Geef iedere nieuwe kamer een stabiel instance-ID. Meubels, naam en planten
  horen bij dat ID, niet alleen bij het type 'slaapkamer'. Zo zijn twee
  slaapkamers echt afzonderlijk in te richten.
- Migreer de bestaande vier room-ID's naar vaste gratis instanties, zonder
  meubels, voorraad, plant-ID's of opgeslagen posities te verplaatsen.
- Breid de bestaande inventaris en routes uit met instance-ID's. Geen tweede
  los inventarissysteem. Productvoorraad blijft gedeeld over alle kamers.
- Bewaar bezit en de afschrijving in een enkele commitLocalState-transactie,
  met een uniek aankoop-ID. Dubbel tikken of opnieuw laden mag nooit dubbel
  afschrijven. Een mislukte opslag mag ook geen kamer of saldo wijzigen.
- Kamer verwijderen is geen MVP-functie; later hoogstens archiveren waarbij
  decor en planten behouden blijven. Begin met maximaal drie extra binnenkamers.
  Balkonuitbreidingen hebben een eigen limiet en tellen niet als binnenkamer.
- Behoud de bestaande lokale opslag. Cloudsync en herstel op een ander apparaat
  zijn een apart besluit; nieuwe kamers zijn zonder account niet automatisch
  op andere apparaten aanwezig.

## Uitbreidbaar balkon en plantenmodule

### Ruimte en navigatie

- Behoud het basisbalkon met bestaande planten en meubels. Uitbreidingen
  staan bij de andere ruimtes achter de plus in het boomhutoverzicht.
- Voeg aparte zones toe in plaats van een steeds breder, volgepakt canvas.
  Voorstel voor de eerste twee uitbreidingen: een kweekhoek en een kas.
- Kweekhoek en kas zijn via de looppijlen bereikbaar, net als de andere kamers.
  Geen aparte tabrij of tweede plus. De balkonprijzen blijven 100/200 CocoCoins.
- Elke zone past in een normaal scherm en krijgt een eigen achtergrond en
  inrichting. Geen horizontaal slepen over een enorme illustratie om een
  plant terug te vinden. Houd de bediening gelijk op mobiel en desktop.
- Mijn Planten blijft het centrale overzicht van alle eigen planten, met een
  locatie per plant. Een plant vanuit dat overzicht openen kan rechtstreeks
  naar de juiste kamer of balkonzone leiden.

### Leren zonder betaalmuur

- Houd de basis van de plantenmodule bereikbaar vanaf het bestaande balkon:
  soorten herkennen, plantkaarten bekijken en de eigen planten verzorgen.
  Meer ruimte kopen is geen voorwaarde om deze kennis te kunnen leren.
- Bouw leeractiviteiten los van gekochte vierkante meters. Mogelijke thema's:
  zaaien en groei, licht en schaduw, water, wortels, bloemen en bestuiving.
  De precieze lesinhoud en activiteiten krijgen een aparte module-uitwerking.
- Uitbreidingen geven extra plek en een ander soort inrichting, niet een
  tweede kopie van reeds behaalde kennis of dezelfde plantencollectie.
- Behoud het bestaande vriendelijke verzorgingsmodel: planten gaan niet dood.
  Geen huur, terugkerende muntkosten of verplichte dagelijkse verzorging om
  een gekochte zone te behouden.

### Aankoop, bezit en opslag

- Een balkonzone is een eigen ruimte-instantie onder dezelfde balkongroep,
  met een stabiel instance-ID en een zone-template. Gebruik dezelfde
  aankooptransactie en gedeelde inventaris als bij binnenkamers.
- Leg per template vast dat het om binnenruimte of buitenruimte gaat en welke
  plaatsingsgebieden beschikbaar zijn. Maak latere leerfuncties configureerbaar
  in plaats van ze aan een achtergrondbestandsnaam te koppelen.
- Een eigen plant behoudt zijn plant-ID, bijnaam, verzorging en leerhistorie
  bij verplaatsen. Koppel de plaatsing aan die bestaande plant; kopieer de
  plant niet bij het openen of kopen van een nieuwe zone.
- Migreer bestaande terrasplaatsingen zonder nieuwe afschrijving. Eerder
  gekochte planten en meubels blijven eigendom en inzetbaar.
- Kamerprijzen 150/250/350 gelden voor de drie binnenkamers. De eerste
  balkonuitbreiding kost 100 en de tweede 200, onafhankelijk van de gekozen zone.
  Balkonuitbreidingen verhogen de prijsvolgorde van binnenkamers niet.

## Benodigde beelden

Voor een eerste versie zijn twee lege interieurs voldoende, bijvoorbeeld een
hobbykamer en een extra slaapkamer. Per template:

- Een lege achtergrond, bij voorkeur 2560 x 1600, PNG of hoge kwaliteit WebP.
  Dezelfde ooghoogte, vloer/wandverhouding en natuurlijke stijl als de bestaande
  kamers. Geen tekst, knoppen, personages of losse meubels ingebakken.
- Een duidelijke vrije vloerzone en rustige wand waarop bestaande decoratie
  kan worden geplaatst. Belangrijke ramen/deuren niet tegen de buitenrand;
  mobiel snijdt de achtergrond anders bij dan desktop.
- Optioneel een transparant kamericoon van circa 512 x 512. Een bestaande
  generieke kamervoorstelling kan tijdelijk worden hergebruikt.
- Alleen voor zichtbare uitbouw: losse transparante buitenkant-/doorsnedemodules,
  met vaste aansluitpunten en schaal, of een apart uitbreidbaar overzicht.

We kunnen de aankoop, opslag en navigatie eerst met bestaande achtergronden
opzetten. Daarna zijn nieuwe templates toe te voegen zonder aankooplogica
of inventaris te herschrijven.

### Beelden voor het balkon

- Het bestaande terrasbeeld kan eerst het basisbalkon blijven.
- Voor de uitbreidingen: een lege kweekhoek en een lege kas, elk bij voorkeur
  2560 x 1600 PNG, met dezelfde ooghoogte, schaal en natuurlijke stijl als
  het bestaande terras. Een aparte zone is belangrijker dan een extra brede PNG.
- Houd voldoende vrije vloer en rustige wand/achtergrond over. Geen losse
  planten, tekst, knoppen, personages of verplaatsbare meubels inbakken.
  Vaste railing, kasconstructie en uitzicht mogen wel in de achtergrond zitten.
- Lege kweekbakken, potten en een werktafel zijn later bij voorkeur losse
  transparante PNG's als kinderen deze zelf moeten kunnen plaatsen.
- Alleen als de uitbouw ook zichtbaar op de boomhutdoorsnede moet groeien,
  zijn transparante buitenmodules nodig. Dat is niet vereist voor de eerste
  versie met zones en een minimale plusknop.

## Toetsing voor bouwen

Test nul/onvoldoende/exact saldo, dubbel tikken, mislukte opslag, herladen,
oude vier kamers, twee instanties van hetzelfde template, meubels verplaatsen
tussen kamers en behoud van planten. Controleer desktop en 375px mobiel.
Test daarnaast behoud van bestaande terrasplaatsingen, de onafhankelijke
prijsvolgorde van kamer- en balkonuitbreidingen, verplaatsen van een plant
zonder duplicatie, locatieverwijzingen vanuit Mijn Planten en toegang tot de
basisleeractiviteiten zonder gekochte uitbreiding.
