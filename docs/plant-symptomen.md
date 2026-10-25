# Plantensymptomen — welke plaatjes moeten er gemaakt worden

Elke plant krijgt drie zieke toestanden naast zijn gezonde winkelplaatje.
De symptomen kloppen botanisch: een varen ziet er bij dorst heel anders uit
dan een cactus. Juist dat verschil is wat kinderen hier leren.

## Regels voor alle plaatjes

- **Zelfde pot, zelfde hoek, zelfde formaat** als het winkelplaatje. Alleen de
  plant verandert, de pot nooit.
- Doorzichtige achtergrond (PNG).
- Zelfde tekenstijl en belichting als de winkel.
- De plant blijft op dezelfde plek staan in het kader, zodat hij niet
  verspringt als hij van toestand wisselt.

## Bestandsnamen

Per plant een mapje met drie bestanden:

```
public/assets/library/plants/<plant-id>/thirst-1.png
public/assets/library/plants/<plant-id>/thirst-2.png
public/assets/library/plants/<plant-id>/thirst-3.png
```

De `<plant-id>` staat hieronder bij elke plant.

Zodra de drie bestanden er staan, hoeft er in `data/plants/species.ts` maar
één regel bij die plant bij: `stageArt: true`. De teksten staan er al in.

---

## 1. Monstera in mand — `monstera-basket` ✅ AL KLAAR

Water om de 7 dagen.

| | Wat je ziet |
|---|---|
| 1 | Bladeren hangen slap naar beneden, kleur nog groen |
| 2 | Onderste bladeren worden geel, de rest hangt |
| 3 | Bruine droge randen, een paar bladeren opgekruld |

---

## 2. Palm in witte pot — `palm-white-pot`

Water om de 7 dagen. Witte pot.

| | Wat je ziet |
|---|---|
| 1 | De punten van de bladveren worden lichtbruin en droog |
| 2 | Hele onderste bladveren bruin, de bovenste beginnen te hangen |
| 3 | Bladveren krullen naar binnen, bruin en papierdroog, een paar afgevallen |

> Palmen beginnen altijd bij de **punten**, niet bij het hele blad.

---

## 3. Palm in kleipot — `palm-clay-pot`

Water om de 6 dagen. Terracotta pot.

Zelfde symptomen als de witte palm hierboven, maar iets sneller.
Extra detail: in toestand 3 een witte kalkrand op de kleipot.

---

## 4. Vrouwentong — `snake-plant`

Water om de 21 dagen. Dit is de taaiste plant van de hele winkel.

| | Wat je ziet |
|---|---|
| 1 | Bladeren zien er nog stevig uit, maar met fijne rimpeltjes in de lengte |
| 2 | Bladeren buigen aan de top opzij, duidelijke rimpels |
| 3 | Bladeren vallen naar buiten open, bruine droge punten |

> Deze plant valt **naar buiten open** als hij te lang droog staat. Hij wordt
> nooit slap zoals een monstera — hij blijft stevig maar gaat rimpelen.

---

## 5. Hangvaren — `hanging-fern`

Water om de 3 dagen. De snelste van allemaal.

| | Wat je ziet |
|---|---|
| 1 | De puntjes van de blaadjes worden bruin |
| 2 | Hele blaadjes bruin en opgekruld, vooral aan de buitenkant |
| 3 | Droge bruine pluk, blaadjes verkruimeld, kale steeltjes zichtbaar |

> Een varen wordt niet geel en niet slap — hij wordt **bruin en bros**.

---

## 6. Hangende klimop — `hanging-vine`

Water om de 7 dagen.

| | Wat je ziet |
|---|---|
| 1 | De ranken hangen slapper, blaadjes iets omgekruld |
| 2 | Blaadjes langs de ranken worden geel en vallen eraf |
| 3 | Kale ranken met alleen bovenaan nog wat droge bruine blaadjes |

---

## 7. Lepelplant — `white-flower`

Water om de 5 dagen. Dit is de dramaqueen.

