import React, { useEffect, useState } from 'react';
import { Button, Dialog } from '../../design-system';
import { DECOR_PRODUCTS_BY_ID } from '../../data/decorCatalog';
import { loadRoomInventory, ROOM_INVENTORY_KEY } from '../../services/roomInventory';
import { subscribeLocalState } from '../../services/localState';

export default function Backpack({ onClose, onNavigate }: { onClose: () => void; onNavigate: (path: string) => void }) {
  const [inventory, setInventory] = useState(loadRoomInventory);
  useEffect(() => subscribeLocalState(() => setInventory(loadRoomInventory()), ROOM_INVENTORY_KEY), []);
  const owned = (Object.entries(inventory.owned) as Array<[string, number]>).filter(([id, quantity]) => quantity > 0 && DECOR_PRODUCTS_BY_ID[id]);
  return <Dialog open className="dream-backpack" title="Mijn rugzak" onClose={onClose} primaryAction={<Button onClick={() => { onClose(); onNavigate('/treehouse/living-room'); }}>Mijn kamer inrichten</Button>}>
    <Button variant="secondary" onClick={() => { onClose(); onNavigate('/plants/collection'); }}>Mijn planten</Button>
    {owned.length ? <ul>{owned.map(([id, count]) => <li key={id}><img src={DECOR_PRODUCTS_BY_ID[id].image} alt="" /><span>{DECOR_PRODUCTS_BY_ID[id].name}<strong> · {count}</strong></span></li>)}</ul> : <p>Je verzamelde meubels en planten komen hier.</p>}
  </Dialog>;
}
