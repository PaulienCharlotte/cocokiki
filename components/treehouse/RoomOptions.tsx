import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { Dialog, IconButton } from '../../design-system';
import { isExtraRoom } from '../../data/treehouse';
import { validBuildRooms } from '../../data/treehouseUnits';
import { loadTreehouseLayout, roomSaleAmount, sellTreehouseRoom } from '../../services/treehouseLayout';
import SellAction from './SellAction';
import './room-options.css';

export default function RoomOptions({ roomId, onNavigate }: { key?: string; roomId: string; onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState(loadTreehouseLayout);
  const [error, setError] = useState('');
  const room = rooms.find(item => item.id === roomId);
  const removable = isExtraRoom(roomId) && validBuildRooms(rooms.filter(item => item.id !== roomId));
  if (!room || !isExtraRoom(roomId)) return null;
  return <>
    <IconButton className="room-options-trigger" label="Kamer verkopen" icon={<Coins size={21} />} onClick={() => { setRooms(loadTreehouseLayout()); setError(''); setOpen(true); }} />
    <Dialog open={open} title={room.name} primaryAction={null} onClose={() => setOpen(false)}>
      <div className="room-options">
        {isExtraRoom(roomId) && <SellAction key={roomId} name={room.name} amount={roomSaleAmount(roomId)} disabled={!removable} onSell={() => {
          if (!sellTreehouseRoom(roomId)) return false;
          setOpen(false); onNavigate('/treehouse'); return true;
        }} />}
        {isExtraRoom(roomId) && !removable && <p>Deze kamer houdt je boomhut bij elkaar.</p>}
        {error && <p role="alert">{error}</p>}
      </div>
    </Dialog>
  </>;
}
