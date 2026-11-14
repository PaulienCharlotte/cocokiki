import React, { useState } from 'react';
import { Button } from '../../design-system';
import SpeechBubble from '../ui/SpeechBubble';
import ChoiceList from '../ui/ChoiceList';
import { answerDaily, dailyQuestions, DAILY_REWARD, loadDailyPractice } from '../../services/dailyPractice';

export default function DailyPractice() {
  const [state, setState] = useState(loadDailyPractice);
  const [index, setIndex] = useState(() => { const state = loadDailyPractice(); const questions = dailyQuestions(state.day); const next = questions.findIndex(q => !state.answers[q.id]); return next < 0 ? questions.length : next; });
  const [error, setError] = useState('');
  const questions = dailyQuestions(state.day), q = questions[index];
  if (!q) return <section className="daily-practice"><h2>Klaar voor vandaag!</h2><p>Je hebt alle vijf oefeningen gedaan. Morgen staat er weer een nieuwe reeks klaar.</p><p>Je verdiende {questions.reduce((sum, q) => sum + (state.answers[q.id]?.choice === q.antwoord && !state.answers[q.id]?.helped ? DAILY_REWARD : 0), 0)} CocoCoins.</p></section>;
  const answered = state.answers[q.id];
  const choose = (choice: string, helped = false) => {
    if (!answerDaily(state.day, q.id, choice, helped)) { setError('Opslaan lukte niet of de dag is veranderd. Open Vandaag opnieuw.'); return; }
    setState(loadDailyPractice(state.day)); setError('');
  };
  return <section className="daily-practice">
    <SpeechBubble character={q.bron === 'planten' ? 'kiki' : 'coco'} label="Vandaag" aside={`${index + 1}/${questions.length}`}>{q.vraag}</SpeechBubble>
    <ChoiceList layout="buttons" label="Kies je antwoord" disabled={Boolean(answered)} onChoose={choice => choose(choice)} choices={q.opties.map(choice => ({ id: choice, label: choice, staat: answered ? choice === q.antwoord ? 'goed' : choice === answered.choice ? 'mis' : undefined : undefined }))} />
    {error && <p role="alert">{error}</p>}
    {answered ? <><p role="status">{answered.helped ? `Met hulp: ${q.antwoord}. Geen CocoCoins voor deze oefening.` : answered.choice === q.antwoord ? `Goed! +${DAILY_REWARD} CocoCoins.` : `Het antwoord is: ${q.antwoord}.`}{q.toelichting && ` ${q.toelichting}`}</p><Button onClick={() => setIndex(index + 1)}>Verder</Button></> : <><small>Dubbele beloning: {DAILY_REWARD} CocoCoins per goed antwoord.</small><Button variant="quiet" onClick={() => choose(q.antwoord, true)}>Ik kom er niet uit</Button></>}
  </section>;
}
