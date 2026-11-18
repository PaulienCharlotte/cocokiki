# Uitlijning en opdrachten — 16 november 2026

18 november: de To Do-header heeft een aparte volle rij voor categoriefilters. Illustratie, titel en dagopdracht delen de bovenste rij; de dagknop staat in een eigen gridkolom. Binnenmarges zijn 10% van het papier, zodat ook de slagschaduw binnen de gestikte rand blijft. Op 360 px komen de dagopdracht en knop onder de titel, met dezelfde veilige marges. Luna gebruikt het oorspronkelijke blonde meisje (`kiki.webp`); de profielavatar met stabiel id `avonturier` heet nu Kai. Bestaande profielkeuzes blijven geldig.

Opdrachtpapier rekent zijn buitenmaat inclusief padding. Tekst en beloningen
hebben een flexibele breedte en blijven binnen de gestikte rand. Op 360px staat
er één opdracht per rij. De huisjes gebruiken grotere medaillons met 94%
beeldvulling. Het saldo verhuist op 601–1200px naar het hoofdmenu, zodat de
centrale munt niet onder dat menu kan vallen.

Kloklezen wisselt rondes af: wijzers zetten, klok herkennen, tijdsverschillen,
memory. Verder kiest de volgende vorm; overslaan zit bij de hulpmiddelen.
Wereldklokken staan daar als calculator, zonder tweede horizontale menubalk.

Afgeronde eenmalige opdrachten verdwijnen uit To Do en komen in de
encyclopedie onder Mijn opdrachten. Het archief leest de oorspronkelijke
bestelstatus, taartbezorging en babykamerstatus; geen dubbele opslag. De
bestaande accountopslag neemt deze voortgang mee. Vrije oefenspellen blijven
bereikbaar; die zijn geen eenmalige opdrachten.

## Snel meer opdrachten maken

Gebruik het bestaande Bestelling-schema in data/cooking/orders.ts: stabiel id,
klant, korte aanleiding, wens, eters, één eis en dankwoord. De bestaande motor
controleert receptkeuze en aantallen; er is geen nieuw spel nodig. Genereer
varianten uit gecontroleerde sjablonen en laat vóór toevoegen controleren dat
minstens één speelbaar recept voldoet. Een opdracht krijgt een blijvend id,
nooit een nieuw willekeurig id bij openen, zodat afronden blijvend is.

## Economie: concrete huidige verhoudingen

Basisbeloning: 2 munten per zelfstandig goed antwoord. Een ronde van vijf is
10. Dagvragen geven 10 per goed antwoord, maximaal 50 per dag. Moeilijkere
rekensommen kunnen een extra niveau- of snelheidsbeloning geven.

| Voorwerp | Prijs | Goede basisantwoorden | Dagvragen bij alles goed |
| --- | ---: | ---: | ---: |
| Boekenstapeltje | 15 | 8 | 2 |
| Eetkamerstoel | 40 | 20 | 4 |
| Saliegroene bank | 90 | 45 | 9 |
| Linnenbank | 100 | 50 | 10 |
| Ligbad | 150 | 75 | 15 |

Dit bevoordeelt dagelijkse vragen sterk boven langer spelen. De klacht is
aannemelijk: een kamer vullen vraagt veel herhaling. Voorstel: kleine decoratie
10–20, gewone meubels 30–60, bijzondere meubels 80–100; dagelijkse vragen
behouden, gewone rondes dichter bij 15–25 munten brengen. Eerst één onderdeel
balanceren en met de kinderen spelen, dan pas alle prijzen aanpassen. Prijzen
en bestaande aankopen zijn in deze wijziging niet aangepast.
