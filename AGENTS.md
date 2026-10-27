# CocoKiki UI-afspraken

Lees voor iedere wijziging aan een scherm, spel, dialoog of CSS:

- `.claude/skills/cocokiki-ui/SKILL.md`: de gedeelde vormtaal.
- `docs/ui-consistentie.md`: bestaande afwijkingen en prioriteiten.

Als deze bestanden nog niet lokaal aanwezig zijn, lees de versies op
`origin/main` met `git show`. Voeg geen eigen alternatieve vormtaal toe.

Gebruik de bestaande design-system-tokens en componenten. Spellen mogen
anders werken, maar delen knoppen, topmenu, schermopbouw en taal. Houd een
overzicht een overzicht; extra uitleg hoort in het bestaande dialoogpatroon.

Personages blijven gekoppeld aan hun gebied: Coco bij koken, Kiki bij
planten, Baby Lua bij rekenen en Seb het stokstaartje bij topografie.
Gebruik voor compacte rekentips het bestaande spraakwolkpatroon als
referentie, geen nieuw los paneel of eigen overlay.

Controleer UI-wijzigingen op desktop en 360px breed, en voer tests en de
typecheck uit. Refactor bestaande afwijkingen per gebied, niet allemaal
tegelijk. Bewaar lokale wijzigingen en wijzigingen van andere agents.
Commit en push alleen op uitdrukkelijk verzoek van de gebruiker.
