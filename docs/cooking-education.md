# Coco's kookwereld

## Eerste versie

De bakkerij toont drie werkende bestemmingen: De toonbank, Het kookboek en
Ontdek je eten. Ongebouwde vergrendelde avonturen staan niet meer in het menu.
De keuken is een werkplek binnen een recept; vrij taart versieren staat in het
kookboek. Bestaande recepten en voortgang blijven behouden.

De toonbank bevat naast de bestaande kookbestellingen één versieropdracht voor
Seb: een roze verjaardagstaart met aardbeien. Vijf muntjes bij afleveren,
optioneel twee extra binnen vijf minuten zichtbare speeltijd. De timer stopt
bij een verborgen tab of de afleverstap. Tijd op betekent verder werken zonder
bonus, geen verlies. De transactie wordt één keer toegepast; vrij versieren
levert geen muntjes op. De opdracht heeft een eigen ontwerpdocument en
overschrijft de vrije taart niet.

Voedingsinhoud staat in data/cooking/foodLessons.ts. Drie korte journeys over
volkoren/vezels, suiker/drinken en afwisseling: introductie, keuzes met uitleg,
afronding en bijpassend recept. Ontdekte onderwerpen blijven beschikbaar via
de voedingsafdeling van de encyclopedie. Herhalen levert geen munten op.

Bronnen: Voedingscentrum, encyclopedie Suiker en Vezels en Schijf van Vijf.
Geen gewicht, calorieëndoelen, druk gedrag of gegarandeerde suikercrash als
lesmechaniek. Suiker levert energie; het hele voedingsmiddel en het eetpatroon
doen ertoe. Feestelijk eten krijgt een plek naast dagelijkse keuzes.

## Beeldreferentie en vervolg

- Omgeving: public/assets/library/treehouse/rooms/kitchen-furnished.webp.
- Pan/eten: public/assets/library/cooking/healthy/vegetable-pan.webp.
- Taart: public/assets/library/cooking/taarten/roze.webp.
- Slagroom: public/assets/library/cooking/versieringen/toef-roze.webp.
- Fruit: public/assets/library/cooking/versieringen/aardbei.webp.

De keuken heeft een rijk perspectief; de taart en decoraties zijn van boven
getekend. Dat verschil is functioneel bij een werkblad. De kleine decoraties
hebben minder textuur en resolutie. Schaal ze niet op tot grote menubeelden.
Voedingsjourneys gebruiken daarom de grotere ingrediënten uit de winkel en de
gezonde receptenset. Een zachte slagschaduw verbindt versieringen met de taart.

Vervolg voor nieuwe assets: gebruik dezelfde warme zachte lichtval linksboven,
voelbare eetbare textuur, natuurlijke kleuren en bovenaanzicht voor alle
plaatsbare taartonderdelen. Houd de bestaande schaal tussen taart en fruit.
Maak eerst een samenhangende taart/toef/aardbei-proefset; vervang daarna per
familie. De bestaande set met 24 bodems en 57 decoraties is niet in bulk
vervangen in deze eerste versie.

Vervolg inhoud: concrete sorteer-/bouwopdrachten, water, energie, herkomst,
vitaminen/mineralen en voedingswensen in klantopdrachten. Houd de lesdata als
bron en breid interacties uit zonder extra belonings- of voortgangssystemen.

## Producten en begrippen

Ontdek je eten opent nu bij de bestaande voedingsmiddelen uit het kookboek.
Elk product gebruikt hetzelfde venster als de encyclopedie, met Het product,
In je lichaam en In de keuken. Twaalf kernproducten hebben extra lichaams- en
keukenuitleg plus een kleine kijk-/doeopdracht in productKnowledge.ts. Andere
producten gebruiken hun bestaande ontdekgegevens.

foodGlossary.ts bevat de gedeelde woordenlijst. Onderstreepte woorden openen
uitleg met betekenis, een concreet voorbeeld en verwante woorden. Er staat
steeds één dialoog open: een geschiedenis bewaart de weg terug naar de vorige
uitleg en naar de gekozen productsectie. Ook voedingsfeiten tijdens het koken
gebruiken diezelfde begrippen. Er worden geen nieuwe beloningen of
verzamelvinkjes toegekend alleen voor het lezen.

De terugknop van de toonbank gaat naar /islands/cooking, het bakkerijoverzicht.
Het kiezen en starten van een kookbestelling blijft de kookjourney openen.
