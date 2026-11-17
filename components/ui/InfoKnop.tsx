import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Dialog, IconButton } from '../../design-system';
import type { CharacterId } from '../../data/characters';
import SpeechBubble from './SpeechBubble';
import './info-knop.css';

/** Uitleg op verzoek, in hetzelfde dialoogpatroon als de spellen. */
export default function InfoKnop({ titel = 'Hoe werkt het?', character, children, icon }: { icon?: React.ReactNode; titel?: string; character?: CharacterId; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><IconButton className="ck-gereedschap" label={titel} icon={icon ?? <Info />} onClick={() => setOpen(true)} />
    <Dialog className="spel-uitleg" primaryAction={null} open={open} title={titel} onClose={() => setOpen(false)}>{character ? <SpeechBubble character={character} label="Zo speel je">{children}</SpeechBubble> : children}</Dialog></>;
}
