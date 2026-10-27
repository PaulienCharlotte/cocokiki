# Plantendokter — welke plaatjes het spel naar een hoger niveau tillen

Het spreekuur werkt nu met lijn-iconen. Dat is rustig, maar het is niet
wat een kind van negen aantrekkelijk vindt. Hieronder staat wat er nodig
is, op volgorde van wat het meeste oplevert.

Alles in dezelfde stijl als de planten: doorzichtige PNG, van opzij gezien,
zacht belicht. Lever gerust PNG aan, ik zet ze om naar WebP.

---

## ✅ Al binnen

Zeven tekeningen staan in `public/assets/library/plants/icons/`:
blad, aarde, plek (plant voor het raam), gieter, droge gebarsten aarde,
natte drassige aarde en de zon. Die zitten al in het spel.

## 1. Het gereedschap — de grootste winst

Zes voorwerpen, elk ongeveer 600 × 600, doorzichtige achtergrond. Dit zijn
de dingen die een kind straks op de plant sleept, dus ze moeten er
vastpakbaar uitzien.

| Bestand | Wat | Waarvoor |
|---|---|---|
| ~~`gieter.png`~~ ✅ | Al gemaakt | Water geven |
| `zandloper.png` of `wachtbordje.png` | Iets dat "even wachten" zegt | Even niet gieten |
| `bloempot-aarde.png` | Lege pot met verse donkere aarde en een schepje | Ompotten |
| `parasol.png` | Een parasol of zonnescherm | Uit de zon zetten |
| `lamp.png` | Een schemerlampje of een raam met zon erin | Lichter zetten |
| `plantenspuit.png` | Een plantenspuit met een wolkje nevel | Bladeren sproeien |

> De zandloper is de lastigste om leuk te maken. Een alternatief: een
> **gieter met een rood kruisje**, of Kiki die haar hand ophoudt.

Mapje: `public/assets/library/plants/gereedschap/`

---

## 2. De vier oorzaken als tekening

Nu zijn het lijn-iconen uit een standaardset. Vier kleine illustraties van
ongeveer 300 × 300 maken de keuze veel aantrekkelijker:

- ~~droog~~ ✅, ~~nat~~ ✅, ~~zon~~ ✅ — al gemaakt
- **`donker.webp`** — het enige dat nog ontbreekt: een donkere hoek of een
  maantje achter een raam, voor *te weinig licht*. Zolang die er niet is
  staat daar nog een lijn-icoontje tussen de tekeningen, en dat valt op.

Mapje: `public/assets/library/plants/oorzaken/`

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

Nummer 1 is veruit het belangrijkst. Met alleen de zes gereedschappen
verandert het spel al duidelijk van karakter.
