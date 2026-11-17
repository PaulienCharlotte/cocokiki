# Ontdekwerelden en opdrachten

## Verdeling

- Alle zelfstandige spellen zijn bereikbaar via de gameknop in het hoofdmenu.
- Taartversieren wordt aangeboden via opdrachten. Plantendokter heeft zowel een verzoek op To Do als een directe ingang op planteneiland; beide openen hetzelfde spreekuur. Bestaande diepe routes blijven werken.
- To Do is de ingang voor verzoeken van bewoners en betaalde opdrachten.
- Huisjes zijn omgevingen om kennis te ontdekken en bestaande projecten voort te zetten. Er staat geen tweede spellenraster.
- De encyclopedie ordent bestaande ontdekkingen per eiland. Een voorwerp en de encyclopedie gebruiken dezelfde kennis en voortgang.
- Personages verschijnen bij een ontmoeting, opdracht of hint. De kookstudio en kas hebben een achtergrond zonder personage.
- Ouders die eigen huiswerk uploaden vallen buiten deze wijziging.

## Vast format voor nieuwe opdrachten

Beschrijf vóór implementatie:

1. Opdrachtgever en eiland: wie heeft een wens en waar hoort deze thuis?
2. Aanleiding en resultaat: wat wil de bewoner, en wat heeft het kind aan het einde gemaakt of opgelost?
3. Stappen: elke activiteit is nodig om dat resultaat te bereiken.
4. Invoer: concrete plaatsen, ingrediënten, hoeveelheden of vragen; variatie blijft binnen de mogelijkheden van het aangesloten spel.
5. Hulp: wat kan het kind proberen als iets niet lukt? Geen straf of verlies van voortgang.
6. Bewijs van afronding: de oorspronkelijke activiteit levert opgeslagen voortgang, geen vlag uit de URL of een klik op een knop.
7. Beloning: vooraf vastgelegd, eenmaal uitgekeerd volgens de bestaande beloningsadministratie.
8. Blijvend resultaat: wat wordt zichtbaar in de wereld of encyclopedie? Herhaling maakt geen dubbele ontdekking.
9. Hervatten: waar gaat het kind verder nadat het de opdracht heeft onderbroken?

Begin met drie formaten: een bestelling uitvoeren, een probleem onderzoeken en een plan uitvoeren. Gebruik de bestaande AdventureDefinition en adapters; geen tweede opdrachtenmachine. Sluit nieuwe activiteiten één voor één aan en toets hergebruik met twee verschillende werelden.

## Eerste uitvoering

De nieuwe voorwerpen staan centraal in `platform/discoveryRooms.ts`. Bestaande recepten, plantenkennis, oogst, taarten en projectvoortgang blijven de bron. Het reisboek leidt ontdekte plekken af van correcte antwoorden in de bestaande topografievoortgang. Alleen een kaart bekijken telt niet als correcte beantwoording.

Lua’s werkplaats verwijst voorlopig naar het bestaande inrichtingsproject en afgeronde projecten. Een nieuwe bouwwereld en nieuwe samengestelde reisverhalen zijn hiermee nog niet gebouwd. De bestaande projectnaam Luna blijft behouden; Lua is de bewoner van de werkplaats.

Op kleine schermen is de omgeving horizontaal verkenbaar. De afbeelding en voorwerpen houden hun onderlinge positie; de terugknop, het hoofdmenu, het naambord en gereedschap blijven staan. De bestaande dialoog verzorgt de uitleg bij een voorwerp. Dit is een bewuste aanpassing op het oude wereldscherm met personage en keuzekaarten, op verzoek van de gebruiker.
