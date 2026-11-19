# Ombouwplan huisstijl

Dit is het vaste plan om CocoKiki naar één huisstijl te brengen. Werk de
stappen op volgorde af en vink ze hier af. Begin niet aan iets dat niet in
dit plan staat. Komt er iets nieuws op, zet het dan onder **Later** en ga door.

**Leidend:** `docs/HUISSTIJL.md`, `styles/cocokiki-tokens.css`,
`docs/voorbeelden/` (en het overzicht `docs/cocokiki_huisstijl.html`).

**Werkafspraken:** één gebied tegelijk, testen op desktop en op 360 px breed,
tests en typecheck draaien, en alleen committen of pushen als Charlotte daar
uitdrukkelijk om vraagt. Claude en Codex werken in aparte mappen en
synchroniseren via GitHub. Codex heeft tot zondag 22 november 2026 geen tokens.

---

## Briefing van Charlotte (19 nov 2026)

Volledige wensen met screenshots: `docs/briefing/WENSEN.md`. Per wens waar het in dit plan zit:

| Wens | Status | Waar |
|---|---|---|
| 1. Alle opdrachten dezelfde interface | 🟡 bezig | Stap 3 (`<SpelScherm>`) + stap 5 per gebied |
| 2. Spraakwolk onderin | 🟡 keuken klaar; rekenen had het al | Stap 5: tuin, plantendokter, topo nog doen |
| 3. Geen pop-ups ("Goed ontdekt!", "Coco's kooktip") | ⬜ | Stap 5 keuken: reactie in de ballon, munten, vanzelf verder |
| 4. Eerst uitleg, dan de vraag (koken) | ⬜ | Stap 5 keuken: ontdekflow omdraaien |
| 5. Ballon max. 2 regels | ⬜ | Stap 5 per gebied; teksten inkorten |
| 6. Mobiel: geen panelen over elkaar | 🟡 | Stap 5: fornuis (08) en moestuin (10) hebben voorrang |
| 7. Boodschappen: tik op ingrediënt = naar product | ⬜ | Nieuw gebied in stap 5 |
| 8. App laadt traag | ⬜ | Zie "Snelheid" hieronder |

Ook uit de briefing: twee terugknoppen weg (keuken ontdekken ✅, groenten wassen,
boodschappen nog doen), interieur (01) is het goede voorbeeld, maar de bolletjes
liggen daar over een label.

## Snelheid (wens 8)

Gemeten 19 nov 2026: 103 afbeeldingen zijn groter dan 250 kB (samen 39 MB); veel
schermen laden er een paar van 500–800 kB. Alle vaste afbeeldingen krijgen nu
`max-age=0, must-revalidate`, dus de telefoon vraagt bij elk bezoek per plaatje
opnieuw na of het nog klopt. Phaser (1,6 MB) laadt alleen bij Baby Lua.

- ✅ A. Afbeeldingen een week bewaren in de browser, op de achtergrond verversen (`scripts/netlifyCacheHeaders.ts`). Werkt pas na een deploy naar Netlify. Vervang je een plaatje inhoudelijk: nieuwe bestandsnaam.
- ✅ B. 98 grote afbeeldingen lichter gemaakt: 36,2 → 25,0 MB (−31%), zelfde
  afmetingen en bestandsnamen, doorzichtigheid behouden. Nieuwe afbeeldingen:
  `npm run afbeeldingen:comprimeer` (hulpmiddel `sharp`, alleen lokaal).
  Nog te doen: kleinere telefoonversies voor de zwaarste achtergronden.
- ✅ C. Onderzocht: de drie ongebruikte zware bestanden (`lua-workshop.png`, `brace.png`, `landscape-v2.webp`, samen 3,9 MB) worden door de app nooit geladen. Weghalen maakt de app niet sneller; laten staan.

## Stap 1: inventariseren ✅ (19 nov 2026)

Er is nog niets veranderd. Losse kleurcodes per stijlbestand (excl. docs/public):

| Bestand | Losse kleuren | Opmerking |
|---|---|---|
| `pages/world.css` | 289 | Grootste brok, ook saliegroen |
| `app.css` | 225 | Algemene app-stijl |
| `games/math/math.css` | 47 | Rekenen |
| `design-system/tokens.css` | 32 | Oude kleurenset bovenop de huisstijl (o.a. `--color-sage`) |
| `games/clock/clock.css` | 27 | Klok |
| `design-system/components.css` | 16 | |
| `components/cooking/foundation.css` | 16 | Keuken |
| `games/math/flashcard.css` | 15 | Rekenen |
| `games/treehouse/treehouse.css` | 9 | Boomhut |
| `components/cooking/baking.css` | 7 | Keuken |
| `pages/schoolMathNavigation.css`, `components/treehouse/expansion.css` | 5 elk | |
| `components/dreamworld/dreamworld.css` | 4 | |
| Kleine resten (`cake-studio`, `choice-list`, `checkout`, `orders`, …) | 1–2 | |

