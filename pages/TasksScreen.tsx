import React, { useState } from 'react';
import { Armchair, CalendarDays, ChefHat, Sprout } from 'lucide-react';
import { Button, Dialog } from '../design-system';
import CardGrid from '../components/ui/CardGrid';
import SpeechBubble from '../components/ui/SpeechBubble';
import DailyPractice from '../components/quiz/DailyPractice';
import { CHARACTERS } from '../data/characters';
import { loadCookingProgress, saveCookingProgress } from '../services/cookingProgress';
import { lopendeBestelling, neemBestellingAan, openBestellingen } from '../services/bakeryOrders';
import { loadCakeOrder } from '../services/cakeOrder';
import { claimDecorTask, decorTaskState } from '../services/decorTask';
import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import CocoCoin from '../components/platform/CocoCoin';
import { BESTELLINGEN } from '../data/cooking/orders';
import { LEARNING_COINS } from '../services/learningReward';
import { DAILY_REWARD } from '../services/dailyPractice';
import './tasks.css';

type Area = 'alles' | 'bakken' | 'planten' | 'inrichten' | 'vandaag';
const areas: Array<{ id: Area; name: string; icon: React.ReactNode }> = [
  { id: 'alles', name: 'Alles', icon: null }, { id: 'bakken', name: 'Bakken', icon: <ChefHat /> }, { id: 'planten', name: 'Planten', icon: <Sprout /> }, { id: 'inrichten', name: 'Inrichten', icon: <Armchair /> }, { id: 'vandaag', name: 'Vandaag', icon: <CalendarDays /> },
];
export default function TasksScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const requested = new URLSearchParams(window.location.search).get('gebied');
  const [area, setArea] = useState<Area>(areas.some(a => a.id === requested) ? requested as Area : 'alles');
  const [decor, setDecor] = useState(false), [notice, setNotice] = useState('');
  const progress = loadCookingProgress(), active = lopendeBestelling(progress), decoration = decorTaskState();
  const rewardFor = (id: string) => {
    const order = BESTELLINGEN.find(order => order.id === id);
    if (order) return `Bakbeloning + tot ${order.bonus} CocoCoins bonus`;
    if (id === 'cake') return loadCakeOrder().delivered ? `${loadCakeOrder().reward} CocoCoins ontvangen` : '5 CocoCoins · 2 extra met tijdsbonus';
    if (id === 'shop-race') return `Vanaf ${LEARNING_COINS} CocoCoins per goede klant`;
    if (id === 'clinic') return `${LEARNING_COINS} CocoCoins per consult`;
    if (id === 'garden') return '2 CocoCoins per taak · oogst extra';
    return decoration.claimed ? '15 CocoCoins ontvangen' : '15 CocoCoins';
  };
  const cards = [
    ...openBestellingen(progress).map(order => ({ id: order.id, area: 'bakken', titel: CHARACTERS[order.klant].naam, onder: order.aanleiding, beeld: CHARACTERS[order.klant].beeld, meta: active?.bestelling.id === order.id ? 'Verder met je bestelling' : 'Bakken' })),
    { id: 'cake', area: 'bakken', titel: 'Sebs verjaardagstaart', beeld: '/assets/library/cooking/taarten/roze-rand.webp', meta: loadCakeOrder().delivered ? 'Afgeleverd' : 'Taart versieren' },
    { id: 'shop-race', area: 'bakken', titel: 'Help in de winkel', onder: 'Reken af voor klanten in Winkelgekte.', beeld: '/games/school/math/race.webp' },
    { id: 'clinic', area: 'planten', titel: 'Help een plant', onder: 'Ontdek wat de plant nodig heeft.', beeld: '/assets/library/plants/gereedschap/plantenspuit.webp' },
    { id: 'garden', area: 'planten', titel: 'Zaaien en verzorgen', onder: 'Ga verder in je moestuin.', beeld: '/assets/library/plants/garden/navigation.webp' },
    { id: 'decor', area: 'inrichten', titel: 'Een groene zithoek', onder: 'Maak een knusse plek in je woonkamer.', beeld: DECOR_PRODUCTS_BY_ID['sofa-sage-front'].image, meta: decoration.claimed ? 'Afgerond' : '15 CocoCoins' },
  ].filter(card => area === 'alles' || card.area === area).map(card => ({ ...card, meta: <span className="tasks-reward"><CocoCoin size={22} /><span>{rewardFor(card.id)}</span></span> }));
  const choose = (id: string) => {
    if (id === 'daily') { onNavigate('/opdrachten?gebied=vandaag'); return; }
    if (id === 'decor') { setDecor(true); return; }
    if (id === 'shop-race') { onNavigate('/school/math/race'); return; }
    if (id === 'clinic') { onNavigate('/plantendokter?from=kiki'); return; }
    if (id === 'garden') { onNavigate('/plants/garden?from=kiki'); return; }
    if (id === 'cake') { onNavigate('/games/taartenatelier?order=seb-birthday'); return; }
    const next = active?.bestelling.id === id ? progress : neemBestellingAan(progress, id);
    if (!saveCookingProgress(next)) { setNotice('Opslaan lukte niet. Probeer het opnieuw.'); return; }
    onNavigate('/treehouse/cookbook?toonbank=1');
  };
  return <main className="tasks-screen"><section className="tasks-screen__content">
    <header className="tasks-header"><div className="tasks-header__badge"><img className="tasks-header__art" src="/assets/library/cooking/klembord.webp" alt="" /><h1>To Do</h1></div>
    <nav className="tasks-screen__filters" aria-label="Soort opdracht">{areas.map(item => <Button key={item.id} variant="quiet" size="small" aria-pressed={area === item.id} startIcon={item.icon} onClick={() => { setArea(item.id); const url = new URL(window.location.href); url.searchParams.set('gebied', item.id); window.history.replaceState({}, '', url); }}>{item.name}</Button>)}</nav>
    {area === 'alles' && <section className="tasks-today"><div><h2>Vijf voor vandaag</h2><p>Vijf korte oefeningen · dubbele beloning</p><span className="tasks-reward"><CocoCoin size={24} />Tot {DAILY_REWARD * 5} CocoCoins</span></div><Button onClick={() => choose('daily')} startIcon={<CalendarDays />}>Begin met vandaag</Button></section>}
    </header>
    {notice && <p role="alert">{notice}</p>}
    {area === 'vandaag' ? <DailyPractice /> : <CardGrid label="Kies een opdracht" cards={cards} onChoose={choose} />}
  </section>
  <Dialog open={decor} title="Een groene zithoek" onClose={() => setDecor(false)} primaryAction={null}>
    <SpeechBubble character="kiki" label="Inrichten">Maak een zithoek in de woonkamer met een zitmeubel, een tafel en een plant. Je mag spullen gebruiken die je al hebt.</SpeechBubble>
    <ul>{['Zitmeubel', 'Tafel', 'Plant'].map((name, i) => <li key={name}>{decoration.steps[i] ? '✓' : '○'} {name}</li>)}</ul>
    {decoration.claimed ? <p>Afgerond! Je beloning is al ontvangen.</p> : decoration.ready ? <Button onClick={() => { setNotice(claimDecorTask() ? '15 CocoCoins ontvangen!' : 'Opslaan lukte niet.'); setDecor(false); }}>Ontvang 15 CocoCoins</Button> : <Button onClick={() => onNavigate('/treehouse/living-room')}>Naar de woonkamer</Button>}
  </Dialog></main>;
}
