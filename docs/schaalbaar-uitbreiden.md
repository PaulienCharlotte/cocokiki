# Hoe de wereld groeit zonder dat er tekeningen bij moeten

Elke nieuwe plant kost drie tekeningen. Elk nieuw recept kost er vijftien en
twintig stappen. Zo groeit de app wel, maar langzaam, en jij bent het grootste
deel van de tijd aan het tekenen.

Er ligt al een snellere weg klaar, en die is al eens bewezen in dit project.

## Wat er al is, en wat niemand gebruikt

De repo staat vol gestructureerde kennis. Niet als losse teksten, maar als
velden waar een computer iets mee kan:

| Bron | Aantal | Velden per stuk |
|---|---|---|
| Plantensoorten | 13 | naam, latijnse naam, herkomst, groeiplaats, licht, water, weetje, tip, dagen tussen water |
| Ingrediënten | 15 | naam, herkomst, seizoen, streken, voedingsstoffen, weetjes |
| Voedingsstoffen | 8 | waar het goed voor is |
| Plaatsweetjes | 155 | één weetje met emoji |
| Landen | 47 | hoofdstad, werelddeel, ligging |
| Plaatsen in Nederland en de Benelux | 55 | provincie, soort, ligging |

Bij elkaar ruim driehonderd dingen met gemiddeld vijf feiten eraan. Dat is nu
allemaal *leesstof*: het staat in een kaart die je openklapt. Het wordt nergens
*gevraagd*.

Let op de verhouding: 257 van die driehonderd zijn aardrijkskunde, en díé heeft
de machine al. Zonder machine staan er maar 36 dingen: dertien planten, vijftien
ingrediënten en acht voedingsstoffen. De machine is dus vooral een vermenigvuldiger
voor wat je er daarna bij schrijft, niet een voorraad die er al ligt.

## Het idee: velden worden vragen

Een veld is een vraag met een antwoord erin. Dat hoeft niemand te verzinnen.

- `plant.origin` → "Welke plant komt uit Zuid-Mexico?"
- `plant.light` → "Welke van deze drie wil juist weinig licht?"
- `plant.waterDays` → "Welke plant kan het langst zonder water?"
- `ingredient.season` → "Wat ligt er in november vers in de winkel?"
- `nutrient.bodyFunction` → "Waar heeft je lichaam calcium voor nodig?"
- `land.capital` → "Wat is de hoofdstad van Peru?"

Uit dertien planten met acht bruikbare velden komen al ruim honderd vragen, en
elke vraag heeft meerdere vormen: aanwijzen, kiezen uit drie, of omgekeerd
("welke plant hoort bij dit weetje?"). Over alle bronnen heen zijn dat er
duizenden, zonder één nieuwe tekening.

**De combinatie kan, maar minder ver dan het klinkt.** De app weet waar planten
vandaan komen én waar landen liggen, maar de herkomst van een plant staat er als
streek: "Midden- en Zuid-Amerika", "Tropische gebieden wereldwijd". Alleen
Mexico valt samen met een land uit de topografie. Een koppeling werkt dus op
werelddeel, niet op land:

> "De monstera komt uit Zuid-Mexico. In welk werelddeel ligt dat?"

Wil je het op landniveau, dan moet de herkomst per plant scherper: één land
erbij dat ook in de topografie staat. Dat is dertien keer één woord.

## Dit is al eens gedaan in dit project

`data/learning.ts` doet precies dit voor aardrijkskunde: negen onderwerpen maal
zes speelvormen over één verzameling plaatsen. Dat is de reden dat de topografie
nu al eindeloos is terwijl er geen enkele tekening per vraag bij hoeft.

Wat ontbreekt is dezelfde machine over de ándere kennis.

## Gebouwd op 30 oktober 2026

De vragenmaker staat er: `data/quiz/vragen.ts` maakt **86 vragen** uit de
gegevens die er al waren — 52 over planten, 26 over eten, 8 over
voedingsstoffen. Geen enkele nieuwe tekening.

De vraag van de dag staat bovenaan in de encyclopedie. Goed antwoord levert
één CocoCoin op, en wat je goed had komt pas terug als je alles gehad hebt.

Een test controleert voor alle 86 dat er **precies één** goed antwoord tussen
de keuzes staat. Dat is de belangrijkste: twee planten die allebei veel zon
willen zouden anders twee goede antwoorden geven.

