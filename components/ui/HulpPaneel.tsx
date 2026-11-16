import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './hulp-paneel.css';

/**
 * Een hulpmiddel (rekenmachine, maten …) in de huisstijl: een glazen paneel
 * dat van rechts over de wereld schuift, met een houten titel. Sluiten met ×,
 * met Escape of door ernaast te tikken. Geen extra "Klaar"-knop: de wereld
 * blijft zichtbaar en je gaat gewoon verder. Zie docs/HUISSTIJL.md, "Navigatie".
 */
export default function HulpPaneel({ titel, sluitLabel, onClose, className = '', children }: {
  titel: string; sluitLabel: string; onClose: () => void; className?: string; children: React.ReactNode;
}) {
  const paneel = useRef<HTMLElement>(null);
  const sluit = useRef(onClose); sluit.current = onClose;
  useEffect(() => {
    const vorige = document.activeElement as HTMLElement | null;
    paneel.current?.querySelector<HTMLElement>('button, input, [tabindex]')?.focus();
    const toets = (event: KeyboardEvent) => { if (event.key === 'Escape') sluit.current(); };
    document.addEventListener('keydown', toets);
    return () => { document.removeEventListener('keydown', toets); vorige?.focus?.(); };
  }, []);
  if (typeof document === 'undefined') return null;
  return createPortal(<div className="hulp-paneel-laag" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside ref={paneel} className={`ck-glas hulp-paneel ${className}`} role="dialog" aria-modal="true" aria-label={titel}>
      <header className="hulp-paneel__kop">
        <h2 className="ck-houtbord hulp-paneel__titel">{titel}</h2>
        <button type="button" className="hulp-paneel__sluit" aria-label={sluitLabel} onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </header>
      <div className="hulp-paneel__inhoud">{children}</div>
    </aside>
  </div>, document.body);
}
