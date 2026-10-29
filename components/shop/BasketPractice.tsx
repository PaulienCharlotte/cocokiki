import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { Button } from '../../design-system';
import type { ShoppingSession } from '../../services/shopping';
import { answerShoppingQuestion, loadShoppingPractice, shoppingQuestion, SHOPPING_QUESTION_REWARD } from '../../services/shoppingPractice';
import CocoCoin from '../platform/CocoCoin';
import './basket-practice.css';

export default function BasketPractice({ session, deficit, onBack, onBalance }: { key?: React.Key; session: ShoppingSession; deficit: number; onBack: () => void; onBalance: (balance: number) => void }) {
  const [state, setState] = useState(() => loadShoppingPractice(session));
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [reward, setReward] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, [deficit === 0]);
  const question = shoppingQuestion(session, state.questionIndex);
  const answer = (id: string) => {
    if (feedback?.correct) return;
    const result = answerShoppingQuestion(session, question.id, id);
    setState(result.state);
    onBalance(result.balance);
    if (result.status === 'failed') return setFeedback({ text: 'Opslaan lukt even niet. Je mandje en munten blijven bewaard. Probeer opnieuw.', correct: false });
    if (result.status === 'stale') return setFeedback({ text: 'De oefening is bijgewerkt. Probeer deze vraag.', correct: false });
    if (result.status === 'incorrect') return setFeedback({ text: 'Nog niet. Probeer een ander antwoord.', correct: false });
    setReward(result.reward);
    setFeedback({ text: question.explanation, correct: true });
  };
  return <section className="basket-practice" aria-labelledby="basket-practice-title">
    <Button variant="quiet" size="small" startIcon={<ArrowLeft />} onClick={onBack}>Jouw boodschappen</Button>
    <img className="basket-practice__coco" src="/assets/library/cooking/coco-chef-tip.webp" alt="Coco" />
    <h3 id="basket-practice-title" tabIndex={-1} ref={titleRef}>{deficit > 0 ? 'Verdien voor je mandje' : 'Je hebt genoeg!'}</h3>
    {deficit > 0 ? <>
      <p className="basket-practice__remaining">Nog <CocoCoin size={18} /> {deficit} · maximaal {SHOPPING_QUESTION_REWARD} per goed antwoord</p>
      {feedback?.correct ? <div className="basket-practice__feedback" role="status"><strong><Check /> +{reward} CocoCoins</strong><p>{feedback.text}</p><Button endIcon={<ChevronRight />} onClick={() => { setFeedback(null); titleRef.current?.focus(); }}>Volgende vraag</Button></div>
        : <><p className="basket-practice__question">{question.prompt}</p><div className="basket-practice__answers">{question.options.map(option => <Button key={option.id} variant="quiet" fullWidth onClick={() => answer(option.id)}>{option.label}</Button>)}</div>{feedback && <p role="alert">{feedback.text}</p>}</>}
    </> : <p role="status">Je boodschappen staan nog klaar. Je kunt nu afrekenen.</p>}
  </section>;
}
