import React from 'react';
import { Button, Dialog } from '../../design-system';
import './topo-dialog.css';
import SpeechBubble from '../ui/SpeechBubble';

export default function TopoExitDialog({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  return <Dialog className="topo-exit-dialog ck-paper-surface" open={open} title="Weet je zeker dat je de topo wilt verlaten?"
    onClose={onStay} closeLabel="Verder met topo"
    primaryAction={<Button onClick={onStay}>Verder met topo</Button>}
    secondaryAction={<Button variant="quiet" onClick={onLeave}>Topo verlaten</Button>}>
    <SpeechBubble character="seb">Kom later gerust verder oefenen.</SpeechBubble>
  </Dialog>;
}
