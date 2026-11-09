import React from 'react';
import { Button, Dialog } from '../../design-system';

export default function TopoExitDialog({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  return <Dialog open={open} title="Weet je zeker dat je de topo wilt verlaten?"
    onClose={onStay} closeLabel="Verder met topo"
    primaryAction={<Button onClick={onStay}>Verder met topo</Button>}
    secondaryAction={<Button variant="quiet" onClick={onLeave}>Topo verlaten</Button>} />;
}
