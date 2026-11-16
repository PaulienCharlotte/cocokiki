import React, { useState } from 'react';
import { CalendarDays, ClipboardList, ShoppingBag, Sparkles } from 'lucide-react';
import { Button, Dialog } from '../design-system';
import { DAILY_REWARD, loadDailyPractice } from '../services/dailyPractice';
import '../components/ui/favorite-games.css';

export default function CoinsScreen({ coins, onNavigate }: { coins: number; onNavigate: (path: string) => void }) {
  const [earnOpen, setEarnOpen] = useState(false);
  const completed = Object.keys(loadDailyPractice().answers).length;
  return <main className="my-coins"><section className="my-coins__paper" aria-labelledby="coins-title">
    <h1 id="coins-title">Mijn CocoCoins</h1>
    <div className="my-coins__treasure" aria-hidden="true"><span className="ck-munt my-coins__little-coin" /><span className="ck-munt my-coins__coin" /><span className="ck-munt my-coins__little-coin" /></div>
    <p className="my-coins__balance" aria-label={`${coins} CocoCoins`}>{coins}<span>CocoCoins</span></p>
    <p>Spelen, helpen en sparen.</p>
    <div className="my-coins__actions"><Button variant="reward" size="large" startIcon={<Sparkles />} onClick={() => setEarnOpen(true)}>Meer verdienen?</Button>
    <Button variant="quiet" startIcon={<ShoppingBag />} onClick={() => onNavigate('/shop')}>Naar de winkels</Button></div>
  </section>
  <Dialog className="coins-earn-dialog" open={earnOpen} title="Meer CocoCoins verdienen" onClose={() => setEarnOpen(false)}
    primaryAction={<Button startIcon={<CalendarDays />} onClick={() => onNavigate('/opdrachten?gebied=vandaag')}>Vijf voor vandaag</Button>}
    secondaryAction={<Button variant="secondary" startIcon={<ClipboardList />} onClick={() => onNavigate('/opdrachten')}>Kies een To Do-opdracht</Button>}>
    <p>{completed === 5 ? 'Je hebt de vijf vragen van vandaag al gedaan. Morgen staat er een nieuwe reeks klaar.' : `Vandaag ${completed}/5 vragen gedaan. Verdien tot ${5 * DAILY_REWARD} CocoCoins met vijf zelfstandig goede antwoorden.`}</p>
    <p>Of help iemand met een opdracht. Op het To Do-bord zie je wat je kunt verdienen.</p>
  </Dialog></main>;
}
