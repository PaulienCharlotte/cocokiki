# Spelmenu en CocoCoins — 16 november 2026

Spelkeuzes met de vorm `plek` tonen alleen het beeld. De titel blijft de toegankelijke naam en aanwijshint. Mijn spellen gebruikt dezelfde ronde keuzes, met sterren om te bewaren. Namen van recepten, vragen en opdrachten blijven zichtbaar.

Op de kaart staan de buitenste gebouwen op twee rechte kolommen, ook op mobiel. Het keuzebord in de huisjes staat recht. To Do heeft geen eigen ingang in de huisjes; het klembord in de bovenbalk blijft beschikbaar.

Het saldo in de bovenbalk opent `/munten`. Meer verdienen opent het gedeelde dialoogpatroon met dagelijkse vragen en het To Do-bord. De dagvoortgang wordt uit de bestaande opslag gelezen; de pagina kent zelf geen munten toe.

Het gedeelde plantendokterbeeldmerk komt uit `data/plants/branding.ts`. Gebruikt in de kas, Mijn spellen, To Do en het spreekuur. Transparante WebP, gegenereerd met imagegen: een gedetailleerde warme 3D-kamerplant in terracotta, een gedempte teal stethoscoop en een klein botanisch bladmedaillon; zonder tekst, achtergrond of medisch kruis.

## Eigen CocoCoin

`/assets/library/ui/cococoin.webp` is het vaste muntbeeld, gedeeld via `.ck-munt`: op de spaarpagina, bij het saldo en bij beloningen die deze klasse gebruiken. Transparante WebP, 512px. Met imagegen ontworpen als frontale gouden munt met gekartelde rand, dubbele reliëfrand, een grote C met kiemplantje en een kleine vierpuntige schittering. Bewust geen valuta- of waardecijfer. De spaarpagina gebruikt hetzelfde beeld in drie groottes op de bestaande papieren asset, met een houten kop en een gouden verdienknop.

## Rustigere favorieten en één muntbeeld

Favorieten worden uitsluitend in Mijn spellen beheerd. `CardGrid` toont standaard geen sterren; Mijn spellen schakelt ze expliciet in met `favorieten`. De ster heeft een kleiner zichtbaar medaillon en behoudt een raakvlak van minimaal 44px. De huisjes houden daarmee vrije, herkenbare spelillustraties.

Ook het gedeelde `CocoCoin`-component gebruikt nu de nieuwe muntasset. Daardoor zijn de prijzen, mandjes, meubel- en plantenwinkel, spelbeloningen en verkoopacties gelijk aan het saldo en de spaarpagina. Het kompas blijft alleen waar het echt als reis-/merkillustratie wordt gebruikt.
