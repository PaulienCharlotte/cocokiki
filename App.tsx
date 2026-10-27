
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from './components/platform/AppShell';
import { DESTINATIONS_BY_ID } from './platform/destinationRegistry';
import { GAMES_BY_ID } from './platform/gameRegistry';
import { resolveRoute } from './platform/routes';
import { CURRENCY_CHANGE_EVENT, loadCurrency } from './services/currency';
import './components/cooking/foundation.css';

const WorldHub = lazy(() => import('./pages/WorldHub'));
const DestinationScreen = lazy(() => import('./pages/DestinationScreen'));
const ChallengesScreen = lazy(() => import('./pages/ChallengesScreen'));
const TreehouseRoom = lazy(() => import('./pages/TreehouseRoom'));
const TreehouseSection = lazy(() => import('./pages/TreehouseSection'));
const TreehouseInterior = lazy(() => import('./pages/TreehouseInterior'));
const ShopScreen = lazy(() => import('./pages/ShopScreen'));
const PlantClinicScreen = lazy(() => import('./pages/PlantClinicScreen'));
const DesignSystemPreview = lazy(() => import('./pages/DesignSystemPreview'));
const ClockModule = lazy(() => import('./games/clock/ClockModule'));
const MathModule = lazy(() => import('./games/math/MathModule'));

const App: React.FC = () => {
  const [current, setCurrent] = useState(() => resolveRoute(window.location.pathname));
  const [coins, setCoins] = useState(loadCurrency);

  useEffect(() => {
    if (current.redirect) window.history.replaceState({}, '', `${current.route.path}${window.location.search}`);
  }, [current]);

  useEffect(() => {
    const onPopState = () => setCurrent(resolveRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onCurrencyChange = (event: Event) => setCoins((event as CustomEvent<number>).detail ?? loadCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, onCurrencyChange);
    const refresh = () => setCoins(loadCurrency());
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(CURRENCY_CHANGE_EVENT, onCurrencyChange); window.removeEventListener('storage', refresh); };
  }, []);

  const navigate = useCallback((path: string) => {
    const requested = new URL(path, window.location.origin);
    const next = resolveRoute(requested.pathname);
    window.history.pushState({}, '', `${next.route.path}${requested.search}`);
    setCurrent({ route: next.route, redirect: false });
    window.scrollTo({ top: 0 });
  }, []);

  const game = current.route.page === 'game' ? GAMES_BY_ID[current.route.gameId] : null;
  const GameModule = useMemo(() => game ? lazy(game.load) : null, [game]);

  if (current.route.page === 'home') return <Suspense fallback={<LoadingScreen />}>
    <WorldHub coins={coins} onNavigate={navigate} />
  </Suspense>;

  if (current.route.page === 'math') return <Suspense fallback={<LoadingScreen />}><MathModule onBack={() => navigate('/challenges')} /></Suspense>;

  const worldContent = current.route.page === 'destination'
      ? current.route.destinationId === 'treehouse'
        ? <TreehouseRoom onNavigate={navigate} />
        : current.route.destinationId === 'shop'
          ? <ShopScreen onNavigate={navigate} />
          : <DestinationScreen destination={DESTINATIONS_BY_ID[current.route.destinationId]} onNavigate={navigate} />
      : current.route.page === 'treehouse-section'
        ? <TreehouseSection section={current.route.section} onNavigate={navigate} />
      : current.route.page === 'treehouse-room'
        ? <TreehouseInterior room={current.route.room} onNavigate={navigate} />
      : current.route.page === 'plant-clinic'
        ? <PlantClinicScreen />
      : current.route.page === 'challenges'
        ? <ChallengesScreen onNavigate={navigate} />
      : current.route.page === 'clock'
        ? <ClockModule onBack={() => navigate('/challenges')} />
        : null;

  if (worldContent) return <AppShell
    coins={coins}
    onHome={() => navigate('/')}
    onBack={() => navigate(current.route.page === 'treehouse-section' ? (current.route.section === 'encyclopedia' ? '/treehouse' : '/treehouse/kitchen') : current.route.page === 'treehouse-room' ? '/treehouse' : current.route.page === 'clock' ? '/challenges' : current.route.page === 'plant-clinic' ? '/treehouse' : '/')}
    backLabel={current.route.page === 'treehouse-section' ? (current.route.section === 'encyclopedia' ? 'Terug naar de boomhut' : 'Terug naar de keuken') : current.route.page === 'treehouse-room' ? 'Terug naar de boomhut' : current.route.page === 'clock' ? 'Terug naar School' : current.route.page === 'plant-clinic' ? 'Terug naar de boomhut' : 'Terug naar de wereld'}
  ><Suspense fallback={<LoadingScreen />}>{worldContent}</Suspense></AppShell>;
  if (current.route.page === 'design-system') return <Suspense fallback={<LoadingScreen />}>
    <DesignSystemPreview onHome={() => navigate('/')} />
  </Suspense>;
  if (!GameModule) return null;
  return <Suspense fallback={<div className="platform-loading" role="status"><img src="/images/cocokiki-logo.png" alt="" />Spel laden...</div>}>
    <GameModule onHome={() => navigate('/')} onBack={() => navigate('/challenges')} />
  </Suspense>;
};

function LoadingScreen() {
  return <div className="platform-loading" role="status"><img src="/images/cocokiki-logo.png" alt="" />Spellenwereld laden...</div>;
}

export default App;
