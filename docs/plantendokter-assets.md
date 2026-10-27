# Plantendokter — welke plaatjes het spel naar een hoger niveau tillen

Het spreekuur werkt nu met lijn-iconen. Dat is rustig, maar het is niet
wat een kind van negen aantrekkelijk vindt. Hieronder staat wat er nodig
is, op volgorde van wat het meeste oplevert.

Alles in dezelfde stijl als de planten: doorzichtige PNG, van opzij gezien,
zacht belicht. Lever gerust PNG aan, ik zet ze om naar WebP.

---

## ✅ Al binnen

In `public/assets/library/plants/icons/`: blad, aarde, plek, gieter, droog,
nat, zon, donker, droge-lucht en koud.
In `public/assets/library/plants/gereedschap/`: zandloper, bloempot, parasol,
lamp-plant, plantenspuit en sjaal.
Alles zit in het spel.

## 1. Het gereedschap ✅

| Bestand | Wat | Waarvoor |
|---|---|---|
Compleet. Alle zeven behandelingen hebben een eigen tekening:

| Bestand | Waarvoor |
|---|---|
| `gieter` (in `icons/`) | Water geven |
| `zandloper` | Even niet gieten |
| `bloempot` | Ompotten |
| `parasol` | Uit de zon zetten |
| `lamp-plant` | Lichter zetten |
| `plantenspuit` | Bladeren sproeien |
| `sjaal` | Warmer zetten |

Mapje: `public/assets/library/plants/gereedschap/`. Ze staan op de
behandelkaartjes én in het plantenboek, naast wat je eraan doet.

> De losse `lamp.webp` is eruit: `lamp-plant.webp` laat zien wat de lamp
> *doet*, en dat werkt beter op een knop van vijftig pixels.

---

## 2. De zes oorzaken als tekening

Compleet. Alle zes oorzaken hebben een eigen tekening: `droog`, `nat`,
`zon`, `donker`, `droge-lucht` en `koud`.

Mapje: `public/assets/library/plants/icons/`

---

## 3. Kiki als plantendokter

Twee poses, zelfde stijl als haar andere plaatjes:

- `kiki-dokter.png` — Kiki met een witte jas of een stethoscoop, vriendelijk
- `kiki-trots.png` — Kiki die duimen opsteekt, voor het moment dat de plant
  gered is

Mapje: `public/images/avatars/kiki/`

> Haar huidige plaatjes zijn hele figuren. Voor het ronde portretje op de
> kaart snijd ik nu haar hoofd eruit. Een **echt portretje** (alleen hoofd
> en schouders, vierkant) zou netter staan: `kiki-portret.png`.

---

## 4. De stempel en het paspoort

Dit is de beloning, dus die mag er bijzonder uitzien:

- `stempel-blad.png` — een stempelafdruk in inktgroen, een beetje scheef,
  zoals een echte stempel
- `paspoort.png` — een opengeslagen boekje met lege vakjes, als achtergrond
  voor het plantenpaspoort

Mapje: `public/assets/library/plants/paspoort/`

---

## 5. De spreekkamer

Nu staat de kaart op een egale achtergrond. Een plantenkliniek of een kleine
kas als achtergrond maakt er een plek van in plaats van een formulier:

- `spreekkamer.png` — een lichte kas of werkbank met planten, 1600 breed,
  rustig genoeg om tekst overheen te leggen

Mapje: `public/assets/library/plants/`

---

## Wat ik ermee doe

1. **Gereedschap** vervangt de iconen op de behandelkaartjes, en wordt
   sleepbaar op de plant. Dat maakt stap 3 net zo tastbaar als stap 1.
2. **Oorzaken** vervangen de iconen op de diagnosekaartjes.
3. **Kiki-dokter** komt in de tekstballon en in het hintvenster.
4. **De stempel** verschijnt met een klein stempeleffect als je er een
   verdient, en vult het paspoort.
5. **De spreekkamer** komt achter de kaart.

Het spreekuur staat nu helemaal op tekeningen: geen enkel lijn-icoon meer op
een diagnosekaartje of een behandelknop. Wat nog ontbreekt is sfeer in plaats
van uitleg: Kiki als dokter, de stempel en het paspoort, en de spreekkamer.
