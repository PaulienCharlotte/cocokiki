import { TRAVEL_ADVENTURES } from '../data/travel/adventures';
import { loadTravelAdventures, startTravelAdventure } from '../services/travelAdventures';
import { subscribeLocalState } from '../services/localState';
import { TASK_REWARDS } from '../services/taskRewards';
import { GARDEN_CROPS } from '../data/plants/garden';
import { completedTasks } from '../services/completedTasks';
import { PLANT_DOCTOR_EMBLEM } from '../data/plants/branding';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, Armchair, CalendarDays, ChefHat, Sprout, Calculator } from 'lucide-react';
import { IconButton } from '../design-system';
import InfoKnop from '../components/ui/InfoKnop';
import DailyPractice from '../components/quiz/DailyPractice';
import { CHARACTERS } from '../data/characters';
import { loadCookingProgress, saveCookingProgress } from '../services/cookingProgress';
import { lopendeBestelling, neemBestellingAan, openBestellingen } from '../services/bakeryOrders';
import { loadCakeOrder } from '../services/cakeOrder';
import { loadNursery } from '../services/nurseryProject';
import { BESTELLINGEN } from '../data/cooking/orders';
import { LEARNING_COINS } from '../services/learningReward';
import { DAILY_KEY, DAILY_REWARD, loadDailyPractice, dailyEarned } from '../services/dailyPractice';
import { TRAVEL_STEP_TOTAL } from '../services/travelJourney';
import './tasks.css';

