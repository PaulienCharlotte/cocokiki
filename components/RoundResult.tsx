import React, { useEffect, useRef } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface Props { correct: number; total: number; onContinue: () => void; onRetry?: () => void; onExit: () => void; memory?: boolean }
export default function RoundResult({ correct, total, onContinue, onRetry, onExit, memory }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section className="round-result">
    <img src="/images/logo-compas-geel.svg" width="72" height="72" alt="" />
    <p className="eyebrow">Route afgerond</p><h2 ref={heading} tabIndex={-1}>{memory ? 'Alle setjes gevonden!' : 'Lekker gereisd!'}</h2>
    <p className="result-number">{correct}<span> / {total}</span></p><p className="muted">{memory ? 'setjes zonder omweg' : 'plekken zonder hulp'}</p>
    <div className="result-actions"><button className="primary-button" onClick={onContinue}>{memory ? 'Volgende setjes' : 'Nieuwe route'}<ArrowRight size={18} /></button>
      {onRetry && <button className="secondary-button" onClick={onRetry}><RotateCcw size={18} />Lastige plekken herhalen</button>}
      <button className="text-button" onClick={onExit}>Terug naar de kaart</button>
    </div>
  </section>;
}
