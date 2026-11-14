# Kiki’s moestuin — afgesproken uitbreiding

Status: eerste speelbare versie gebouwd op `/plants/garden`, bereikbaar bij Kiki.
Zes vakken en gewassen, groeistappen, meetlat, maatbeker, drie rekenniveaus,
spelkalender, ruimte/licht bij buren, oogst verkopen of naar Coco brengen en
een eigen encyclopedie-afdeling zijn aangesloten. Het speelveld en de houten
plantbedden worden recht van boven bekeken. De CTA gebruikt een aparte, eenvoudige
vrijstaande plantenbak in plaats van de tuinachtergrond. De spelplanten gebruiken
gedeelde kiemplantillustraties van bovenaf; oogst heeft eigen gewasillustraties. Er zijn
geen echte wachttijden of verliezen door afwezigheid. Zie `moestuin-inhoud.md`
voor de inhoudscontrole en de huidige grenzen van de keukenvoorraad.

De opdrachtinterface toont één taak tegelijk: plaatsen en omrekenen zijn apart,
net als omrekenen en water afmeten. De knop ‘Ik kom er niet uit’ toont uitleg én
antwoord en slaat het hulpgebruik meteen op. Verdergaan met hulp laat de plant
groeien zonder opdrachtbeloning. Zelf opgelost levert per deelopdracht eenmalig
2 CocoCoins op. Oogst verkopen is een aparte opbrengst. Gras, aarde, hout en
kiemplanten gebruiken nu gelaagde illustraties met natuurlijke materiaalstructuur.

## Speelronde

Zaadjes kiezen → zaaien → verzorgen → oogsten → gebruiken bij Coco of verkopen
voor CocoCoins. Begin met zes tuinvakjes en zes gewassen: radijs, wortel, sla,
aardbei, tomaat en sperzieboon. Toon zaadje, kiemplant, groeiende plant en oogst.
Sluit aan op de bestaande plantenverzorging en encyclopedie. Kiki begeleidt het
tuinieren; gebruik voor rekentips het bestaande patroon van Baby Lua.

Kinderen ontdekken zaaien, water, licht, ruimte, groeiseizoenen en oogsten door
te spelen. De seizoenen lopen in speltempo, niet in echte maanden. Laat duidelijk
zien dat groeisnelheid en hoeveelheden in het spel vereenvoudigd zijn.

## Rekenen tijdens het tuinieren

Rekenen is een handeling in de tuin, geen los werkblad tussen twee spellen.
Laat kinderen eerst aanwijzen, meten of afmeten en daarna een getal kiezen of
invullen. Gebruik de bestaande rekencomponenten en metrische omrekenlogica.

Voorbeelden, expliciet ingestemd door Charlotte:

- Zaaiafstand: 5 cm tussen twee zaadjes is 50 mm of 0,5 dm. Laat de afstand op
  een liniaal zien en zaadjes op de juiste plek neerleggen.
- Water: deze spelopdracht vraagt 10 cl voor één plant. Dat is 100 ml of
  0,1 liter. Laat een maatbeker vullen tot het juiste streepje.
- Meerdere planten: vijf planten krijgen elk 10 cl; samen 50 cl = 0,5 liter.
- Meerdere dagen: één plant krijgt in deze opdracht zeven dagen lang 10 cl;
  samen 70 cl = 0,7 liter.
- Ruimte plannen: vier zaadjes op één rij hebben drie tussenruimtes. Bij
  5 cm tussenruimte is de afstand van het eerste tot het laatste zaadje 15 cm.
  Randruimte van een bak is een aparte maat; tel die niet stilzwijgend mee.

Bouw op van één stap (cm → mm; cl → ml) naar decimalen (cm → dm; cl → liter),
vermenigvuldigen en combineren. Accepteer een decimale komma én punt. Benoem
steeds de gevraagde eenheid. Feedback laat de omrekening zien.

## Inhoud en motivatie

Controleer echte zaaiafstanden en seizoenen per gewas met betrouwbare bronnen.
10 cl per dag is een rekenvoorbeeld, geen universeel verzorgingsadvies: echte
waterbehoefte verschilt per plant, groeifase, pot, grond en weer.

Behandel plantcombinaties vanuit ruimte, licht en verzorging. Neem geen stellige
lijsten met goede/slechte buren over zonder onderbouwing. Bewaar bronnen intern;
Charlotte wil geen externe bronlinks in de kinderinterface.

Een kind krijgt plezier en opbrengst van verzorgen en oogsten, zonder verloren
voortgang of dode gewassen na een paar dagen afwezigheid. Geen verplichte
dagelijkse reeks. Oogst kan later de ingrediëntenvoorraad van Coco aanvullen;
voorkom dubbele oogst, verkoop of beloningen bij herladen/dubbelklikken.

## Eerste bouwstap

Maak één speelbare ronde met zaaiafstand, water afmeten en oogsten. Werk daarna
de zes gewassen, kalender, plantcombinaties en koppeling met de keuken uit.
Gebruik de bestaande CocoKiki-vormtaal, tokens en componenten; controleer desktop
en 360px, opslag/herladen, juiste omrekeningen en eenmalige beloningen.

Tuindagen gaan alleen handmatig verder als alle onvoltooide gewassen verzorgd zijn. Lege en oogstrijpe vakken blokkeren niet. Echte tijd verandert niets aan de planten. Compacte gewasbordjes hergebruiken de bestaande productplaatjes; verzorging staat als icoon op het bordje.

Tuinbediening staat links verticaal, met de tuindag in het kalendericoon. De losse paginakop en onderbalk zijn verwijderd. Gewasbordjes zijn compact en staan met vaste tussenruimte onder de bakken. Het bestaande Maten-component uit de rekenspellen is beschikbaar via de meetlat en naast een omrekenantwoord; de gedeelde CSS wordt door het component zelf geladen.
