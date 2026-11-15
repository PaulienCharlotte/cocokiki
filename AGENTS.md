# CocoKiki UI-afspraken

**De huisstijl hieronder (`docs/HUISSTIJL.md`, `styles/cocokiki-tokens.css`
en `docs/voorbeelden/`) is leidend.** Waar `.claude/skills/cocokiki-ui/SKILL.md`
of `docs/ui-consistentie.md` daarmee botst, volg je de huisstijl. Gebruik die
twee alleen nog als achtergrond bij wat er nu al staat.

Spellen mogen anders werken, maar delen knoppen, topmenu, schermopbouw en taal. Houd een
overzicht een overzicht; extra uitleg hoort in het bestaande dialoogpatroon.

Personages blijven gekoppeld aan hun gebied: Coco bij koken, Kiki bij
planten, Baby Lua bij rekenen en Seb het stokstaartje bij topografie.
Gebruik voor compacte rekentips het bestaande spraakwolkpatroon als
referentie, geen nieuw los paneel of eigen overlay.

Controleer UI-wijzigingen op desktop en 360px breed, en voer tests en de
typecheck uit. Refactor bestaande afwijkingen per gebied, niet allemaal
tegelijk. Bewaar lokale wijzigingen en wijzigingen van andere agents.
Commit en push alleen op uitdrukkelijk verzoek van de gebruiker.

## Lokale server

De game draait al op localhost:3000. Start geen tweede server, gebruik die.

## Huisstijlbestanden (uit cocokiki_huisstijl_bestanden.zip)

Dit project is **CocoKiki**: een spel voor kinderen waarin ze leren zonder te merken dat ze leren.

### Huisstijl: altijd volgen
Voordat je iets aan de interface verandert of een nieuw scherm maakt:

1. Lees `docs/HUISSTIJL.md`.
2. Open de voorbeelden in `docs/voorbeelden/` (`winkelgekte.html`, `moestuin.html`) en kopieer hun opbouw: dezelfde zeven zones, dezelfde onderdelen, dezelfde beweging.
3. Gebruik alleen de variabelen en klassen uit `styles/cocokiki-tokens.css`. Verzin geen eigen kleuren, lettertypes, afrondingen, schaduwen, afmetingen of plekken. Schrijf geen losse kleurcodes (#...) in componenten.
4. Zet de juiste wereld op de container: `data-wereld="keuken|tuin|school|wereld|boomhut"`.
5. Maak bij voorkeur één gedeeld component per zone (bijvoorbeeld `<SpelScherm>` met slots voor personage, gereedschap, antwoorden en speelveld) en gebruik dat in elk spel. Zo kan een spel niet meer afwijken.

Als iets in de huisstijl niet beschreven staat, kies dan wat het meest op de voorbeelden lijkt. Meld dat in je samenvatting. Val nooit terug op een standaard of "neutrale" stijl.

### Controleer voordat je klaar bent
- [ ] Staan terug, statuseiland, menu, gereedschapsbalk, personage en antwoorden op hun vaste plek?
- [ ] Staat het gereedschap in de vaste volgorde, en alleen wat dit spel nodig heeft?
- [ ] Hangen prijzen, maten en hoeveelheden aan dingen in de wereld, in plaats van in een wit vak?
- [ ] Geen bladerknoppen, keuzelijsten of tussenschermen in het spel?
- [ ] Precies één terugknop, en hoogstens één hoofdknop in de wereldkleur?
- [ ] Alle tekst in Baloo 2 of Nunito, minstens 16 px, in cacao? Geen grijs of saliegroen?
- [ ] Werkt tikken én slepen? Krijgt elke actie beweging en geluid, en een goed antwoord vonken, munten en een uitrekkend statuseiland?
- [ ] Bij een fout: wiebel, hint van het personage en het juiste hulpmiddel licht op? Geen rood?
- [ ] Werkt het op desktop en op 360 px breed, zonder dat zones elkaar overlappen?

Noem in je samenvatting kort welke punten je hebt gecontroleerd.

### Technisch
- Als het project Tailwind of een andere stylingmethode gebruikt, koppel die aan de variabelen uit `cocokiki-tokens.css`. Maak geen tweede set kleuren.
- Pas `cocokiki-tokens.css` alleen aan als daar uitdrukkelijk om wordt gevraagd.