Saliegroen komt nog voor in: `pages/world.css`, `design-system/tokens.css`,
`games/math/math.css`… en in de topografie (`topo-huisstijl.css`,
`topo-dialog.css`, `worksheet-map.css`) en `heat-interaction.css`.

Mogelijke bladerteksten ("… van 10") om te controleren:
`games/math/AdventureScenes.tsx`, `games/red-baby-lua/RedBabyLuaGame.tsx`,
`pages/TasksScreen.tsx`, `components/cooking/BakingInteractions.tsx`,
`components/cooking/IngredientDiscoveryCard.tsx`, `components/cake/CakeCanvas.tsx`.

Goed nieuws: de huisstijlbestanden per spel (`rekenspel.css`, `winkelgekte.css`,
`lua-huisstijl.css`, `klok-huisstijl.css`, `bakkerij-stijl.css`, `garden.css`,
`memory-huisstijl.css`) hebben al geen losse kleuren meer.

## Stap 2: oude stijlinstructies uitschakelen ✅ (19 nov 2026)

Bovenaan deze bestanden staat nu "Verouderd, niet meer leidend":
- `.claude/skills/cocokiki-ui/SKILL.md`
- `docs/cocokiki-style-skill/SKILL.md`
- `docs/ui-consistentie.md`

## Stap 3: gedeeld schermcomponent ✅ goedgekeurd (19 nov 2026)

Eén `<SpelScherm>` met de zeven vaste zones (terug, statuseiland, menu,
gereedschapsbalk, personage, antwoorden/hoofdknop, speelveld) plus bel,
hangkaartje, doel en paneel. Op een testpagina, bestaande spellen blijven
ongemoeid. **Charlotte keurt goed voordat stap 4 begint.**

- Component: `design-system/components/SpelScherm.tsx` (+ `design-system/spelscherm.css`, `design-system/geluid.ts`)
- Testpagina: `/spelscherm-test` (`pages/SpelSchermTest.tsx`), een kassa-som met Baby Lua
- Typecheck en build slagen. Tests: 491 goed, 1 faalt (economie, 181 ≠ 182), maar die faalde al vóór deze wijziging.
- Bekeken op desktop en 360 px: alles op zijn plek, geen overlap.

**Besloten (19 nov 2026):** de gereedschapsbalk staat **links**, onder de
terugknop. Aangepast in `cocokiki-tokens.css` (basisregel), `HUISSTIJL.md`,
`cocokiki_huisstijl.html` (tekst; de plaatjes tonen nog rechts), beide
voorbeelden, `PROMPT.md` en de checklist in `AGENTS.md`. Antwoorden staan nu
helemaal rechtsonder.

## Stap 4: `design-system/tokens.css` laten doorverwijzen ✅ (19 nov 2026)

Alle oude variabelen (`--color-…`) verwijzen nu naar de huisstijl (`--ck-…`);
er staat geen enkele losse kleurcode meer in het bestand. Eigen keuzes:
- saliegroen → licht tuingroen (mix van `--ck-tuin` en `--ck-room`)
- foutkleur (was roodachtig) → `--ck-hout-donker`, want nooit rood
- grijze bijtekst → `--ck-cacao-zacht`; grijze randen → `--ck-schaduw-rand`
- perzik, lila, lucht → lichte mix van keuken, druif en wereld met room

Bekeken: eiland, moestuin, school en topografiekaart zien er goed uit.

## Tussendoor: versleepbare gereedschapsbalk ✅ (19 nov 2026)

Op verzoek van Charlotte: de balk staat soms over sommen of tekst (bijv. de
redactiesommen op telefoon). Elke gereedschapsbalk heeft nu een greep en is
versleepbaar, met een onthouden plek en dubbeltik om terug te zetten.
In stap 5 blijft het doel dat schermen op 360 px zelf ruimte laten voor de balk.

## Stap 5: per gebied ombouwen ⬜

Telkens één gebied, met het gedeelde component, en testen op desktop + 360 px.