type Area = 'rekenen' | 'alles' | 'bakken' | 'planten' | 'inrichten' | 'reizen' | 'vandaag';
/** Elk gebied heeft de kleur van zijn wereld uit de huisstijl. */
const WERELD: Record<string, string> = { bakken: 'keuken', planten: 'tuin', inrichten: 'boomhut', reizen: 'wereld', rekenen: 'school', vandaag: 'school', alles: 'boomhut' };
const areas: Array<{ id: Area; name: string; icon: React.ReactNode }> = [
  { id: 'alles', name: 'Alles', icon: null }, { id: 'rekenen', name: 'Rekenen', icon: <Calculator /> }, { id: 'bakken', name: 'Bakken', icon: <ChefHat /> }, { id: 'planten', name: 'Planten', icon: <Sprout /> }, { id: 'inrichten', name: 'Inrichten', icon: <Armchair /> }, { id: 'reizen', name: 'Reizen', icon: <Compass /> }, { id: 'vandaag', name: 'Vandaag', icon: <CalendarDays /> },
];
export default function TasksScreen({ coins = 0, onNavigate }: { coins?: number; onNavigate: (path: string) => void }) {
  const strip = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });
  const drag = useRef<{ x: number; scroll: number } | null>(null);
  const slide = (direction: number) => strip.current?.scrollBy({ left: direction * strip.current.clientWidth * .85, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const requested = new URLSearchParams(window.location.search).get('gebied');
  const [area, setArea] = useState<Area>(areas.some(a => a.id === requested) ? requested as Area : 'alles');
  const [notice, setNotice] = useState('');
  const [daily, setDaily] = useState(loadDailyPractice);
  useEffect(() => subscribeLocalState(() => setDaily(loadDailyPractice()), DAILY_KEY), []);
  const dailyDone = Object.keys(daily.answers).length;
  const progress = loadCookingProgress(), active = lopendeBestelling(progress), projectComplete = loadNursery().stage === 'complete';
  const rewardFor = (id: string) => (TRAVEL_ADVENTURES.find(item => item.id === id) ? TRAVEL_ADVENTURES.find(item => item.id === id)!.reward + TRAVEL_STEP_TOTAL : undefined) ?? BESTELLINGEN.find(order => order.id === id)?.bonus ?? (id === 'cake' ? TASK_REWARDS.cake : id === 'nursery' ? TASK_REWARDS.nurseryMax : id === 'clinic' ? TASK_REWARDS.clinic : id === 'garden' ? Math.max(...GARDEN_CROPS.map(crop => crop.coins)) : LEARNING_COINS);
  const finished = new Set(completedTasks().map(task => task.id));
  const travel = loadTravelAdventures();
  const candidates = [
    ...TRAVEL_ADVENTURES.map(adventure => ({ id: adventure.id, area: 'reizen', titel: adventure.title, onder: 'Ontdek weetjes, speel memory en verken de kaart.', beeld: adventure.image })),
    ...openBestellingen(progress).map(order => ({ id: order.id, area: 'bakken', titel: `Bak voor ${CHARACTERS[order.klant].naam}`, onder: order.aanleiding, beeld: CHARACTERS[order.klant].beeld, meta: active?.bestelling.id === order.id ? 'Verder met je bestelling' : 'Bakken' })),
    { id: 'cake', area: 'bakken', titel: 'Sebs verjaardagstaart', onder: 'Versier een taart voor Sebs zusje.', beeld: '/assets/library/cooking/taarten/roze-rand.webp', meta: loadCakeOrder().delivered ? 'Afgeleverd' : 'Taart versieren' },
    { id: 'tempo', area: 'rekenen', titel: 'Lua’s tempotoets', onder: 'Oefen één minuut keer- en deelsommen. Zo vaak als je wilt.', beeld: '/games/school/math/race.webp', meta: 'Munten voor elke goede som' },
    { id: 'shop-race', area: 'bakken', titel: 'Help in de winkel', onder: 'Reken af voor klanten in Winkelgekte.', beeld: '/games/school/math/race.webp' },
    { id: 'clinic', area: 'planten', titel: 'Help een plant', onder: 'Ontdek wat de plant nodig heeft.', beeld: PLANT_DOCTOR_EMBLEM },
    { id: 'garden', area: 'planten', titel: 'Zaaien en verzorgen', onder: 'Ga verder in je moestuin.', beeld: '/assets/library/plants/garden/navigation.webp' },
    { id: 'nursery', area: 'inrichten', titel: 'Luna’s babykamer', onder: 'Meten, kiezen en inrichten met een projectbudget van 500.', beeld: '/assets/library/projects/luna-crib.webp', meta: projectComplete ? 'Afgerond' : `Tot ${TASK_REWARDS.nurseryMax} CocoCoins` },
  ].filter(card => !finished.has(card.id));
  // Eén vaste plek per categorie; een lopende opdracht krijgt voorrang.
  const categoryOrder = ['bakken', 'reizen', 'planten', 'rekenen', 'inrichten'];
  const cards = categoryOrder.flatMap(category => {
    if (area !== 'alles' && area !== category) return [];
    const options = candidates.filter(card => card.area === category);
    const currentId = category === 'reizen' ? travel.active?.adventureId : category === 'bakken' ? active?.bestelling.id : undefined;
    const card = options.find(item => item.id === currentId) ?? options[0];
    return card ? [card] : [];
  });
  useEffect(() => {
    const node = strip.current; if (!node) return;
    const update = () => { const prev = node.scrollLeft > 2, next = node.scrollLeft + node.clientWidth < node.scrollWidth - 2; setEdges(old => old.prev === prev && old.next === next ? old : { prev, next }); };
    update(); node.addEventListener('scroll', update);
    const observer = new ResizeObserver(update); observer.observe(node);
    return () => { node.removeEventListener('scroll', update); observer.disconnect(); };
  }, [area, cards.length]);
  const choose = (id: string) => {
    if (TRAVEL_ADVENTURES.some(item => item.id === id)) {
      if (!startTravelAdventure(id)) { setNotice('Bewaren lukte niet. Probeer opnieuw.'); return; }
      onNavigate(`/games/topo?avontuur=${encodeURIComponent(id)}&from=tasks`); return;
    }
    if (id === 'tempo') { onNavigate('/school/math/multiply?tempo=1&from=tasks'); return; }
    if (id === 'daily') { onNavigate('/opdrachten?gebied=vandaag'); return; }
    if (id === 'nursery') { onNavigate('/opdrachten/luna-babykamer?from=tasks'); return; }
    if (id === 'shop-race') { onNavigate('/school/math/race?from=tasks'); return; }
    if (id === 'clinic') { onNavigate('/plantendokter?from=tasks'); return; }
    if (id === 'garden') { onNavigate('/plants/garden?from=tasks'); return; }
    if (id === 'cake') { onNavigate('/games/taartenatelier?order=seb-birthday&from=tasks'); return; }
    const next = active?.bestelling.id === id ? progress : neemBestellingAan(progress, id);
    if (!saveCookingProgress(next)) { setNotice('Opslaan lukte niet. Probeer het opnieuw.'); return; }
    onNavigate('/cooking/orders?from=tasks');
  };
  return <main className="tasks-screen" data-wereld="boomhut">
    <section className="tasks-screen__content">
      <header className="tasks-paper ck-paper-surface">
        <img className="tasks-paper__art" src="/assets/library/ui/daily-quest.webp" alt="" />
        <div className="tasks-paper__body">
          <div className="tasks-paper__heading"><h1 className="tasks-bord">To Do</h1><InfoKnop titel="Opdrachten en beloningen" character="coco">Help een bewoner en verdien munten. Sebs reis geeft een extra bonus als je een 10 haalt op de hele toets. Oefenen blijft daarnaast gewoon munten opleveren.</InfoKnop></div>
          <nav className="tasks-filters" aria-label="Soort opdracht">{areas.map(item => <button type="button" key={item.id} className="tasks-filter" data-wereld={WERELD[item.id]} aria-pressed={area === item.id} onClick={() => { setArea(item.id); strip.current?.scrollTo({ left: 0 }); const url = new URL(window.location.href); url.searchParams.set('gebied', item.id); window.history.replaceState({}, '', url); }}>{item.icon}<span>{item.name}</span></button>)}</nav>
          <section className="tasks-daily" aria-labelledby="tasks-vandaag"><div className="tasks-daily__content"><h2 id="tasks-vandaag">Vijf voor vandaag</h2><span className="tasks-daily__reward"><span className="ck-munt" aria-hidden="true" />{dailyDone === 5 ? `${dailyEarned(daily)} verdiend` : `Tot +${DAILY_REWARD * 5}`} · {dailyDone}/5</span></div><button type="button" className="ck-knop ck-knop--hoofd" onClick={() => choose('daily')}>{dailyDone === 5 ? 'Bekijk resultaat' : dailyDone ? 'Ga verder' : 'Begin vandaag'}</button></section>
        </div>
      </header>
      {notice && <p className="tasks-melding ck-papier" role="alert">{notice}</p>}
      {area === 'vandaag' ? <div className="tasks-practice"><DailyPractice /></div> : <div className="tasks-carousel">
        <ul ref={strip} id="tasks-strip" className="tasks-briefjes" aria-label="Kies een opdracht" onPointerDown={event => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return;
          drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft };
        }} onPointerMove={event => {
          if (event.buttons !== 1) { drag.current = null; return; }
          if (!drag.current || Math.abs(event.clientX - drag.current.x) < 8) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.scrollLeft = drag.current.scroll + drag.current.x - event.clientX;
        }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
          {cards.map((card, index) => <li key={card.id} style={{ '--briefje': index } as React.CSSProperties}>
            <button type="button" className="tasks-briefje" data-wereld={WERELD[card.area]} onClick={() => choose(card.id)}>
              <span className="tasks-briefje__plaatje"><img src={card.beeld} alt="" draggable={false} /></span>
              <span className="tasks-briefje__categorie">{areas.find(item => item.id === card.area)?.name}</span>
              <strong>{card.titel}</strong>
              <span className="tasks-beloning" aria-label={`${rewardFor(card.id)} CocoCoins`}><span className="ck-munt" aria-hidden="true" />{card.id === 'garden' || card.id === 'nursery' ? 'Tot ' : '+'}{rewardFor(card.id)}</span>
            </button>
          </li>)}
        </ul>
        <nav className="tasks-carousel__controls" aria-label="Blader door opdrachten">{edges.prev && <IconButton className="tasks-strip-control tasks-strip-control--prev ck-glas" label="Vorige opdrachten" icon={<ChevronLeft />} aria-controls="tasks-strip" onClick={() => slide(-1)} />}{edges.next && <IconButton className="tasks-strip-control tasks-strip-control--next ck-glas" label="Meer opdrachten" icon={<ChevronRight />} aria-controls="tasks-strip" onClick={() => slide(1)} />}</nav>
      </div>}

    </section>
  </main>;
}
