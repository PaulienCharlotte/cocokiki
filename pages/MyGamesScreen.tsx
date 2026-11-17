import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import FavoriteGameStar from '../components/ui/FavoriteGameStar';
import { FAVORITE_GAME_CATALOG, FAVORITE_GAMES_KEY, loadFavoriteGames } from '../services/favoriteGames';
import { subscribeLocalState } from '../services/localState';
import '../components/ui/favorite-games.css';
import './my-games.css';

function gameWorld(id: string) {
  if (['topo', 'clock', 'flags-memory'].includes(id)) return 'wereld';
  if (['nutrient-memory', 'taartenatelier'].includes(id)) return 'keuken';
  return 'school';
}

/** Een overzicht van speelkaartjes; de spellen houden hun eigen wereld. */
export default function MyGamesScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [favorites, setFavorites] = useState(loadFavoriteGames);
  useEffect(() => subscribeLocalState(() => setFavorites(loadFavoriteGames()), FAVORITE_GAMES_KEY), []);
  const selected = favorites.map(id => FAVORITE_GAME_CATALOG.find(game => game.id === id)!).filter(Boolean);
  const rest = FAVORITE_GAME_CATALOG.filter(game => !favorites.includes(game.id));
  const cards = (games: typeof selected, label: string) => <ul className="my-games__grid" aria-label={label}>
    {games.map(game => <li key={game.id} className="my-games__item" data-wereld={gameWorld(game.id)}>
      <button type="button" className="my-games__card ck-speelkaart ck-paper-surface" aria-label={`${game.title} openen`} onClick={() => onNavigate(game.path)}>
        <span className="my-games__art" aria-hidden="true">{game.image && <img src={game.image} alt="" loading="lazy" draggable={false} />}</span>
        <span className="my-games__caption"><strong>{game.title}</strong><ArrowUpRight aria-hidden="true" /></span>
      </button>
      <FavoriteGameStar id={game.id} name={game.title} />
    </li>)}
  </ul>;
  return <main className="my-games my-games--gallery" data-wereld="school" aria-labelledby="my-games-title">
    <div className="my-games__content">
      <header className="my-games__heading"><h1 id="my-games-title" className="ck-houtbord">Alle spellen</h1><p>Kies iets leuks om te spelen.</p></header>
      {selected.length > 0 && <section className="my-games__section" aria-labelledby="my-games-favorites"><h2 id="my-games-favorites" className="ck-glas">Jouw favorieten</h2>{cards(selected, 'Mijn bewaarde spellen')}</section>}
      <section className="my-games__section" aria-label={selected.length ? 'Alle andere spellen' : 'Kies een spel'}>
        {selected.length > 0 && rest.length > 0 && <h2 className="ck-glas">Nog meer ontdekken</h2>}
        {cards(rest, 'Spellen om te ontdekken')}
      </section>
    </div>
  </main>;
}
