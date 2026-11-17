import React, { useEffect, useState } from 'react';
import InfoKnop from '../components/ui/InfoKnop';
import CardGrid from '../components/ui/CardGrid';
import { FAVORITE_GAME_CATALOG, FAVORITE_GAMES_KEY, loadFavoriteGames } from '../services/favoriteGames';
import { subscribeLocalState } from '../services/localState';
import '../components/ui/favorite-games.css';
import '../components/dreamworld/wereld-scherm.css';

export default function MyGamesScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [favorites, setFavorites] = useState(loadFavoriteGames);
  useEffect(() => subscribeLocalState(() => setFavorites(loadFavoriteGames()), FAVORITE_GAMES_KEY), []);
  const selected = favorites.map(id => FAVORITE_GAME_CATALOG.find(game => game.id === id)!).filter(Boolean);
  const rest = FAVORITE_GAME_CATALOG.filter(game => !favorites.includes(game.id));
  const cards = (games: typeof selected) => games.map(game => ({ id: game.id, titel: game.title, beeld: game.image, onder: game.subtitle }));
  const open = (id: string) => { const game = FAVORITE_GAME_CATALOG.find(game => game.id === id); if (game) onNavigate(game.path); };
  return <main className="my-games"><div className="my-games__content">
    <h1>Alle spellen</h1>
    <nav className="ck-zone-gereedschap ck-glas" aria-label="Gereedschap"><InfoKnop titel="Spellen bewaren">Hier staan alle losse spellen bij elkaar. Bewaar je favorieten met een ster. Opdrachten van bewoners vind je op je To Do-lijst.</InfoKnop></nav>
    <section aria-label="Bewaarde spellen">{selected.length > 0 && <CardGrid favorieten vorm="plek" label="Mijn bewaarde spellen" cards={cards(selected)} onChoose={open} />}</section>
    <section><h2 className={selected.length ? undefined : 'sr-only'}>{selected.length ? 'Alle andere spellen' : 'Kies je spellen'}</h2><CardGrid favorieten vorm="plek" label="Spellen om te bewaren" cards={cards(rest)} onChoose={open} /></section>
  </div></main>;
}
