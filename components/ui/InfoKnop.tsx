import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { IconButton } from '../../design-system';
import { CHARACTERS, type CharacterId } from '../../data/characters';
import './info-knop.css';

/**
 * Uitleg op verzoek, zoals de huisstijl het wil: het personage zegt het zelf,
 * linksonder in de vaste ballon (zone 5). Geen los venster met een kop.
 * Tik ergens, of druk op Escape, en de ballon gaat weer weg.
 */
export default function InfoKnop({ titel = 'Hoe werkt het?', character = 'lua', children, icon }: { icon?: React.ReactNode; titel?: string; character?: CharacterId; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const toets = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', toets);
    return () => document.removeEventListener('keydown', toets);
  }, [open]);
  const wie = CHARACTERS[character];
  return <>
    <IconButton className={`ck-gereedschap${open ? ' is-aan' : ''}`} label={titel} aria-expanded={open} icon={icon ?? <Info />} onClick={() => setOpen(value => !value)} />
    {open && typeof document !== 'undefined' && createPortal(<div className="ck-uitleg-laag" onPointerDown={() => setOpen(false)}>
      <div className="ck-ballon ck-uitleg" role="dialog" aria-label={titel}>
        <img className="ck-ballon__gezicht" src={wie.beeld} alt={wie.naam} />
        <p className="ck-ballon__tekst"><span className="ck-ballon__naam">{wie.naam}</span>{children}</p>
      </div>
    </div>, document.body)}
  </>;
}