Schrijf je er nu een plant bij, dan komen er vier vragen bij. Een ingrediënt
met een seizoen en een streek levert er twee.

## Wat er oorspronkelijk bedacht was

Eén ding, niet een nieuwe wereld:

1. **Een vragenmaker** die elk veld van elke bron omzet in een vraag met drie
   antwoorden. Eén bestand, een regel of honderdvijftig.
2. **Eén scherm** waar die vragen langskomen. De kaart van het spreekuur kan
   zo hergebruikt worden: één vraag, één stem, drie keuzes, geen nieuwe vormgeving.
3. **Een controle** die voor elke vraag nagaat dat er precies één antwoord goed
   is en dat de afleiders niet toevallig ook kloppen. Zonder die controle
   verzint de machine onzin. De receptcontrole in `data/cooking/validation.ts`
   is het voorbeeld dat al werkt.

Daarna kost elke uitbreiding **één regel tekst**. Een plant erbij is acht nieuwe
vragen. Een weetje erbij is meteen speelbaar.

## Waar het zichtbaar wordt

- **Als bonusvraag** aan het eind van een consult of een recept, zoals de
  plantennaam nu al gevraagd wordt.
- **Als vraag van de dag**, één per dag, op de wereldkaart. Een reden om terug
  te komen, zonder nieuw spel.
- **In de encyclopedie**: een pagina is pas compleet als je er ook een vraag
  over goed hebt. Dat verandert lezen in onthouden.

## Wat dit niet is

Geen nieuwe spelwereld, geen nieuwe personages, geen nieuwe vormgeving. De
bestaande kaart, de bestaande stemmen, de bestaande encyclopedie — er komt
alleen een motor onder die van wat er al staat vragen maakt.

## Wat het wél vraagt

Tekst schrijven in plaats van tekenen. Een plant met acht goed geschreven velden
levert meer spel op dan een plant met drie plaatjes. Dat is de ruil.

---

# Deel 2: journeys, en waarom de plantendokter dun aanvoelt

Geschreven op 30 oktober 2026, na de vraag: hoe maken we meer onderdelen
schaalbaar, zoals Duolingo dat per taal doet — eindeloos doorspelen, punten
halen?

## De journey-machine bestaat al, maar zit vast aan één recept

`services/cookingProgress.ts` is het skelet dat je zoekt. Het kent stadia:

```
overview → discovery → nutrient-memory → challenges → shopping → cooking → complete
```

met per journey een status, afgeronde stadia, sterren, munten, en beloningen
die niet twee keer kunnen tellen (`rewardClaimed`, `appliedTransactions`). Dat
is precies wat een pad van levels nodig heeft.

Het probleem is niet dat de machine ontbreekt. Het is dat `JourneyProgress`
een veld `recipeId` heeft. De machine kan alleen aan recepten denken.

**Wat het schaalbaar maakt:** de stadia uit de code halen en in data zetten.

```ts
interface Journey {
  id: string;              // 'planten'
  titel: string;           // 'Het plantenpad'
  gids: CharacterId;       // 'kiki'
  levels: Level[];
}
interface Level {
  id: string;
  titel: string;           // 'Licht'
  opdracht:
    | { soort: 'vragen'; bron: QuizBron; onderwerp?: string; aantal: number }
    | { soort: 'spreekuur'; patienten: number }
    | { soort: 'spel'; spelId: string };
}
```

Een level is dan een regel in een tabel, geen scherm. Vier journeys (planten,
koken, rekenen, topografie) delen één scherm, één voortgangsbalk, één manier
van punten halen.

**Waarom het eindeloos kan:** een level van het type `vragen` haalt zijn
oefeningen uit `data/quiz/vragen.ts`. Die maakt nu 86 vragen uit 36 dingen.
Schrijf je er een plant bij, dan groeien alle levels die over planten gaan
vanzelf mee. Je vult geen levels, je vult een tabel.

## Waarom de plantendokter dun aanvoelt

Niet door te weinig planten. Door te weinig *vragen per plant*. Dit staat er nu:

| | Aantal |
|---|---|
| Plantensoorten in de app | 13 |
| Soorten met ziektetekeningen | 10 |
| Mogelijke patiënten (soort × oorzaak) | 28 |
| Antwoorden om uit te kiezen (`DIAGNOSE_CHOICES`) | **4** |
| Dingen om naar te kijken (`ClueSpot`) | 3 |