1. 🟡 Rekenen – ronde 1 klaar (19 nov 2026):
   - ✅ Alle losse kleurcodes weg uit `math.css`, `flashcard.css`, `clock.css`,
     `checkout.css`, `schoolMathNavigation.css` (vervangen door de dichtstbijzijnde
     huisstijlkleur, zelfde doorzichtigheid).
   - ✅ Werkblad (o.a. redactiesommen) laat op telefoon links ruimte voor de balk.
   - ✅ Ronde 2a: het bladerboekje met "Som 1 … Som 10" is weg bij de redactiesommen;
     voortgang staat nu als tikbare bolletjes in het statuseiland (zoals de huisstijl wil).
   - ✅ Statuseiland botst niet meer met het menu: op middelgrote schermen en telefoon
     krijgt het een eigen rij onder de bovenbalk.
   - ✅ **Besloten (19 nov 2026): de redactiesom blijft op een schrift.** Voor nu houden
     we het gelinieerde vel zoals het is; later vervangen door een getekend schrift
     (asset, zie hieronder). Geen verhaal-in-de-wereld per som.
   - ⬜ Ronde 2, de echte ombouw naar `<SpelScherm>`: vraag in de wereld in plaats
     van op een wit gelinieerd vel; voortgang als bolletjes in het statuseiland;
     "1/5" bij de klok weg; hoofdknoppen volgens de huisstijl.
   - ✅ Baby Lua: menu staat op telefoon naast de balk (het grijs was alleen een
     weergavefout in de telefoonpreview; op desktop en nu ook op 360 px is het goed).
   - ✅ Klok: "1/5" en "x/y paren" vervangen door bolletjes; op telefoon ruimte voor de balk.
     (Nog niet in het statuseiland: dat wacht op het app-brede menupunt.)
   - ⬜ Huiswerkbladen-kiezer: tekst op de kaartjes is erg licht.
2. ⬜ Tuin (Kiki) – heeft al een voorbeeld. Wensen van Charlotte (19 nov 2026):
   - Moestuinbakken veel groter; ze vullen het veld, vooral op telefoon (nu te smal).
   - In een bak staat het **plaatje van wat er groeit** (wortel, radijs …) in plaats van
     een afgekapte naam ("W…"). Plaatjes van alle zes gewassen bestaan al
     (`data/plants/garden.ts`). Naam mag als hangkaartje erbij.
   - Liefst groeistadia per gewas (zaadje → plantje → oogstklaar). Die plaatjes
     bestaan nog niet: kunnen buiten Codex gegenereerd worden (zie Assets).
3. 🟡 Keuken (Coco) – begonnen (19 nov 2026):
   - ✅ `<SpeechBubble vast>`: de ballon staat vast linksonder (zone 5). Aan bij de
     ontdekvraag in een kookavontuur.
   - ✅ Ook vast linksonder: kooktips/coach tijdens het koken, de toonbank,
     de bestelling, "hoeveel maak je er" en het afleveren. Kaarten laten ruimte.
   - ✅ Kookavontuur (ontdekken): tweede terugknop weg; de terugknop linksboven gaat
     nu één laag terug naar het kookboek (`registerBackHandler`). "0/9" is bolletjes.
   - ⬜ Nog niet in de browser gezien: de kookstap zelf en het afleveren (lastig te
     bereiken); wel getypecheckt.
   - ⬜ Andere kookavontuur-stappen (voedingsmemory, koken) hebben mogelijk nog een
     eigen terugknop; zelfde aanpak toepassen.
   - ⬜ Uitleg in `IngredientDiscoveryCard`: lange tekst, eerst inkorten tot max. twee
     regels, de rest als verzamelkaart; daarna ook vast zetten.
4. ⬜ Topografie (Seb)
5. ⬜ Boomhut en dreamworld
6. ⬜ Wereldkaart (`pages/world.css`)

## App-breed (nog in te plannen)

- ✅ **Menu rechtsboven** (19 nov 2026): nu munten · winkel · To Do · profiel, op elk
  scherm gelijk. Wereldkaart, boomhut, alle spellen en encyclopedie zitten in het
  profielmenu; het hamburgermenu op telefoon is weg. Het statuseiland staat op
  desktop weer midden boven. Nog open: de munten horen volgens de huisstijl in het
  statuseiland; dat kan zodra elk spel `<SpelScherm>` gebruikt.

## Stap 6: `app.css` opschonen ⬜

Losse kleuren die na stap 5 nog over zijn, vervangen of weghalen.

---

## Assets die buiten Codex gegenereerd kunnen worden

Tot Codex weer werkt kan Charlotte assets laten maken. Per gebied, na stap 3
concreet te maken wat er nodig is (prompts staan in `docs/asset-prompts/` en
de bestaande `*-assets.md`-bestanden). Zet nieuwe assets in `_inbox-…`-mappen
zodat ze apart van de code blijven tot ze verwerkt worden.

**Nu al te maken (rekenen):** één opengeslagen getekend schrift (lichte lijntjes,
rode kantlijn mag niet: gebruik een zachte houtkleur), recht van voren gezien, groot genoeg
om een redactiesom op te zetten (liggend én staand bruikbaar, of twee versies).
Geen tekst erop. Zet het in `_inbox-rekenen/`.

**Nu al te maken (moestuin):** per gewas drie groeistadia, van bovenaf of schuin
gezien zodat ze in een moestuinbak passen: radijs, wortel, kropsla, aardbei,
tomaat, sperzieboon × (jong plantje, halfgroot, oogstklaar) = 18 plaatjes.
Transparante achtergrond, .webp of .png, zelfde tekenstijl als
`public/assets/library/plants/garden/radish.webp`. Zet ze in `_inbox-moestuin/`.

## Later

(Nieuwe ideeën die niet in dit plan horen, komen hier.)
