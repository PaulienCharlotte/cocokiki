import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Dialog } from '../../design-system';
import { ROOM_TEMPLATES, type RoomTemplateId } from '../../data/treehouse';
import { buyRoom, loadRoomExpansions, nextRoomPrice } from '../../services/roomExpansions';
import { loadCurrency } from '../../services/currency';
import { subscribeLocalState } from '../../services/localState';

export default function RoomExpansionDialog({ onClose, onNavigate }: { group?: 'inside' | 'balcony'; onClose: () => void; onNavigate: (path: string) => void }) {
  const options = ROOM_TEMPLATES;
  const [templateId, setTemplateId] = useState<RoomTemplateId>(options[0].id);
  const [name, setName] = useState(options[0].label as string);
  const [requestId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(loadCurrency);
  const [rooms, setRooms] = useState(loadRoomExpansions);
  const template = options.find(item => item.id === templateId)!;
  const price = nextRoomPrice(rooms, template.group);
  useEffect(() => subscribeLocalState(() => { setBalance(loadCurrency()); setRooms(loadRoomExpansions()); }), []);
  const purchase = () => {
    if (price === null) return;
    const result = buyRoom(templateId, name, requestId, price);
    if ((result.status === 'applied' || result.status === 'duplicate') && result.room) { onClose(); onNavigate(`/treehouse/${result.room}`); }
    else {
      setRooms(loadRoomExpansions()); setBalance(loadCurrency());
      setError(result.status === 'price-changed' ? 'De prijs is gewijzigd door een andere aankoop. Controleer de nieuwe prijs.' : result.status === 'insufficient' ? 'Je hebt nog niet genoeg CocoCoins.' : result.status === 'full' ? 'Alle uitbreidingen zijn al gebouwd.' : 'Opslaan lukt even niet. Er is niets afgeschreven.');
    }
  };
  return <Dialog open title="Ruimte toevoegen" className="room-expansion-dialog" onClose={onClose}
    primaryAction={<Button startIcon={<Plus size={18} />} disabled={price === null || balance < price || !name.trim()} onClick={purchase}>{price === null ? 'Volgebouwd' : `Bouwen · ${price} CocoCoins`}</Button>}>
    <img className="room-expansion-preview" src={template.background} alt={template.label} />
    <label>Ruimte<select value={templateId} onChange={event => { const chosen = options.find(item => item.id === event.target.value)!; setTemplateId(chosen.id); setName(chosen.label); setError(''); }}>{options.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label>Naam<input value={name} maxLength={30} onChange={event => setName(event.target.value)} /></label>
    <p>Je saldo: {balance} CocoCoins</p>
    {price !== null && balance < price && <p role="status">Nog {price - balance} CocoCoins nodig</p>}
    {error && <p role="alert">{error}</p>}
  </Dialog>;
}
