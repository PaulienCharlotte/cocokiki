# Keukenplaatjes van bovenaf

Het werkblad wordt van boven gezien, maar de oudere keukenspullen zijn van
opzij getekend. Daarom staat een lepel schuin op een maatbeker en klopt het
beeld niet. De nieuwe tekeningen lossen dat op; ze eindigen allemaal op
`-top` zodat ze naast de oude kunnen bestaan tot alles om is.

Mapje: `public/assets/library/cooking/kit/`
Elk nieuw bestand moet ook in `public/assets/library/inventory.json`, anders
valt de receptcontrole om (en dat is de bedoeling).

## In gebruik

| Bestand | Waar |
|---|---|
| `muffin-pan-top` | De bakvorm bij "Vul tien vormpjes" |
| `liner-top` | Een leeg papieren vormpje |
| `liner-batter-top` | Een vormpje met beslag en bessen |
| `batter-thick-top` | Het beslag voor het roeren, en wat je schept |
| `batter-mix-1-top`, `batter-mix-2-top` | De tussenstanden tijdens het roeren |
| `batter-smooth-top` | Het beslag als het glad is |
| `spoon-top` | De lepel waarmee je roert |

De holtes van de bakvorm zijn opgemeten in het bestand zelf: vier kolommen op
16,1 / 38,6 / 60,8 / 83,3 procent, drie rijen op 22,6 / 46,8 / 72,7 procent,
elke holte 20 procent breed. Verandert de tekening, dan moeten die getallen in
`data/cooking/blueberryMuffins.ts` opnieuw gemeten worden.

## Klaar, nog niet gebruikt

| Bestand | Waarvoor het klaarligt |
|---|---|
| `bowl-top` | De mengkom, zodra de komstappen van bovenaf gaan |
| `whisk-top`, `spatula-top` | Garde en spatel bij het uitzoeken van gereedschap |
| `flour-heap-top` | Bloem op het werkblad of in de kom |
| `batter-mix-3-top`, `batter-mix-4-top` | Stevig kloppen, losser en met spatten |
| `dough-ball-top` | Een stevig deeg, voor een broodrecept |
| `batter-chocolate-top` | Chocoladebeslag, voor een chocoladerecept |

## Wat er nog nodig is

Alles van opzij gezien tenzij er "van boven" staat, doorzichtige achtergrond,
ongeveer 700 pixels breed. De bakvorm en de maatbeker mogen groter.

### 1. De maatbeker, op niveaus

Nu is de vloeistof een gekleurd vlak over een doorzichtige beker. Dat kan niet
goed worden: glas heeft geen dekking om op te maskeren, en een recht vlak
volgt de schuine wand niet. Met vaste standen is het in één keer raak.

| Bestand | Wat |
|---|---|
| `jug-empty` | Lege maatbeker met maatstreepjes |
| `jug-oil-1` … `jug-oil-3` | Een derde, twee derde en vol met olie |
| `jug-milk-1` … `jug-milk-3` | Hetzelfde met melk |
| `jug-mixed-1` … `jug-mixed-3` | Olie, ei en melk door elkaar |

Drie standen per vloeistof is genoeg; daartussen kan ik overvloeien. Doe de
beker steeds vanuit dezelfde hoek en op dezelfde plek in het vierkant, anders
springt hij tijdens het schenken.

### 2. Strooien en sprenkelen

Voor de weegschaal en de maatlepel. Nu strooi ik het winkelplaatje van het
ingrediënt in kleine kopietjes, en dat blijft een noodgreep.

| Bestand | Wat |
|---|---|
| `strooi-bloem` | Een handvol bloem in de lucht, losse korrels |
| `strooi-suiker` | Hetzelfde met suikerkristallen |
| `strooi-zout` | Fijner, witter |
| `strooi-bakpoeder` | Heel fijn poeder, bijna stuifmeel |
| `sprenkel-olie` | Een straaltje olie met een paar druppels |
| `sprenkel-melk` | Een straaltje melk |
| `sprenkel-vanille` | Een paar donkere druppels |

Elk als **losse korrels of druppels op een doorzichtige achtergrond**, niet als
hoopje. Dan kan ik ze één voor één laten vallen terwijl je weegt, en ze
stapelen vanzelf tot een bergje.

### 3. De weegschaal van vooraf

| Bestand | Wat |
|---|---|
| `scale-glass-empty` | Weegschaal van voren met een glazen kom erop |
| `scale-glass-1` … `scale-glass-3` | Dezelfde kom een derde, twee derde en vol |

Door het glas zie je wat erin zit, dus hoeft er niets overheen getekend te
worden. Dat lost het laatste half-afgeknipte plaatje op.

### 4. De bakvorm in de oven

De vorm van bovenaf past niet in een oven die je van voren ziet. Daar is een
eigen tekening voor nodig:

| Bestand | Wat |
|---|---|
| `pan-in-oven-leeg` | De bakvorm schuin van voren, met lege vormpjes |
| `pan-in-oven-rauw` | Dezelfde vorm met ongebakken beslag |
| `pan-in-oven-klaar` | Met gerezen, goudbruine muffins |

### 5. Wat je gebakken hebt

| Bestand | Wat |
|---|---|
| `schaal-leeg` | Een taartschaal of plateau, van voren |
| `schaal-muffins` | Dezelfde schaal met muffins erop |

### 6. Nog los

- **Beslag met bessen erdoor**, van boven, voor het omscheppen.
- Een **glazen mengkom van boven**, als tegenhanger van `bowl-top`.
