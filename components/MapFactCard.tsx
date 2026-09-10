import React from 'react';
import { X } from 'lucide-react';

interface Props {
  eyebrow: string;
  name: string;
  text: string;
  context?: string;
  tone?: 'default' | 'success' | 'detour';
  className?: string;
  inline?: boolean;
  onClose: () => void;
}

export default function MapFactCard({ eyebrow, name, text, context, tone = 'default', className = '', inline = false, onClose }: Props) {
  return <aside
    className={`map-fact-card ${tone}${inline ? ' inline' : ''}${className ? ` ${className}` : ''}`}
    aria-live="polite"
  >
    <img src="/images/logo-compas-geel.svg" width="44" height="44" alt="" />
    <div className="fact-card-copy">
      <span className="fact-card-eyebrow">{eyebrow}</span>
      <h3>{name}</h3>
      {context && <p className="fact-card-context">{context}</p>}
      <p className="fact-card-text">{text}</p>
    </div>
    <button className="icon-button" onClick={onClose} aria-label="Weetje sluiten" title="Weetje sluiten"><X size={17} /></button>
  </aside>;
}
