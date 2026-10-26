import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import RoomExpansionDialog from './RoomExpansionDialog';
import './expansion.css';

export default function RoomNavigation({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [adding, setAdding] = useState(false);
  return <>
    <button className="treehouse-add-room" type="button" title="Ruimte toevoegen" aria-label="Ruimte toevoegen" onClick={() => setAdding(true)}><Plus size={24} /></button>
    {adding && <RoomExpansionDialog onClose={() => setAdding(false)} onNavigate={onNavigate} />}
  </>;
}
