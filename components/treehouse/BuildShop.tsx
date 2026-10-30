import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, House, Triangle } from 'lucide-react';
import { Button, Dialog, IconButton } from '../../design-system';
import { ROOM_TEMPLATES, ROOM_TEMPLATE_ASSETS, type RoomTemplateId } from '../../data/treehouse';
import { buildSlots, TREEHOUSE_UNIT_ASSETS, validBuildRooms, type BuildRoom, type RoofAsset } from '../../data/treehouseUnits';
import { ROOM_ICONS } from '../../data/roomIcons';
import { ROOF_PRODUCTS } from '../../data/treehouseRoofs';
import { loadCurrency } from '../../services/currency';
import { subscribeLocalState } from '../../services/localState';
import { buyRoom, loadRoomExpansions, roomTemplatePrice } from '../../services/roomExpansions';
import { loadTreehouseLayout, saveTreehouseLayout } from '../../services/treehouseLayout';
import { buyRoomRoof, roofPrice } from '../../services/treehouseRoofs';
import CocoCoin from '../platform/CocoCoin';
import './build-shop.css';

export default function BuildShop({ onClose, onBuilt }: { onClose: () => void; onBuilt: () => void }) {
  const [tab, setTab] = useState<'rooms' | 'roofs'>('rooms');
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<RoomTemplateId>('hobby-room');
  const [roof, setRoof] = useState<RoofAsset>('roofBlue');
  const [name, setName] = useState('Hobbykamer');
  const [iconId, setIconId] = useState('paint');
  const [rooms, setRooms] = useState(loadTreehouseLayout);
  const [balance, setBalance] = useState(loadCurrency);
  const [error, setError] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());
  const [expansions, setExpansions] = useState(loadRoomExpansions);
  const eligible = rooms.filter(room => !['terrace', 'garden'].includes(room.asset) && !rooms.some(other => other.column === room.column && other.floor > room.floor));
  const [targetId, setTargetId] = useState(() => eligible[0]?.id ?? '');
  const asset = ROOM_TEMPLATE_ASSETS[templateId];
  const place = buildSlots(rooms).find(slot => validBuildRooms([...rooms, { id: '__shop-room', name, asset, ...slot }]));
  const price = tab === 'rooms' ? roomTemplatePrice(expansions, templateId) : roofPrice(targetId, roof);
  const target = eligible.find(room => room.id === targetId);
  const canBuy = price !== null && balance >= price && (tab === 'rooms' ? !!place && !!name.trim() : !!target && (target.roof ?? 'roof') !== roof);
  useEffect(() => subscribeLocalState(() => { setRooms(loadTreehouseLayout()); setBalance(loadCurrency()); setExpansions(loadRoomExpansions()); }), []);

  const purchase = () => {
    if (!canBuy || price === null) return;
    if (tab === 'roofs') {
      const result = buyRoomRoof(targetId, roof, requestId, price);
      if (!['applied', 'duplicate'].includes(result.status)) { setError(result.status === 'insufficient' ? 'Niet genoeg CocoCoins.' : 'Plaatsen lukt even niet. Probeer opnieuw.'); return; }
    } else {
      if (!place) return;
      const result = buyRoom(templateId, name, requestId, price, iconId);
      if (!result.room || !['applied', 'duplicate'].includes(result.status)) { setError(result.status === 'insufficient' ? 'Niet genoeg CocoCoins.' : result.status === 'price-changed' ? 'De prijs is veranderd. Controleer je keuze.' : 'Bouwen lukt even niet. Probeer opnieuw.'); return; }
      const next: BuildRoom[] = [...rooms, { id: result.room, name: name.trim().slice(0, 30), asset, icon: iconId, ...place }];
      // Ownership is already committed; a failed layout write falls back to a free valid slot.
      saveTreehouseLayout(next);
    }
    onBuilt();
  };

  return <Dialog open className="build-shop" title={step === 0 ? 'Breid je boomhut uit' : tab === 'rooms' ? 'Jouw nieuwe kamer' : 'Kies een kamer'} onClose={onClose}
    primaryAction={<Button disabled={step === 0 ? tab === 'rooms' ? !place || price === null : !eligible.length : !canBuy} startIcon={step === 0 ? <ArrowRight size={18} /> : <Check size={18} />} onClick={() => step === 0 ? setStep(1) : purchase()}>
      {step === 0 ? 'Volgende' : <>{tab === 'rooms' ? 'Bouwen' : 'Plaatsen'} <CocoCoin size={18} /> {price ?? 0}</>}
    </Button>}
    secondaryAction={step === 1 ? <Button variant="quiet" startIcon={<ArrowLeft size={18} />} onClick={() => { setStep(0); setError(''); }}>Terug</Button> : undefined}>
    <div className="build-shop__balance" aria-label={`${balance} CocoCoins beschikbaar`}><CocoCoin size={18} />{balance}</div>
    {step === 0 ? <>
      <div className="build-shop__tabs" role="tablist" aria-label="Bouwonderdelen">
        <button role="tab" aria-selected={tab === 'rooms'} aria-controls="build-products" id="build-rooms-tab" onClick={() => { setTab('rooms'); setError(''); }}><House size={18} />Kamers</button>
        <button role="tab" aria-selected={tab === 'roofs'} aria-controls="build-products" id="build-roofs-tab" onClick={() => { setTab('roofs'); setError(''); }}><Triangle size={18} />Daken</button>
      </div>
      <div id="build-products" className="build-shop__products" role="tabpanel" aria-labelledby={tab === 'rooms' ? 'build-rooms-tab' : 'build-roofs-tab'}>
        {tab === 'rooms' ? ROOM_TEMPLATES.map(item => {
          const unit = TREEHOUSE_UNIT_ASSETS[ROOM_TEMPLATE_ASSETS[item.id]], cost = roomTemplatePrice(expansions, item.id);
          return <button key={item.id} className="build-shop__product" aria-label={`${item.label}, ${cost ?? 'geen ruimte'} CocoCoins`} aria-pressed={templateId === item.id} onClick={() => { setTemplateId(item.id); setName(item.label); setIconId(item.id === 'bathroom-unit' ? 'bath' : item.id === 'extra-bedroom' || item.id === 'blush-room' ? 'bed' : item.group === 'balcony' ? 'plant' : 'paint'); setError(''); }}>
            <img src={unit.src} alt="" /><strong>{item.label}</strong><span><CocoCoin size={17} />{cost ?? 'Vol'}</span>
          </button>;
        }) : ROOF_PRODUCTS.map(item => <button key={item.asset} className="build-shop__product" aria-label={`${item.label}, ${item.price} CocoCoins`} aria-pressed={roof === item.asset} onClick={() => { setRoof(item.asset); setError(''); }}>
          <img src={TREEHOUSE_UNIT_ASSETS[item.asset].src} alt="" /><strong>{item.label}</strong><span><CocoCoin size={17} />{item.price === 0 ? 'Gratis' : item.price}</span>
        </button>)}
      </div>
    </> : tab === 'rooms' ? <div className="build-shop__details">
      <label>Naam<input value={name} aria-label="Naam" maxLength={30} onChange={event => setName(event.target.value)} /></label>
      <div className="build-shop__icons" role="group" aria-label="Iconenbibliotheek">{ROOM_ICONS.map(({ id, label, Icon }) => <IconButton key={id} label={label} aria-pressed={iconId === id} icon={<Icon size={24} />} onClick={() => setIconId(id)} />)}</div>
    </div> : <div className="build-shop__products" role="group" aria-label="Kamer voor het dak">{eligible.map(room => {
      const { Icon } = ROOM_ICONS.find(item => item.id === room.icon) ?? ROOM_ICONS[0];
      return <button key={room.id} className="build-shop__target" aria-pressed={targetId === room.id} onClick={() => setTargetId(room.id)}><Icon size={25} /><span>{room.name}</span></button>;
    })}</div>}
    {price !== null && balance < price && <p className="build-shop__note" role="status">Nog {price - balance} CocoCoins nodig.</p>}
    {tab === 'rooms' && (!place || price === null) && <p className="build-shop__note" role="status">Geen vrije plek voor deze kamer.</p>}
    {tab === 'roofs' && step === 1 && target && (target.roof ?? 'roof') === roof && <p className="build-shop__note">Dit dak ligt hier al.</p>}
    {error && <p role="alert">{error}</p>}
  </Dialog>;
}
