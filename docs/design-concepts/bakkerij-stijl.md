# Bakkerij: gedeelde materialen in de kookroute

De visuele uitwerking staat in components/cooking/bakkerij-stijl.css. Deze stylesheet werkt alleen onder de klasse bakkerij-stijl en in het receptdialoog met bakkerij-recept.

Aangepast:

- Toonbank en bakopdrachten: de bakkerij als achtergrond, klantkeuzes op getekende papieren briefjes, de bestelling op één papieren werkvlak en warme antwoordknoppen.
- Kookboek: gerechten en tekst op papier; geen wit beeldvlak onder elk gerecht. De receptdialoog gebruikt hetzelfde materiaal.
- Ontdek je eten: de grote witte buitenkaart vervalt; producten gebruiken de gedeelde papieren kaartjes.
- Ingrediënten ontdekken: het geneste witte tekstpaneel is verwijderd; de ontdekking staat op het papieren werkvlak. De bestaande spraakwolk en antwoordbediening blijven behouden.
- Bakrekenen: de witte buitenkaart is verwijderd, voortgang staat op glas en de opdracht op papier.
- Voedingsstoffenmemory in het kookavontuur: de bakkerij blijft zichtbaar; spelkaarten en labels sluiten aan op papier en hout.
- Aflevering: de bon en de klantreactie delen de bestelmateriaalset.
- Bereiding buiten het fornuis: de witte kaart is vervangen door een transparant speelvlak met houten kop en glazen uitleg. De bestaande interactieve fornuisbediening blijft behouden.

Hergebruikte assets: ui/pinned-paper.webp, ui/wooden-nameplate.webp, ui/navigation-medallion.webp en de bestaande bakkerijachtergrond. Er zijn geen extra afbeeldingen nodig voor deze ronde.

Spelregels, receptinhoud, antwoorden, beloningen, route-ID's en opgeslagen voortgang zijn niet aangepast. De bestaande terug-/receptknoppen en scrollmogelijkheden blijven beschikbaar. Het vervolg kan per kookonderdeel plaatsvinden; dit is geen globale vervanging van alle oude stijlen in de rest van de app.

## Ontdekvragen en koken — 16 november

Uitleg na een antwoord staat in een gedeelde `Dialog` met Coco's spraakwolk. De vervolgactie staat op een vaste plek en is ook vanuit de dialoog bereikbaar. Sluiten van de dialoog bewaart het antwoord. Beloningen blijven via dezelfde voortgangstransactie lopen.

De oven toont alleen de huidige handeling: openen, plaatsen, sluiten, tijd kiezen/starten, bakken, openen en afkoelen. De bestaande opgeslagen deur-, vorm- en bakstatus bepalen de volgorde, ook na hervatten.

`apple-cutting-stages.webp` is een transparante 2×2-atlas: heel, helften, partjes, blokjes. Gegenereerd met imagegen als warme, gedetailleerde 3D-appel met rode/gele schil en consistente camera/licht. Geen tekst, mes, handen of achtergrond. De atlas wordt met CSS-frameposities gebruikt; alpha blijft behouden in WebP. De snijstap toont na drie tikken het eindresultaat tot het kind bevestigt. Bij toevoegen aan de kom verschijnt hetzelfde blokjesframe.
