# Beloningen bij oefenen

De centrale regel staat in `services/learningReward.ts`: een opgelost antwoord
of gevonden memorypaar levert 2 CocoCoins op. Moeilijkheid, snelheid, combo's,
eerdere fouten en eerder voltooide niveaus veranderen dit niet. Een nieuwe
oefenronde mag opnieuw verdienen; dezelfde uitbetaling nooit tweemaal.

Dit geldt voor topo, vlaggen, klokken, wereldtijden, Baby Lua (beide ingangen),
de overige rekenspellen, plantconsulten en naamvragen. Mandjevragen gebruiken
dezelfde basis, met maximaal het resterende tekort als laatste uitbetaling.
Kassarekenen heeft geen afzonderlijke daglimiet meer.

Een denktip behoudt de beloning. Een antwoordverklapper maakt de betreffende
opdracht onbetaald, ook na sluiten van de tip of doorgaan naar spellen:

- Topo: de aanwijshint markeert het antwoord; 'Toon antwoord' verdient niets.
- Topo-spellen: beginletters zijn een denktip, niet het volledige antwoord.
- Zet de klok: 'Toon tijd' sluit alleen die klok uit van de ronde-uitbetaling.
- Rekentips en wereldtijdtips beschrijven de bewerking zonder de uitkomst.

Sterren, testscores en stempels blijven aparte leervoortgang, geen munten.
Bestaande saldi en betaalbewijzen blijven ongewijzigd. Nieuwe ronden hebben
unieke betaalbewijzen; herhaalde callbacks en opslagherkansingen betalen niet
dubbel.

De eerder afgesproken eenmalige kookavontuurbeloningen (ingrediënten ontdekken,
receptopdrachten en het gerecht afronden) blijven behouden. Dit zijn
receptvoortgangsbeloningen met boodschappen als kosten, geen vrij herhaalbare
oefenronden.
