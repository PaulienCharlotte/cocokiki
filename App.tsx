
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from './components/platform/AppShell';
import { DESTINATIONS_BY_ID } from './platform/destinationRegistry';
import { GAMES_BY_ID } from './platform/gameRegistry';
import { resolveRoute, type AppRoute } from './platform/routes';
import { CURRENCY_CHANGE_EVENT, loadCurrency } from './services/currency';
import './components/cooking/foundation.css';
import { guardedNavigation, hasNavigationGuard } from './services/navigationGuard';
import { ISLANDS_BY_ID, islandForActivity } from './platform/dreamworld';
import './components/dreamworld/dreamworld.css';
import './components/memory-compact.css';

const WorldHub = lazy(() => import('./pages/WorldHub'));
const DestinationScreen = lazy(() => import('./pages/DestinationScreen'));
const TreehouseRoom = lazy(() => import('./pages/TreehouseRoom'));
const TreehouseUnitTest = lazy(() => import('./pages/TreehouseUnitTest'));
const CookbookScreen = lazy(() => import('./pages/CookbookScreen'));
const EncyclopediaScreen = lazy(() => import('./pages/EncyclopediaScreen'));
const TreehouseInterior = lazy(() => import('./pages/TreehouseInterior'));
const ShopScreen = lazy(() => import('./pages/ShopScreen'));
const PlantClinicScreen = lazy(() => import('./pages/PlantClinicScreen'));
const DesignSystemPreview = lazy(() => import('./pages/DesignSystemPreview'));
const ClockModule = lazy(() => import('./games/clock/ClockModule'));
const MathModule = lazy(() => import('./games/math/MathModule'));
const IslandEnvironment = lazy(() => import('./pages/IslandEnvironment'));
const DecorShop = lazy(() => import('./components/shop/DecorShop'));
const PlantFamilyPanel = lazy(() => import('./components/plants/PlantFamilyPanel'));
const FlagsMemory = lazy(() => import('./pages/FlagsMemory'));

/** Waar de terugknop je brengt, per pagina. */
const BACK_TARGET: Partial<Record<AppRoute['page'], { path: string; label: string }>> = {
  store: { path: '/shop', label: 'Terug naar winkels' },
  'treehouse-section': { path: '/treehouse/kitchen', label: 'Terug naar de keuken' },
  'treehouse-room': { path: '/treehouse', label: 'Terug naar de boomhut' },
  'plant-clinic': { path: '/treehouse', label: 'Terug naar de boomhut' },
  encyclopedia: { path: '/', label: 'Terug naar de wereld' },
  clock: { path: '/challenges', label: 'Terug naar School' },
};

