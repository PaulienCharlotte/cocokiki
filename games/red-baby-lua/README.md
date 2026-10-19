# Red Baby Lua!

Baby Lua is een lazy-loaded Phaser-module binnen de bestaande CocoKiki React-app.

## Starten

```bash
npm install
npm run dev
```

Open `/games/red-baby-lua`. Gebruik `npm test`, `npx tsc --noEmit` en `npm run build` voor controle.

## Structuur

- `RedBabyLuaPage.tsx`: koppeling met de gedeelde CocoKiki-shell.
- `RedBabyLuaGame.tsx`: toegankelijke React-bediening en sessiestate.
- `game/config.ts`: precies een Phaser-instantie per mount.
- `game/scenes/PlayScene.ts`: jungle, Lua, steen en animaties.
- `game/systems`: pure sommen, score, opslag en audio.

De jungle en Lua staan als vervangbare rasterassets in `public/assets/baby-lua/`. De posebladen gebruiken een vast 4x2-raster, zodat Phaser geen figuren meer automatisch hoeft uit te snijden. De stenen blijven in `public/games/red-baby-lua/rocks.png`. Illustratie, spelregels en React-bediening blijven hierdoor los van elkaar.

De game bevat drie spelmodi en vijf vraagvormen: uitrekenen, ontbrekende factor, juist/onjuist, vergelijken en de passende som vinden. Moeilijkheid beweegt binnen een sessie mee met reeksen goede antwoorden en extra pogingen. Voorkeuren en records behouden de bestaande sleutels met prefix `cocokiki:baby-lua:v1:`; oude `calm`-voorkeuren worden automatisch gemigreerd. Het saldo gebruikt ongewijzigd de gedeelde CocoCoins-service. De vaste ontwerpregels staan in `docs/cocokiki-style-skill/SKILL.md`.