Vier antwoorden. Een kind dat twee keer geweest is, gokt de derde keer goed
zonder te kijken. De drie stappen — kijken, zeggen, behandelen — zijn goed
bedacht, maar er valt te weinig te redeneren tussen stap één en stap twee.

Let ook op: de plantenwijzer (`data/plants/wijzer.ts`) beschrijft **zes**
oorzaken, waarvan er maar vier in het spreekuur voorkomen. Droge lucht en te
koud staan uitgeschreven, met icoon en vuistregel, maar komen nooit langs,
omdat er geen tekening van een plant met dat probleem is.

## Diepte zonder tekenwerk: context bij een geval

Een consult is nu `{ plant, oorzaak }`. Een echt consult heeft omstandigheden:

```ts
interface Geval {
  speciesId: string;
  cause: PlantProblemCause;
  seizoen: 'lente' | 'zomer' | 'herfst' | 'winter';
  plek: 'bij het raam' | 'bij de verwarming' | 'in de hoek' | 'in de badkamer';
  laatstWater: number;      // dagen geleden
}
```

Die velden bestaan niet als tekening, alleen als zin. Maar ze maken van gokken
redeneren:

> "Hij staat sinds oktober bij de verwarming. De bladpunten zijn bruin, de
> aarde is nog vochtig."

Natte aarde sluit te weinig water uit. Verwarming plus winter wijst naar droge
lucht. Hetzelfde plaatje, hetzelfde scherm, een echte denkstap. En het haalt
de twee ongebruikte oorzaken binnen: droge lucht en te koud zijn te herkennen
aan de plek en het seizoen, ook zonder eigen tekening.

Reken het door: 28 patiënten × 4 seizoenen × 4 plekken is ruim vierhonderd
gevallen, waarvan niet alle combinaties kloppen — maar genoeg dat een kind
nooit tweemaal hetzelfde krijgt. Zonder één nieuw plaatje.

## Volgorde

1. ~~**Context bij een geval**~~ — gedaan op 30 oktober 2026. Zie hieronder.
2. ~~**De zes oorzaken allemaal in gebruik**~~ — gedaan, zie hieronder.
3. **De journey-machine losmaken van koken.** Het meeste werk, en op zichzelf
   nog niets zichtbaars. Doe dit pas als stap 1 bewezen heeft dat de richting
   klopt.
4. **Het plantenpad vullen**: levels uit de vragenmaker, het spreekuur als
   eindopdracht per level.
5. **Pas dan meer planten.** Dertien naar dertig verdubbelt alles, maar kost
   plaatjes — en niet één per plant, maar één per symptoom. Daarom achteraan.

## Wat hier níét in staat

Geen punten-per-dag, geen strepen (streaks), geen harten die opraken. Duolingo
gebruikt die om je terug te laten komen; dit is een spel dat een kind zelf
opzoekt. De vraag van de dag doet dat werk al. Als blijkt dat het niet genoeg
is, is een streak een los ding dat er later bij kan.


## Stap 1 en 2, gedaan op 30 oktober 2026

Wat er veranderd is in het spreekuur:

- Een patiënt is nu een **geval**: soort, oorzaak, seizoen, plek en hoeveel
  dagen geleden hij water kreeg (`maakGeval` in `data/plants/clinic.ts`).
- De aanwijzingen komen uit die feiten in plaats van uit de oorzaak. Daarvóór
  hoorde bij elke oorzaak één vaste zin, en die zin wás het antwoord.
- **Alle zes de oorzaken doen mee**, van vier. Droge lucht en kou lenen voorlopig
  een plaatje; `docs/plantendokter-assets.md` vraagt het echte tekenwerk aan.
- Vier antwoorden per patiënt in plaats van altijd dezelfde vier, en de twee
  waar het het meest op lijkt staan er altijd bij (`VERWARRING`).
- De EHBO-kaart van vier planten kreeg er droge lucht bij, zodat die oorzaak
  vaker langskomt.

In cijfers: van 28 naar **36** mogelijke patiënten, en van 4 naar **6**
oorzaken. Belangrijker dan de aantallen: een test let erop dat de drie
aanwijzingen samen altijd precies één oorzaak aanwijzen. Zonder die eigenschap
kan een kind het goed beredeneren en toch fout hebben, en dan is het gokken
met extra stappen.
