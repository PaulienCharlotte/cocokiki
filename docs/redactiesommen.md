# Redactiesommen

Een redactiesom is geen rekensom met een verhaaltje eromheen. De paaltjessom
vraagt om de +1, de ritjessom om naar boven afronden, de tijdsom om de sprong
naar het hele uur. Die techniek zit niet in de getallen maar in het *type*
som. Daarom draagt elk type hier zijn eigen aanpak met zich mee, in plaats
van dat we de stappen uit een rekenboom afleiden.

## Fouten mogen

Een kind kan een som fout afsluiten. Een verkeerd antwoord houdt je niet
tegen: je rekent verder met je eigen getal, net als op papier. Pas bij het
nakijken zie je waar het misging.

Een stap wordt nagekeken tegen **de getallen die het kind zelf invulde**,
niet tegen de goede. Wie bij stap 1 een 12 schreef in plaats van 13 en daarna
netjes doorrekende, krijgt bij stap 2 tot 4 een vinkje en leest: *het ging
mis bij stap 1, daarna heb je met jouw eigen getal wél goed doorgerekend.*
Dat kan omdat `evalueerSom` elke stap naleest; de regel van één bewerking
per stap maakt dat mogelijk zonder rekenregels.

Voor de score telt alleen het eindantwoord.

## De vier stappen die elke som deelt

1. **Streep de getallen aan.** Het kind tikt in de tekst de getallen aan die
   het nodig heeft. Dit is de markeerstift die de juf ook gebruikt. Pas als
   ze allemaal aangestreept zijn komt het werkblad in beeld.
2. **Wat zoek je?** Lua zegt het in haar wolk: "Je zoekt: het aantal bussen."
   Niet de som overgeschreven, maar wat de vraag wil.
2b. **Wat doe je als eerste?** Vier aanpakken met dezelfde twee getallen,
   waarvan er één klopt. Hier zit het denkwerk: krijgt een kind het plan
   cadeau, dan oefent het alleen hoofdrekenen. Op niveau 1 en 2 slaan we
   deze stap over.
3. **De stappen.** Elk met een eigen naam, een eigen som en een eigen
   eenheid. Een stap die nog moet komen laat een `?` zien op de plek van een
   uitkomst die je zelf nog moet berekenen.
4. **Nakijken en terugblikken.** Je ziet per stap wat je opschreef en waar
   het misging. Daarna één vraag: *wat voor soort som was dit?* Pas als je
   die beantwoordt verschijnt de aanpak en de controle. Dat laatste is geen
   versiering: beginners sorteren opgaven op de buitenkant (kratten, bussen),
   experts op de techniek erachter, en die omslag oefen je hiermee.

## De hintladder

Vastlopen hoeft niet, maar het antwoord ligt niet voor het grijpen. De tip
van Lua heeft drie treden, elk een druk op dezelfde knop:

1. **Oriëntatie** — "Kijk nog eens naar wat je weet. Je zoekt …" Geen inhoud.
2. **Tactiek** — de aanpak van dit sometype, zonder de getallen van nu.
3. **De eerste som** — pas hier staat er iets concreets, en die trede gaat
   drie seconden op slot ("Denk er nog even over…").

Die drempel is er met reden: in onderzoek naar rekentutors klikt een flink
deel van de kinderen bij gratis hints meteen door naar het antwoord. Hints
kosten nooit punten — hulp vragen is een vaardigheid, geen straf.

## Hoe de steun afneemt

`steunVoorNiveau` in `games/math/redactie/catalogus.ts`:

| Niveau | Steun | Wat je ziet |
| --- | --- | --- |
| 1 – 2 | `volledig` | Alle stappen staan klaar, je ziet hoeveel werk er komt, en het aantal nog aan te strepen getallen staat erbij. De ritjessom schrijft hier de rest uit in vier stappen |
| 3 – 4 | `beknopt` | Alleen de stap waar je mee bezig bent. De ritjessom heeft nog twee stappen: de deling en de beslissing |
| 5 | `kaal` | Idem, en er staat niet meer bij hoeveel getallen je zoekt |

## Een type toevoegen

Een type is één bestand in `games/math/redactie/typen/`:

```ts
export const paaltjes: Sometype = {
  id: 'paaltjes',
  naam: 'Paaltjessom',          // zoals een kind de techniek onthoudt
  aanpak: '…',                   // de methode in één of twee zinnen
  valkuil: '…',                  // de fout die bijna iedereen hier maakt
  niveaus: [2, 3, 4, 5],
  maak(level, index, random) { return maakSom({ … }); },
};
```

Zet hem daarna in `REDACTIE_TYPEN` in `catalogus.ts`. Verder is niets nodig:
het werkblad, de tips en de controle werken voor elk type hetzelfde.

Regels voor `maak`:

- **Gebruik `index`.** Een deck van tien sommen pakt hetzelfde type meerdere
  keren; zonder variatie krijg je dezelfde som twee keer.
- **Elk getal in `nodig` staat letterlijk in het verhaal**, precies zoals het
  er staat (`'13.46'`, niet `'1346'`). Anders valt het niet aan te strepen.
- **Verwijs met `{1}` naar de uitkomst van stap 1.** Schrijf dat getal nooit
  zelf in de som van een latere stap: dan staat het antwoord er al.
- **Twee stappen is het minimum.** Een som van één stap is geen redactiesom.
- **Verberg de stap waarin de beslissing zelf de oefening is** (`verborgen`).
  '21 + 1' verklapt dat er een keer bij komt; dan hoeft een kind niet meer te
  kijken of er iets overblijft. Bij het nakijken staat de som er wél.
- **Laat de valkuil ook een keer níét opgaan.** De ritjessom komt één op de
  vier keer precies uit, zodat 'altijd eentje erbij' fout gaat. Anders leert
  een kind een regel in plaats van een redenering.
- **Eén bewerking per stap.** Nooit keer of delen in dezelfde stap als plus
  of min: `19 − 3 × 5` vraagt om rekenregels die een kind van negen nog niet
  heeft gehad. Splits het in `3 × 5` en daarna `19 − 15`. Een rij van
  dezelfde bewerking mag wel (`14 + 60 + 28`). Hier staat een test op.

## Wat er nog bij moet

Uit de werkbladen van groep 7/8 komen deze typen; de eerste vier zijn af.

Af: ritjessom · paaltjessom · tijdsom · procentsom.

Nog te doen: prijs per stuk · dozijn en gros · winkelsom met wisselgeld ·
breukdeel van een hoeveelheid (en omgekeerd) · kalendersom · snelheid ·
maten omrekenen · omtrek en oppervlakte · inhoud · som en verschil ·
verdeelsom met rest · omgekeerd redeneren · schaal · gemiddelde ·
strikvragen met een overbodig getal.

## De rekenmachine

In de balk boven de redactiesommen staat een neutraal rekenmachine-icoon.
Klik je erop, dan komt Charlotte's tekening in beeld als een echt apparaat:
de toetsen zijn doorzichtige vlakken die er precies overheen liggen,
opgemeten op de tekening zelf en bewaard in procenten, zodat ze meeschalen.

Hij staat er alleen bij de redactiesommen. Bij de tafels, de race en het
ontbrekende getal is het hoofdrekenen juist de oefening; daar zou een
rekenmachine het spel wegnemen.

De maten staan in `games/math/Rekenmachine.tsx`. Komt er ooit een andere
tekening, dan hoeven alleen die percentages opnieuw opgemeten te worden.