const App: React.FC = () => {
  const [current, setCurrent] = useState(() => resolveRoute(window.location.pathname));
  const [coins, setCoins] = useState(loadCurrency);

  useEffect(() => {
    if (current.redirect) window.history.replaceState({}, '', `${current.route.path}${window.location.search}`);
  }, [current]);

  useEffect(() => {
    const onPopState = () => {
      if (!hasNavigationGuard()) { setCurrent(resolveRoute(window.location.pathname)); return; }
      const destination = window.location.pathname + window.location.search;
      if (resolveRoute(window.location.pathname).route.path === current.route.path) return;
      window.history.pushState({}, '', current.route.path);
      guardedNavigation(() => {
        window.history.replaceState({}, '', destination);
        setCurrent(resolveRoute(window.location.pathname));
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [current.route.path]);

  useEffect(() => {
    const onCurrencyChange = (event: Event) => setCoins((event as CustomEvent<number>).detail ?? loadCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, onCurrencyChange);
    const refresh = () => setCoins(loadCurrency());
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(CURRENCY_CHANGE_EVENT, onCurrencyChange); window.removeEventListener('storage', refresh); };
  }, []);

  const navigate = useCallback((path: string) => {
    guardedNavigation(() => {
      const requested = new URL(path, window.location.origin);
      const next = resolveRoute(requested.pathname);
      window.history.pushState({}, '', `${next.route.path}${requested.search}`);
      setCurrent({ route: next.route, redirect: false });
      window.scrollTo({ top: 0 });
    });
  }, []);

  const game = current.route.page === 'game' ? GAMES_BY_ID[current.route.gameId] : null;
  const GameModule = useMemo(() => game ? lazy(game.load) : null, [game]);

  if (current.route.page === 'home') return <Suspense fallback={<LoadingScreen />}>
    <WorldHub coins={coins} onNavigate={navigate} />
  </Suspense>;

  const parentIsland = islandForActivity(current.route.path + window.location.search);
  const backTarget = current.route.page === 'plant-clinic' || current.route.path === '/treehouse' ? { path: '/', label: 'Terug naar Dreamworld' } : parentIsland ? { path: parentIsland.path, label: `Terug naar ${parentIsland.label.toLowerCase()}` } : BACK_TARGET[current.route.page];
  const back = () => navigate(backTarget?.path ?? '/');
  const worldContent = current.route.page === 'island'
      ? <IslandEnvironment island={ISLANDS_BY_ID[current.route.islandId]} onNavigate={navigate} />
      : current.route.page === 'math'
      ? current.route.mathGame ? <MathModule key={current.route.path} initialGame={current.route.mathGame} onBack={() => navigate('/islands/math')} onHome={() => navigate('/')} /> : <IslandEnvironment island={ISLANDS_BY_ID.math} onNavigate={navigate} />
      : current.route.page === 'store'
      ? current.route.store === 'groceries' ? <ShopScreen key={current.route.path + window.location.search} initialStore="groceries" onExit={() => navigate('/shop')} onNavigate={navigate} /> : <DecorShop key={current.route.store} store={current.route.store} onBack={back} />
      : current.route.page === 'plant-collection'
      ? <div className="dream-plant-collection"><PlantFamilyPanel onNavigate={navigate} onClose={() => navigate('/')} /></div>
      : current.route.page === 'flags-memory'
      ? <FlagsMemory onBack={back} />
      : current.route.page === 'game' && GameModule
      ? <GameModule onHome={() => navigate('/')} onBack={back} />
      : current.route.page === 'destination'
      ? current.route.destinationId === 'treehouse'
        ? <TreehouseRoom onNavigate={navigate} />
        : current.route.destinationId === 'shop'
          ? <ShopScreen onNavigate={navigate} />
          : <DestinationScreen destination={DESTINATIONS_BY_ID[current.route.destinationId]} onNavigate={navigate} />
      : current.route.page === 'treehouse-section'
        ? <CookbookScreen onNavigate={navigate} />
      : current.route.page === 'treehouse-unit-test'
        ? <TreehouseUnitTest />
      : current.route.page === 'encyclopedia'
        ? <EncyclopediaScreen key={current.route.path + window.location.search} onNavigate={navigate} />
      : current.route.page === 'treehouse-room'
        ? <TreehouseInterior room={current.route.room} onNavigate={navigate} />
      : current.route.page === 'plant-clinic'
        ? <PlantClinicScreen />
      : current.route.page === 'challenges'
        ? <IslandEnvironment island={ISLANDS_BY_ID.math} onNavigate={navigate} />
      : current.route.page === 'clock'
        ? <ClockModule onBack={() => navigate('/islands/discovery')} />
        : null;

  if (worldContent) return <div className="dream-app"><AppShell
    coins={coins}
    onHome={() => navigate('/')}
    onNavigate={navigate}
    activePath={current.route.path}
    onBack={back}
    backLabel={backTarget?.label ?? 'Terug naar Dreamworld'}
  ><Suspense key={current.route.path + window.location.search} fallback={<LoadingScreen />}>{worldContent}</Suspense></AppShell></div>;
  if (current.route.page === 'design-system') return <Suspense fallback={<LoadingScreen />}>
    <DesignSystemPreview onHome={() => navigate('/')} />
  </Suspense>;
  return null;
};

function LoadingScreen() {
  return <div className="platform-loading" role="status"><img src="/images/cocokiki-logo.png" alt="" />Spellenwereld laden...</div>;
}

export default App;
