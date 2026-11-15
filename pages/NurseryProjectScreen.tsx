import React, { useEffect, useState } from 'react';
import { Check, Ruler, HelpCircle } from 'lucide-react';
import { Button, Dialog, IconButton } from '../design-system';
import SpeechBubble from '../components/ui/SpeechBubble';
import { NURSERY_ITEMS, NURSERY_QUESTIONS, PROJECT_BUDGET, type NurseryQuestionId } from '../data/projects/nursery';
import { answerNursery, beginNursery, checkoutNursery, finishNursery, loadNursery, nurseryEarned, nurseryLayoutReady, nurseryQuestion, nurseryTotal, NURSERY_KEY, revealNursery, toggleNurseryItem } from '../services/nurseryProject';
import { subscribeLocalState } from '../services/localState';
import NurseryRoom from '../components/projects/NurseryRoom';
import './nursery-project.css';

export default function NurseryProjectScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [state, setState] = useState(loadNursery);
  const [answer, setAnswer] = useState(''), [message, setMessage] = useState('');
  const [aboutReward, setAboutReward] = useState(false);
  useEffect(() => subscribeLocalState(() => setState(loadNursery()), NURSERY_KEY), []);
  const act = (ok: boolean, success = '') => { setState(loadNursery()); setMessage(ok ? success : 'Opslaan lukte niet of je project is veranderd. Probeer opnieuw.'); return ok; };
  const q = nurseryQuestion(state), assisted = state.helped.includes(state.stage as NurseryQuestionId);
  const chapter = state.stage === 'brief' ? 'De opdracht' : ['height', 'space'].includes(state.stage) ? 'Meten' : ['shop', 'total', 'change'].includes(state.stage) ? 'Je budget' : state.stage === 'complete' ? 'Afgeleverd' : 'Inrichten';
  return <main className="nursery-project"><section className="nursery-project__paper">
    <header className="nursery-project__header"><div>{state.stage !== 'decorate' && <small>Project · {chapter}</small>}<h1>Luna’s babykamer</h1></div>{state.stage !== 'decorate' && <span>{state.solved.length}/{NURSERY_QUESTIONS.length} rekenstappen</span>}<IconButton label={state.stage === 'decorate' ? 'De wens van Luna' : 'Hoe verdien ik CocoCoins?'} icon={<HelpCircle />} onClick={() => setAboutReward(true)} /></header>
    {state.stage === 'brief' ? <>
      <SpeechBubble character="luna" label="Mijn wens">Een knusse babykamer: het bed links, de kast rechts. Wil jij meten, kiezen en inrichten?</SpeechBubble>
      <img className="nursery-project__preview" src="/assets/library/treehouse/rooms/blush-front-v1.webp" alt="De lege projectkamer van Luna" />
      <p>500 projectmunten · 5 rekenstappen · tot 100 CocoCoins</p>
      <p>Dit is Luna’s kamer. Het budget en de meubels blijven bij haar.</p>
      <Button onClick={() => act(beginNursery())}>Begin met meten</Button>
    </> : q ? <>
      <SpeechBubble character="lua" label={chapter}>{assisted ? `${q.hint} Het antwoord is ${q.answer.toLocaleString('nl-NL')} ${q.unit}.` : q.prompt}</SpeechBubble>
      {['height', 'space', 'rug'].includes(state.stage) && <div className="nursery-measure" aria-label="De maten in Luna’s kamer"><Ruler /><span>{state.stage === 'height' ? 'Vloer ↕ plafond: 260 cm' : state.stage === 'space' ? 'Muur 320 cm · bed 120 cm · kast 80 cm' : 'Babybedje: 120 cm breed'}</span></div>}
      {state.stage === 'total' && <ul className="nursery-receipt">{NURSERY_ITEMS.filter(i => state.basket.includes(i.id)).map(i => <li key={i.id}><img src={i.image} alt="" /><span>{i.name}</span><strong>{i.price}</strong></li>)}</ul>}
      <form className="nursery-answer" onSubmit={e => { e.preventDefault(); const result = answerNursery(state.revision, assisted ? String(q.answer) : answer); if (result === 'wrong') setMessage('Nog niet. Probeer opnieuw of kies hulp.'); else if (result === 'correct') { act(true, assisted ? 'Met hulp afgerond.' : '+12 CocoCoins voor jouw rekenwerk!'); setAnswer(''); } else act(false); }}>
        {assisted ? <p>Met hulp · geen beloning voor deze rekenstap</p> : <label>Jouw antwoord <input inputMode="decimal" autoComplete="off" value={answer} onChange={e => setAnswer(e.target.value)} /> {q.unit}</label>}
        <Button type="submit">{assisted ? 'Verder' : 'Controleer'}</Button>
      </form>
      {!assisted && <Button variant="quiet" onClick={() => act(revealNursery(state.revision))}>Ik kom er niet uit</Button>}
    </> : state.stage === 'shop' ? <>
      <SpeechBubble character="luna" label="Kiezen">Kies een bedje, kast en vloerlamp. Kies er een boekenkast óf leesstoel bij als dat past.</SpeechBubble>
      <p className="nursery-budget">Projectbudget: {PROJECT_BUDGET} · Nog beschikbaar: {PROJECT_BUDGET - nurseryTotal(state)}</p>
      <div className="nursery-shop">{NURSERY_ITEMS.map(item => <button type="button" key={item.id} aria-pressed={state.basket.includes(item.id)} disabled={!state.basket.includes(item.id) && nurseryTotal(state) + item.price > PROJECT_BUDGET} onClick={() => act(toggleNurseryItem(state.revision, item.id))}><img src={item.image} alt="" /><strong>{item.name}</strong><span>{item.price} projectmunten {state.basket.includes(item.id) && <Check size={16} />}</span></button>)}</div>
      <Button disabled={!NURSERY_ITEMS.filter(i => i.required).every(i => state.basket.includes(i.id))} onClick={() => act(checkoutNursery(state.revision))}>Reken je bestelling na</Button>
    </> : <>
      {state.stage === 'complete' && <SpeechBubble character="luna" label="Dank je!">Wat een fijne kamer. Je hebt goed gemeten én op mijn budget gelet!</SpeechBubble>}
      <NurseryRoom state={state} onSave={act} />
      {state.stage === 'complete' ? <><p>Afgeleverd · {nurseryEarned()} CocoCoins verdiend. Van het projectbudget is {PROJECT_BUDGET - nurseryTotal(state)} over. Dat blijft bij Luna.</p><Button onClick={() => onNavigate('/opdrachten')}>Naar To Do</Button></> : <>
        <Button disabled={!nurseryLayoutReady(state)} onClick={() => act(finishNursery(state.revision), 'Kamer afgeleverd!')}>Klaar voor Luna</Button>
      </>}
    </>}
    {message && <p role="status">{message}</p>}
  </section><Dialog open={aboutReward} title={state.stage === 'decorate' ? 'Luna’s wens' : 'Jouw beloning'} onClose={() => setAboutReward(false)} primaryAction={<Button onClick={() => setAboutReward(false)}>Verder</Button>}>{state.stage === 'decorate' && <SpeechBubble character="luna" label="Mijn wens">Bed links, kast rechts. Sleep de meubels op hun plek. Tik een meubel aan om het groter of kleiner te maken. Geef ieder meubel een eigen plek.</SpeechBubble>}<p>Elke zelfstandig opgeloste rekenstap geeft 12 CocoCoins. Bij aflevering krijg je nog 8 per zelfstandig opgeloste stap. Samen maximaal 100.</p><p>Met ‘Ik kom er niet uit’ krijg je uitleg en het antwoord. Die stap geeft geen munten, ook niet bij aflevering. Je project gaat wel verder.</p><p>De 500 projectmunten zijn van Luna. Je eigen geld en meubels worden niet gebruikt.</p></Dialog></main>;
}
