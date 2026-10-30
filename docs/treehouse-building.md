# Boomhut bouwen: steun

Het modulaire overzicht is beschikbaar op `/treehouse`. De gratis startset
bestaat uit woonkamer, keuken, badkamer, slaapkamer en terras. Klikken op
het kamericoon opent de bestaande ingerichte kamer. De ene plusknop bij het
huis starten een uitbreiding. Kamers zijn direct sleepbaar; klikken op de
kamerconstructie of het icoon opent de kamer. Binnen de kamer staan een
lokale rugzak voor inrichten en, bij gekochte kamers, een verkoopknop.
De rugzak staat ook in de meubelwinkel, niet in het hoofd- of profielmenu.
Er is geen aparte bouwstand.
De compacte zoomknoppen staan rechtsonder. Herstellen is alleen actief
wanneer de zoom afwijkt van de passende beginweergave.
Op mobiel is de beginweergave gebaseerd op kamers van circa 190 pixels
breed, begrensd door de beschikbare hoogte. Het overzicht kan daardoor
horizontaal schuiven. Herstellen zet ook een verschoven overzicht terug.

De plus opent de bouwshop met de tabbladen Kamers en Daken. Kamerkeuzes
tonen hun module-afbeelding en prijs. De tweede stap biedt een naam en
twaalf kamericonen. Indeling en iconen worden opgeslagen
in `cocokiki:treehouse-layout:v1`; inrichting en kookvoortgang blijven in
hun bestaande documenten. Eerder gekochte kamers verschijnen automatisch.
De proefopstelling wordt niet als gratis eigendom overgenomen. De gekozen
naam en het icoon worden ook atomair bij het aankoopbewijs opgeslagen,
zodat ze behouden blijven als alleen het opslaan van de indeling mislukt.

Binnenkamers beginnen bij 150 CocoCoins, buitenkamers bij 100. Iedere
volgende kamer in dezelfde groep kost 100 meer; de eerste oude prijzen
blijven gelijk. Het raster heeft maximaal zestien kamers (vijf startkamers
en elf uitbreidingen), mits de gekozen module een verbonden vrije plek
heeft. De service controleert dit voor er geld wordt afgeschreven.
De tuinkamer heeft een toeslag van 150 CocoCoins en begint dus bij 250.
Die toeslag geldt alleen voor nieuwe aankopen; verkoop rekent altijd met
het oorspronkelijke aankoopbewijs.

Het klassieke dak is gratis. Een blauw dak kost 80 CocoCoins, een
bloemendak 100. Daken worden per kamer gekocht en bewaard in
`cocokiki:treehouse-roofs:v1`. Een eerder voor die kamer gekocht dak kan
gratis opnieuw geplaatst worden. Het dak beweegt mee met de kamer en
wordt tijdelijk niet getekend als er een kamer boven staat. De tuinkamer
heeft een ingebouwd dak en blijft bovenaan open.

Alleen gekochte uitbreidingen kunnen verkocht worden, voor 70 procent van
de betaalde prijs volgens het aankoopbewijs. Verkoop bewaart meubels in de
opslag en verwerkt eigendom, plaatsingen, indeling en munten atomair.
Gekochte dakvarianten worden daarbij eveneens voor 70 procent vergoed en
uit het eigendom verwijderd; gratis daken leveren geen geld op.
De vijf startkamers kunnen verplaatst, maar niet verkocht worden.

De lege badkamerillustratie wordt bij de startbadkamer, uitbreidingen en
in het bouwshopje gebruikt; de eerder ingerichte variant is vervangen.
De tuinkamer en roze kamer zijn afzonderlijk te koop. De iconen gebruiken voorlopig
Lucide; het generatiebrief staat in `room-icon-generation-prompt.md`.

Kamers en terrassen vormen de betaalde uitbreidingen van het echte huis.
Benodigde boomstammen en boomtoppen groeien gratis mee. Er is geen aparte
aankoop, muntinhouding of eigendomsregistratie voor deze constructie.

In de proefopstelling kost ook het toevoegen van kamers geen munten. Deze
proef staat los van de echte aankopen en inrichting.

Per bezette bouwkolom wordt één stam met één bladerkroon afgeleid. Stapelen
voegt geen dubbele boom toe. Een boom verdwijnt uit de weergave zodra zijn
kolom leeg raakt. Kamers moeten onderling verbonden blijven en boven een
terras of tuinkamer blijft het open. De diagonale steunbalken worden niet meer gebruikt.
