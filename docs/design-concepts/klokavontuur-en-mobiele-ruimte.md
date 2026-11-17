# Klokavontuur en mobiele ruimte — 16 november 2026

Kloklezen opent direct met wijzers zetten. Na een afgeronde ronde kan het kind verder naar herkennen en vervolgens memory. Andere spelvorm slaat de huidige ronde over zonder beloning; niveaukeuze blijft binnen de sessie behouden. De bestaande beloningen en afgeronde niveaus worden hergebruikt.

De SVG-klok ondersteunt slepen met pointer capture en heeft zichtbare grijppunten. De knoppen blijven als toetsenbordalternatief. De optionele tijdlijn toont hele en halve uren als ankers, met sprongen vooruit en terug; bediening verandert dezelfde klok. De tijdlijn onthult niet het doelantwoord. Alleen expliciet Toon de gevraagde tijd markeert de opgave als geholpen.

Op reis met Seb gebruikt de bestaande wereldklok als vrije verkenning. Steden tonen hetzelfde moment met lokale kloktijd, datum en dagdeel. Tijd vooruit/terug verschuiven beweegt alle klokken tegelijk. De oude losse wereldtijdvragen blijven als bestaande component behouden, maar vormen geen vierde verplichte spelkeuze.

De tuinstatus heeft een eigen rij onder de appnavigatie. Volgende tuindag zit in de statusknop en blijft geblokkeerd zolang planten verzorging nodig hebben. Het compacte saldo krijgt eigen breedte voor munt en bedrag.

Alle winkels laden de gedeelde productlayout, ook bij rechtstreeks openen van meubel- en plantenwinkels. De catalogus krijgt de beschikbare schermhoogte, met grotere productvakken en rustig vrij scrollen zonder geforceerde rijsprongen.

Didactische achtergrond: Nederlandse kloktaal gebruikt hele en halve uren als referentie. De beschrijving van de ouder lijkt op een tijdlijn met sprongen; dit is een interpretatie, niet een vaststelling van de schoolmethode. Zie SLO, Klokkijken en tijd: https://www.slo.nl/publish/pages/9621/katern_klokkijken_en_tijd.pdf.

## Vaste niveau-ingang

`components/ui/NiveauKnop.tsx` is de gedeelde niveauknop: een hersenicoon met klein huidig niveau, voldoende raakvlak en een volledige voorleesnaam. Hij staat in de rechter gereedschapsbalk bij moestuin, rekenen (inclusief redactiesommen), Winkelgekte, Baby Lua en kloklezen. Niveau staat niet meer als losse actie in de statusbalk. De bestaande rekenniveaupanelen blijven behouden; tuin en klok gebruiken hetzelfde rechter hulppaneelpatroon via `NiveauKeuze`.
