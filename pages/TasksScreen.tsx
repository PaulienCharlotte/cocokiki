import React, { useState } from 'react';
import { Armchair, CalendarDays, ChefHat, Sprout } from 'lucide-react';
import DailyPractice from '../components/quiz/DailyPractice';
import { CHARACTERS } from '../data/characters';
import { loadCookingProgress, saveCookingProgress } from '../services/cookingProgress';
import { lopendeBestelling, neemBestellingAan, openBestellingen } from '../services/bakeryOrders';
import { loadCakeOrder } from '../services/cakeOrder';
import { loadNursery } from '../services/nurseryProject';
import { BESTELLINGEN } from '../data/cooking/orders';
import { LEARNING_COINS } from '../services/learningReward';
import { DAILY_REWARD, loadDailyPractice, dailyEarned } from '../services/dailyPractice';
import './tasks.css';

type Area = 'alles' | 'bakken' | 'planten' | 'inrichten' | 'vandaag';
/** Elk gebied heeft de kleur van zijn wereld uit de huisstijl. */
const WERELD: Record<string, string> = { bakken: 'keuken', planten: 'tuin', inrichten: 'boomhut', vandaag: 'school', alles: 'boomhut' };
const areas: Array<{ id: Area; name: string; icon: React.ReactNode }> = [
  { id: 'alles', name: 'Alles', icon: null }, { id: 'bakken', name: 'Bakken', icon: <ChefHat /> }, { id: 'planten', name: 'Planten', icon: <Sprout /> }, { id: 'inrichten', name: 'Inrichten', icon: <Armchair /> }, { id: 'vandaag', name: 'Vandaag', icon: <CalendarDays /> },
];
export default function TasksScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const requested = new URLSearchParams(window.location.search).get('gebied');
  const [area, setArea] = useState<Area>(areas.some(a => a.id === requested) ? requested as Area : 'alles');
  const [notice, setNotice] = useState('');
  const daily = loadDailyPractice();
  const dailyDone = Object.keys(daily.answers).length;
  const progress = loadCookingProgress(), active = lopendeBestelling(progress), projectComplete = loadNursery().stage === 'complete';
  const rewardFor = (id: string) => {
    const order = BESTELLINGEN.find(order => order.id === id);
    if (order) return `Bakbeloning + tot ${order.bonus} CocoCoins bonus`;
    if (id === 'cake') return loadCakeOrder().delivered ? `${loadCakeOrder().reward} CocoCoins ontvangen` : '5 CocoCoins · 2 extra met tijdsbonus';
    if (id === 'shop-race') return `Vanaf ${LEARNING_COINS} CocoCoins per goede klant`;
    if (id === 'clinic') return `${LEARNING_COINS} CocoCoins per consult`;
    if (id === 'garden') return '2 CocoCoins per taak · oogst extra';
    return projectComplete ? 'Project afgerond' : 'Tot 100 CocoCoins · voor rekenwerk';
  };
  const cards = [
    ...openBestellingen(progress).map(order => ({ id: order.id, area: 'bakken', titel: CHARACTERS[order.klant].naam, onder: order.aanleiding, beeld: CHARACTERS[order.klant].beeld, meta: active?.bestelling.id === order.id ? 'Verder met je bestelling' : 'Bakken' })),
    { id: 'cake', area: 'bakken', titel: 'Sebs verjaardagstaart', beeld: '/assets/library/cooking/taarten/roze-rand.webp', meta: loadCakeOrder().delivered ? 'Afgeleverd' : 'Taart versieren' },
    { id: 'shop-race', area: 'bakken', titel: 'Help in de winkel', onder: 'Reken af voor klanten in Winkelgekte.', beeld: '/games/school/math/race.webp' },
    { id: 'clinic', area: 'planten', titel: 'Help een plant', onder: 'Ontdek wat de plant nodig heeft.', beeld: '/assets/library/plants/gereedschap/plantenspuit.webp' },
    { id: 'garden', area: 'planten', titel: 'Zaaien en verzorgen', onder: 'Ga verder in je moestuin.', beeld: '/assets/library/plants/garden/navigation.webp' },
    { id: 'nursery', area: 'inrichten', titel: 'Luna’s babykamer', onder: 'Meten, kiezen en inrichten met een projectbudget van 500.', beeld: '/assets/library/projects/luna-crib.webp', meta: projectComplete ? 'Afgerond' : 'Tot 100 CocoCoins' },
  ].filter(card => area === 'alles' || card.area === area);
  const choose = (id: string) => {
    if (id === 'daily') { onNavigate('/opdrachten?gebied=vandaag'); return; }
    if (id === 'nursery') { onNavigate('/opdrachten/luna-babykamer'); return; }
    if (id === 'shop-race') { onNavigate('/school/math/race'); return; }
    if (id === 'clinic') { onNavigate('/plantendokter?from=kiki'); return; }
    if (id === 'garden') { onNavigate('/plants/garden?from=kiki'); return; }
    if (id === 'cake') { onNavigate('/games/taartenatelier?order=seb-birthday'); return; }
    const next = active?.bestelling.id === id ? progress : neemBestellingAan(progress, id);
    if (!saveCookingProgress(next)) { setNotice('Opslaan lukte niet. Probeer het opnieuw.'); return; }
    onNavigate('/treehouse/cookbook?toonbank=1');
  };
  // Het To Do-bord uit de huisstijl: een houten bord op kurk, met elke
  // opdracht als papieren briefje dat er met een punaise in de wereldkleur
  // op geprikt is. Geen witte kaarten of kopvlak.
  return <main className="tasks-screen" data-wereld="boomhut">
    <section className="tasks-screen__content">
      <header className="tasks-header">
        <h1 className="ck-houtbord tasks-bord">To Do</h1>
        <nav className="tasks-filters ck-glas" aria-label="Soort opdracht">{areas.map(item => <button type="button" key={item.id} className="tasks-filter" data-wereld={WERELD[item.id]} aria-pressed={area === item.id} onClick={() => { setArea(item.id); const url = new URL(window.location.href); url.searchParams.set('gebied', item.id); window.history.replaceState({}, '', url); }}>{item.icon}<span>{item.name}</span></button>)}</nav>
      </header>
      {notice && <p className="tasks-melding ck-papier" role="alert">{notice}</p>}
      {area !== 'vandaag' && <section className="tasks-daily" aria-labelledby="tasks-vandaag">
        <img className="tasks-daily__art" src="/assets/library/ui/daily-quest.webp" alt="" />
        <div className="tasks-daily__content"><span className="tasks-daily__label">Jouw dagavontuur</span>
          <h2 id="tasks-vandaag">Vijf voor vandaag</h2>
          <p>Vijf vragen over eten en planten. Elke dag een nieuwe reeks.</p>
          <span className="tasks-daily__reward"><span className="ck-munt" aria-hidden="true" />{dailyDone === 5 ? `${dailyEarned(daily)} CocoCoins verdiend` : `Verdien tot ${DAILY_REWARD * 5} CocoCoins`}</span>
          <small>{dailyDone}/5 gedaan · {DAILY_REWARD} CocoCoins per zelfstandig goed antwoord</small>
        </div>
        <button type="button" className="ck-knop ck-knop--hoofd" onClick={() => choose('daily')}><CalendarDays aria-hidden="true" />{dailyDone === 5 ? 'Bekijk resultaat' : dailyDone ? 'Ga verder' : 'Begin vandaag'}</button>
      </section>}
      {area === 'vandaag' ? <DailyPractice /> : <ul className="tasks-briefjes" aria-label="Kies een opdracht">
        {cards.map((card, index) => <li key={card.id} style={{ '--briefje': index } as React.CSSProperties}>
          <button type="button" className="tasks-briefje" data-wereld={WERELD[card.area]} onClick={() => choose(card.id)}>
            <span className="tasks-briefje__plaatje"><img src={card.beeld} alt="" /></span>
            <strong>{card.titel}</strong>
            {card.onder && <span className="tasks-briefje__tekst">{card.onder}</span>}
            <span className="tasks-beloning"><span className="ck-munt" aria-hidden="true" />{rewardFor(card.id)}</span>
          </button>
        </li>)}
      </ul>}
    </section>
  </main>;
}
