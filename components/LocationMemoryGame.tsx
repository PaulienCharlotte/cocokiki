import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { MemoryPair } from '../data/learning';
import { shuffle } from '../services/localProgress';
import RoundResult from './RoundResult';

interface Props {
  mode: 'memory' | 'quiz';
  pairs: MemoryPair[];
  choicePool: MemoryPair[];
  onAnswer: (id: string, correct: boolean, points: number) => void;
  onContinue: () => void;
  onRepeat: () => void;
  onRetry: (ids: string[]) => void;
  onExit: () => void;
}
interface Card { id: string; pair: MemoryPair; side: 'left' | 'right' }

function FlagQuiz({ pairs, choicePool, onAnswer, onContinue, onRepeat, onRetry, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const locked = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const target = pairs[index];
  const choices = useMemo(() => target ? shuffle([target, ...shuffle(choicePool.filter(p => p.id !== target.id)).slice(0, 3)]) : [], [target, choicePool]);
  useEffect(() => { heading.current?.focus(); }, [index]);
  if (!target) return <RoundResult total={pairs.length} correct={correct} onContinue={onContinue} onRepeat={onRepeat} onExit={onExit} onRetry={wrong.length ? () => onRetry(wrong) : undefined} />;
  const answer = (choice: MemoryPair) => {
    if (locked.current) return;
    locked.current = true;
    const isCorrect = choice.id === target.id;
    setSelected(choice.id);
    onAnswer(target.id, isCorrect, isCorrect ? 10 : 0);
    if (isCorrect) setCorrect(c => c + 1);
    else setWrong(ids => [...ids, target.id]);
  };
  return <section className="flag-quiz content-width">
    <div className="question-progress"><span>Vraag {index + 1} van {pairs.length}</span><span>{correct} goed</span></div>
    <progress value={index + Number(!!selected)} max={pairs.length} aria-label="Voortgang van de quiz" />
    <h1 ref={heading} tabIndex={-1}>Van welk land is deze vlag?</h1>
    <div className="quiz-flag" role="img" aria-label="Vlag">{target.right}</div>
    <div className="quiz-choices">{choices.map(choice => <button key={choice.id} disabled={!!selected} onClick={() => answer(choice)} className={'quiz-choice' + (selected && choice.id === target.id ? ' correct' : selected === choice.id ? ' incorrect' : '')}>{choice.left}{selected && choice.id === target.id && <Check size={20} />}</button>)}</div>
    <div className="quiz-feedback" role="status">{selected && <><p>{selected === target.id ? 'Goed gevonden! Dit is ' : 'Deze vlag hoort bij '}{target.left}.</p><button className="primary-button" onClick={() => { setIndex(i => i + 1); setSelected(null); locked.current = false; }}>{index + 1 === pairs.length ? 'Bekijk resultaat' : 'Volgende vlag'}<ArrowRight size={18} /></button></>}</div>
  </section>;
}

function MemoryBoard({ pairs, onAnswer, onContinue, onRepeat, onRetry, onExit }: Props) {
  const [cards] = useState<Card[]>(() => shuffle(pairs.flatMap(pair => [
    { id: pair.id + ':left', pair, side: 'left' as const }, { id: pair.id + ':right', pair, side: 'right' as const },
  ])));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [feedback, setFeedback] = useState('');
  const locked = useRef(false);
  const seenErrors = useRef(new Set<string>());

  useEffect(() => {
    if (flipped.length !== 2) return;
    const first = cards.find(c => c.id === flipped[0])!;
    const second = cards.find(c => c.id === flipped[1])!;
    const match = first.pair.id === second.pair.id;
    const timeout = window.setTimeout(() => {
      setMoves(m => m + 1);
      if (match) {
        setMatched(ids => [...ids, first.pair.id]);
        onAnswer(first.pair.id, !seenErrors.current.has(first.pair.id), 10);
        setFeedback('Setje gevonden: ' + first.pair.left + '.');
      } else {
        seenErrors.current.add(first.pair.id); seenErrors.current.add(second.pair.id);
        setMissed([...seenErrors.current]);
        setFeedback('Deze horen niet bij elkaar. Probeer nog eens.');
      }
      setFlipped([]); locked.current = false;
    }, match ? 500 : 1300);
    return () => window.clearTimeout(timeout);
  }, [flipped, cards, onAnswer]);

  if (matched.length === pairs.length) return <RoundResult memory total={pairs.length} correct={pairs.length - missed.length} onContinue={onContinue} onRepeat={onRepeat} onExit={onExit} onRetry={missed.length ? () => onRetry(missed) : undefined} />;
  return <section className="memory-game content-width">
    <div className="memory-heading"><h1>Vind de setjes</h1><span>{matched.length} / {pairs.length} gevonden<span className="muted"> · {moves} beurten</span></span></div>
    <progress value={matched.length} max={pairs.length} aria-label="Gevonden setjes" />
    <div className="memory-board" data-kind={pairs[0]?.kind}>{cards.map((card, index) => {
      const isMatched = matched.includes(card.pair.id);
      const visible = isMatched || flipped.includes(card.id);
      const flag = card.side === 'right' && card.pair.kind === 'flag';
      return <button key={card.id} className={'memory-card' + (visible ? ' flipped' : '') + (isMatched ? ' matched' : '')} aria-label={visible ? (flag ? 'Vlag van ' + card.pair.left : card.pair[card.side]) + (isMatched ? ', gevonden' : '') : 'Kaart ' + (index + 1)} aria-pressed={visible} disabled={isMatched} onClick={() => {
        if (locked.current || visible) return;
        if (flipped.length === 1) locked.current = true;
        setFlipped(previous => [...previous, card.id]);
      }}>
        <span className="memory-inner"><span className="card-back" aria-hidden="true"><img src="/images/logo-compas-geel.svg" width="60" height="60" alt="" /><span>{index + 1}</span></span>
          <span className="card-front" aria-hidden={!visible}><small>{card.side === 'left' ? card.pair.kind === 'flag' ? 'Land' : card.pair.kind === 'fact' ? 'Plek' : 'Gebied' : card.pair.kind === 'flag' ? 'Vlag' : card.pair.kind === 'capital' ? 'Hoofdstad' : 'Weetje'}</small><span className={flag ? 'memory-flag' : 'memory-text'}>{visible ? card.pair[card.side] : ''}</span>{isMatched && <Check className="match-check" size={18} />}</span>
        </span>
      </button>;
    })}</div>
    <p className="memory-feedback" role="status">{feedback || ' '}</p>
  </section>;
}

export default function LocationMemoryGame(props: Props) {
  return props.mode === 'quiz' ? <FlagQuiz {...props} /> : <MemoryBoard {...props} />;
}
