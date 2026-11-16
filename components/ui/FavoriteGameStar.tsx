import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { IconButton } from '../../design-system';
import { canFavoriteGame, favoriteGameId, FAVORITE_GAMES_KEY, loadFavoriteGames, toggleFavoriteGame } from '../../services/favoriteGames';
import { subscribeLocalState } from '../../services/localState';
import './favorite-games.css';

export default function FavoriteGameStar({ id, name }: { id: string; name: string }) {
  const [favorites, setFavorites] = useState(loadFavoriteGames);
  const [error, setError] = useState('');
  useEffect(() => subscribeLocalState(() => setFavorites(loadFavoriteGames()), FAVORITE_GAMES_KEY), []);
  if (!canFavoriteGame(id)) return null;
  const selected = favorites.includes(favoriteGameId(id));
  return <span className="game-pin">
    <IconButton label={`${selected ? 'Verwijder uit' : 'Bewaar in'} Mijn spellen: ${name}`} aria-pressed={selected} icon={<Star fill={selected ? 'currentColor' : 'none'} />} onClick={() => {
      if (toggleFavoriteGame(id)) { setFavorites(loadFavoriteGames()); setError(''); }
      else setError('Bewaren lukte niet. Probeer het opnieuw.');
    }} />
    {error && <span className="game-pin__error" role="alert">{error}</span>}
  </span>;
}