| | Wat je ziet |
|---|---|
| 1 | Alle bladeren hangen slap over de rand van de pot, de bloem knikt |
| 2 | Volledig in elkaar gezakt, de witte bloem hangt naar beneden |
| 3 | Bruine randen aan de bladeren, de bloem is bruin geworden |

> Deze plant klapt helemaal in elkaar, maar staat na water binnen een paar uur
> weer rechtop. Leuk om te laten zien: toestand 1 en 2 zijn **dramatisch** maar
> nog niet erg.

---

## 8. Flamingoplant — `pink-flower`

Water om de 6 dagen.

| | Wat je ziet |
|---|---|
| 1 | Bladeren verliezen hun glans, hangen iets |
| 2 | Gele vlekken op de oudste bladeren, het roze schutblad verbleekt |
| 3 | Bruine randen, het roze schutblad is bruin aan de punt |

---

## 9. Sinaasappelboompje — `orange-tree`

Water om de 5 dagen.

| | Wat je ziet |
|---|---|
| 1 | Blaadjes krullen omhoog als een bootje |
| 2 | Blaadjes vallen af, de onderste takjes worden kaal |
| 3 | Veel kale takjes, de sinaasappeltjes zijn klein en rimpelig |

> Een citrus **laat zijn blad vallen** bij dorst. Dat is heel herkenbaar.

---

## 10. Vlinderorchidee — `orchid`

Water om de 7 dagen.

| | Wat je ziet |
|---|---|
| 1 | Bladeren worden slap en leerachtig, wortels zijn zilvergrijs in plaats van groen |
| 2 | Duidelijke rimpels in de bladeren, als een oude appel |
| 3 | Bloemen vallen af, bladeren diep gerimpeld en geelachtig |

> Kijk naar de **wortels**: groen betekent nat, zilvergrijs betekent dorst.
> Dat is een mooie les die je nergens anders ziet.

---

## 11. Vetplantje — `succulent`

Water om de 21 dagen.

| | Wat je ziet |
|---|---|
| 1 | Blaadjes zijn minder bol, een beetje slap aan de onderkant |
| 2 | Blaadjes rimpelen en worden dunner |
| 3 | Onderste blaadjes zijn opgedroogd en papierachtig, de rest is geschrompeld |

---

## 12. Kleine cactus — `small-cactus`

Water om de 30 dagen. Terracotta pot.

| | Wat je ziet |
|---|---|
| 1 | De cactus is iets smaller geworden, flauwe lengtegroeven |
| 2 | Duidelijke rimpels in de lengte, de stam is ingevallen |
| 3 | Sterk geschrompeld, de top hangt iets scheef, grijzige kleur |

---

## 13. Hoge cactus — `tall-cactus`

Water om de 30 dagen. Zelfde symptomen als de kleine cactus, maar op een hoge
zuilcactus. In toestand 3 buigt de top duidelijk opzij.

---

# Extra: te veel water

Dit is de belangrijkste les bij cactussen en vetplanten — die gaan veel vaker
dood van te véél water dan van te weinig. Als je er zin in hebt, zijn dit de
drie plantjes waar dat het meest oplevert:

| Plant | id | Wat je ziet bij te veel water |
|---|---|---|
| Kleine cactus | `small-cactus` | Bruine zachte plek onderaan de stam, glimmend nat |
| Vetplantje | `succulent` | Doorschijnende, geelbruine slappe blaadjes die eraf vallen |
| Vrouwentong | `snake-plant` | Gele slappe voet, het blad knikt om bij de aarde |

Bestandsnaam hiervoor: `wet-1.png` in hetzelfde mapje.

---

## Als je wilt beginnen met een kleine set

Deze vijf verschillen het duidelijkst van elkaar en leren samen het meeste:

1. **Hangvaren** — bruin en bros
2. **Lepelplant** — klapt dramatisch in elkaar
3. **Vlinderorchidee** — rimpelt, wortels verkleuren
4. **Kleine cactus** — schrompelt in
5. **Sinaasappelboompje** — laat zijn blad vallen

Samen met de monstera die er al is, dekt dat zes heel verschillende manieren
waarop een plant laat zien dat hij dorst heeft.
