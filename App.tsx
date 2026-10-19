
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { GAMES_BY_ID } from './platform/gameRegistry';
import { resolveRoute } from './platform/routes';

const TreehouseModule = lazy(() => import('./games/treehouse/TreehouseModule'));

const App: React.FC = () => {
  const [current, setCurrent] = useState(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    if (current.redirect) window.history.replaceState({}, '', current.route.path);
  }, [current]);

  useEffect(() => {
    const onPopState = () => setCurrent(resolveRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    const next = resolveRoute(path);
    window.history.pushState({}, '', next.route.path);
    setCurrent({ route: next.route, redirect: false });
    window.scrollTo({ top: 0 });
  }, []);

  const game = current.route.page === 'game' ? GAMES_BY_ID[current.route.gameId] : null;
  const GameModule = useMemo(() => game ? lazy(game.load) : null, [game]);

  if (current.route.page === 'home') return <Suspense fallback={<LoadingScreen />}>
    <TreehouseModule onNavigate={navigate} />
  </Suspense>;
  if (!GameModule) return null;
  return <Suspense fallback={<div className="platform-loading" role="status"><img src="/images/logo-compas-geel.svg" alt="" />Spel laden...</div>}>
    <GameModule onHome={() => navigate('/')} />
  </Suspense>;
};

function LoadingScreen() {
  return <div className="platform-loading" role="status"><img src="/images/logo-compas-geel.svg" alt="" />Boomhut laden...</div>;
}

export default App;
