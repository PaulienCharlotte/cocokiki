import React from 'react';
import { Brain } from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import HulpPaneel from './HulpPaneel';
import './niveau-knop.css';

/** Vaste niveau-ingang in de gereedschapsbalk van elk spel. */
export default function NiveauKnop({ niveau, onClick, className = '' }: { niveau: number; onClick: () => void; className?: string }) {
  return <IconButton className={`ck-gereedschap niveau-knop ${className}`} label={`Niveau ${niveau}, kies een ander niveau`} title={`Niveau ${niveau}`} icon={<><Brain size={22} aria-hidden="true" /><span className="niveau-knop__getal" aria-hidden="true">{niveau}</span></>} onClick={onClick} aria-haspopup="dialog" />;
}
export function NiveauKeuze({ niveau, keuzes, onKies, onClose }: { niveau: number; keuzes: Array<{ niveau: number; tekst: string }>; onKies: (niveau: number) => void; onClose: () => void }) {
  return <HulpPaneel titel="Niveau kiezen" sluitLabel="Niveau sluiten" onClose={onClose} className="niveau-keuze">
    <div className="niveau-keuze__lijst">{keuzes.map(keuze => <Button key={keuze.niveau} variant={keuze.niveau === niveau ? 'secondary' : 'quiet'} fullWidth aria-pressed={keuze.niveau === niveau} onClick={() => { if (keuze.niveau !== niveau) onKies(keuze.niveau); onClose(); }}>Niveau {keuze.niveau} · {keuze.tekst}</Button>)}</div>
  </HulpPaneel>;
}
