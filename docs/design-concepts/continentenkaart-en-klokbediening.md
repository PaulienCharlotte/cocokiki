# Continentenkaart en leesbare bediening — 16 november 2026

Vlaggenmemory opent op een abstracte SVG-wereldkaart in plaats van een klembord. `components/geography/ContinentMap.tsx` houdt de zes continent-ID's los van de bestemming via `onChoose`. De kaart is bewust vereenvoudigd en bevat geen politieke grenzen. Kleuren volgen de bestaande huisstijltokens. Paden ondersteunen toetsenbordbediening; ruime kleurknoppen bieden dezelfde keuze op kleine schermen. De bestaande landenindeling, geheugenrondes en beloningen blijven intact.

Bij redactiesommen reserveert het werkblad ruimte voor de linker somnavigatie op desktop; op mobiel staan navigatie en gereedschap boven het werkblad. `RekenTekst` tekent plus, min, keer en gedeeld-door met SVG, zodat de deelpunten en plusstreep onafhankelijk zijn van het ronde lettertype. De oorspronkelijke somtekst blijft beschikbaar voor voorlezen.

De tijdlijn staat bij kloklezen als meetlat onder de hersenknop. De dubbele onderste tijdlijn-CTA vervalt. De wereldklok krijgt alleen veldopmaak en rustige materialen uit de bestaande tokens; er is geen extra beeldgeneratie of herbouw van de tijdzonelogica.
