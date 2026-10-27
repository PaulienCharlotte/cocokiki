import React from 'react';
import { Lightbulb } from 'lucide-react';
import TipCoach from '../../components/TipCoach';

export default function MathHelp({ open, onToggle, children }: { open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <div className="math-help">
    <button type="button" className="math-help__button" aria-expanded={open} onClick={onToggle}>
      <img src="/images/avatars/luiaard.webp" alt="" /><Lightbulb size={18} /><span>{open ? 'Tip sluiten' : 'Vraag Baby Lua om een tip'}</span>
    </button>
    {open && <TipCoach coach="lua">{children}</TipCoach>}
  </div>;
}
