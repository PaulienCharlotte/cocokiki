import React from 'react';
import { operationSymbol } from './engine';
import type { Expression, MathQuestion } from './types';

function Part({ expression, answer, onPlace, nested = false }: { expression: Expression; answer?: number; onPlace?: () => void; nested?: boolean }) {
  if ('value' in expression) return <span>{expression.value}</span>;
  if ('blank' in expression) return onPlace ? <button type="button" className="math-blank" aria-label={answer === undefined ? 'Leeg vak, plaats gekozen getal' : `Geplaatst getal ${answer}, ander getal plaatsen`} onClick={onPlace}>{answer ?? '?'}</button> : <span className="math-blank">{answer ?? '?'}</span>;
  return <>{nested && <span>(</span>}<Part expression={expression.left} answer={answer} onPlace={onPlace} nested /> <span className="math-operator">{operationSymbol(expression.op)}</span> <Part expression={expression.right} answer={answer} onPlace={onPlace} nested />{nested && <span>)</span>}</>;
}
export default function Equation({ question, answer, onPlace }: { question: MathQuestion; answer?: number; onPlace?: () => void }) {
  return <div className="math-equation"><Part expression={question.left} answer={answer} onPlace={onPlace} /><span className="math-operator">=</span><Part expression={question.right} answer={answer} onPlace={onPlace} /></div>;
}
