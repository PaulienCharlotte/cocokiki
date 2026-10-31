import React from 'react';
import { mathAssets } from './assets';
import { evaluate, expressionText } from './engine';
import type { MathQuestion } from './types';

export function quantityGroups(amount: number): number[] {
  if (!Number.isSafeInteger(amount) || amount < 0) return [];
  if (amount <= 12) return Array(amount).fill(1);
  const values: number[] = [];
  const compact: number[] = [];
  for (const unit of [100, 10, 1]) { const count = Math.floor(amount / unit); if (count) { values.push(...Array(count).fill(unit)); compact.push(count * unit); } amount %= unit; }
  return values.length <= 12 ? values : compact;
}
export function Quantity({ amount, kind = 'cookie' }: { amount: number; kind?: 'cookie' | 'acorn' }) {
  const groups = kind === 'acorn' && amount > 12 ? [Math.floor(amount / 100) * 100, Math.floor(amount % 100 / 10) * 10, amount % 10].filter(value => value > 0) : quantityGroups(amount);
  return <div className={`quantity quantity--${kind}`} role="img" aria-label={`${amount} ${kind === 'cookie' ? 'koekjes' : 'eikels'}`}>
    {groups.map((weight, index) => <span className={`quantity-token quantity-token--${kind}`} key={index}><img src={kind === 'cookie' ? mathAssets.cookie : mathAssets.acorn} alt="" />{weight > 1 && <b>×{weight}</b>}</span>)}{amount === 0 && <strong>0</strong>}
  </div>;
}
export function WinterScene({ question, success, completed }: { question: MathQuestion; success: boolean; completed: number }) {
  return <div className={`winter-scene${success ? ' is-success' : ''}`}>
    <div className="winter-hollow"><img className="winter-hollow__art" src={mathAssets.treeHollow} alt="Boomholte" /><div className="winter-hollow__inside" aria-hidden="true"><Quantity amount={success ? 3 : 2} kind="acorn" /></div><span className="winter-total">{success ? 'Voorraad aangevuld!' : 'Help de wintervoorraad groeien'}</span></div>
    <img className="winter-squirrel" src={mathAssets.squirrel} alt="Eekhoorn" />
    {question.operation === '-' && <img className="winter-bird" src={mathAssets.bird} alt="Vogel" />}
    <div className="winter-stock" aria-label={`Wintervoorraad: ${completed} van 10 oogsten`}><img src={mathAssets.basket} alt="" /><div>{Array.from({ length: completed }, (_, i) => <span className="quantity-token quantity-token--acorn" key={i}><img src={mathAssets.acorn} alt="" /></span>)}</div></div>
  </div>;
}
export function CookieScene({ question, success }: { question: MathQuestion; success: boolean }) {
  const caption = success ? 'Vers uit de oven!' : 'Los de som op en bak iets lekkers';
  return <div className={`cookie-scene${success ? ' is-success' : ''}`}>
    <img className="cookie-chef" src={mathAssets.chef} alt="Coco" />
    <div className="cookie-tray"><img src={mathAssets.tray} alt="Bakplaat" /><div className="cookie-tray__contents" aria-hidden="true">{success ? <Quantity amount={3} /> : <span className="cookie-gap">?</span>}</div></div>
    <img className="cookie-oven" src={mathAssets.oven} alt="Oven" />
    <strong className="scene-caption">{caption}</strong>
  </div>;
}
export function HoneyJars({ question, placed, labels = true }: { question: MathQuestion; placed?: number; labels?: boolean }) {
  const left = evaluate(question.left), right = evaluate(question.right, placed ?? 0);
  const maximum = Math.max(left, ...question.options.map(value => evaluate(question.right, value)), 1);
  return <div className={`honey-jars${placed === question.answer ? ' is-success' : ''}`} role="img" aria-label={`Honing: links ${left}, rechts ${right}${left === right ? ', evenveel' : ''}`}>
    {[left, right].map((amount, index) => <div className="honey-jar" key={index}><div className="honey-jar__glass">{labels && <span>{index === 0 ? expressionText(question.left) : expressionText(question.right, placed)}</span>}<img className="honey-jar__art" src={mathAssets.honeyJar} alt="" /><div className="honey-meter" aria-hidden="true"><div className="honey-meter__fill" style={{ height: `${amount / maximum * 100}%` }} /></div></div></div>)}
    <div className="honey-bees" aria-hidden="true">{[0, 1].map(i => <img className="honey-bee" src={mathAssets.bee} alt="" key={i} />)}</div>
  </div>;
}
