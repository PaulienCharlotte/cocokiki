import React, { useEffect, useRef, useState } from 'react';
import { Hand, Undo2 } from 'lucide-react';
import DragChoice from './DragChoice';
import { distributionCorrect } from './engine';
import { dropDoel } from './dropTarget';
import { mathAssets } from './assets';
import type { MathQuestion } from './types';

export default function DistributionChallenge({ question, locked, onAnswer, tutorial = false }: { question: MathQuestion; locked: boolean; onAnswer: (answer: number, valid?: boolean) => void; tutorial?: boolean }) {
  const [locations, setLocations] = useState<number[]>(() => Array(question.a).fill(-1));
  const [selected, setSelected] = useState<number>();
  const [history, setHistory] = useState<number[][]>([]);
  const [demo, setDemo] = useState(tutorial);
  const targets = useRef<HTMLDivElement>(null), checked = useRef('');
  const notify = useRef(onAnswer); notify.current = onAnswer;
  const counts = Array.from({ length: question.groups! }, (_, basket) => locations.filter(location => location === basket).length);
  const remaining = locations.filter(location => location === -1).length;
  const visibleHarvest = locations.map((location, id) => ({ location, id })).filter(item => item.location === -1).slice(0, 18);
  const fruit = question.fruit === 'blueberry' ? mathAssets.blueberry : mathAssets.strawberry;
  const name = question.fruit === 'blueberry' ? 'blauwe bes' : 'aardbei';
  useEffect(() => { const timer = window.setTimeout(() => setDemo(false), 2200); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    const signature = locations.join(',');
    if (!locked && !locations.includes(-1) && checked.current !== signature) {
      checked.current = signature;
      notify.current(question.answer, distributionCorrect(Array.from({ length: question.groups! }, (_, i) => locations.filter(place => place === i).length), question.a));
    }
  }, [locations, locked, question]);
  const mandjeBij = (x: number, y: number) => dropDoel(x, y, [...(targets.current?.querySelectorAll<HTMLElement>('[data-fruit-target]') ?? [])]
    .map(vak => ({ id: Number(vak.dataset.fruitTarget), rect: vak.getBoundingClientRect() })));

  const place = (id: number, basket: number) => {
    if (locked || locations[id] === basket) return;
    setDemo(false); setHistory(previous => [...previous, locations]);
    setLocations(previous => previous.map((location, i) => i === id ? basket : location)); setSelected(undefined);
  };
  const fruitButton = (id: number) => <React.Fragment key={id}><DragChoice value={id} label={`${name} ${id + 1}${locations[id] >= 0 ? `, in mandje ${locations[id] + 1}` : ', in de oogst'}`} selected={selected === id} disabled={locked} targetRef={targets}
    onChoose={() => { setSelected(id); setDemo(false); }} onDrop={(_, x, y) => place(id, mandjeBij(x, y))}><img src={fruit} alt="" draggable={false} /></DragChoice></React.Fragment>;
  return <div className="berry-game" ref={targets}>
    <div className="berry-harvest" data-fruit-target="-1" aria-label={`${remaining} bessen in de oogst`}>
      <div className="berry-harvest__label"><strong>{remaining} over</strong>{selected !== undefined && locations[selected] !== -1 && <button type="button" onClick={() => place(selected, -1)}>Terug naar de oogst</button>}</div>
      <div className="berry-supply">{visibleHarvest.map(({ id }) => fruitButton(id))}</div>
    </div>
    <div className="berry-baskets" data-groups={question.groups} role="group" aria-label="Mandjes" style={{ '--basket-columns': Math.min(question.groups!, 4), '--basket-height': `${Math.max(135, Math.ceil(question.answer / (question.groups! <= 2 ? 3 : 2)) * 44 + 54)}px` } as React.CSSProperties}>{counts.map((count, basket) => <div className={`berry-basket${selected !== undefined ? ' is-ready' : ''}`} data-fruit-target={basket} key={basket} onClick={event => { if (selected !== undefined && !(event.target as HTMLElement).closest('button')) place(selected, basket); }}>
      <img className="berry-basket__art" src={mathAssets.basket} alt="" draggable={false} />
      <button type="button" className="berry-basket__target" disabled={locked || selected === undefined} aria-label={`Mandje ${basket + 1}, ${count} bessen, hier neerleggen`} onClick={() => { if (selected !== undefined) place(selected, basket); }}><span>{count}</span></button>
      <div className="berry-basket__fruit">{locations.map((location, id) => location === basket ? fruitButton(id) : null)}</div>
    </div>)}</div>
    {demo && <div className="berry-demo" aria-hidden="true"><Hand size={32} /></div>}
    <button className="math-icon-tool berry-undo" type="button" disabled={locked || !history.length} title="Eén bes terug" aria-label="Eén bes terug" onClick={() => { setLocations(history.at(-1)!); setHistory(previous => previous.slice(0, -1)); setSelected(undefined); checked.current = ''; }}><Undo2 size={21} /></button>
  </div>;
}
