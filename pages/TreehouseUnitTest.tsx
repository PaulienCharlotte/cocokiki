import React, { useEffect, useRef, useState } from 'react';
import { Coins, RotateCcw, ArrowLeft, ArrowRight, ZoomOut, ZoomIn, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button, Dialog, IconButton } from '../design-system';
import { expandableTreehouseLayout, INITIAL_BUILD_ROOMS, moveBuildRoom, validBuildRooms, prototypeUnitLayout, TREEHOUSE_UNIT_ASSETS, ROOM_UNIT_FRAME, type BuildRoomAsset, type PreviewUnit } from '../data/treehouseUnits';
import { loadBuildPreview, saveBuildPreview } from '../services/treehouseBuildPreview';
import './treehouse-unit-test.css';
import SellAction from '../components/treehouse/SellAction';
import { ROOM_ICONS } from '../data/roomIcons';
import { ROOM_TEMPLATES, isExtraRoom, type RoomTemplateId } from '../data/treehouse';
import { buyRoom, loadRoomExpansions, nextRoomPrice } from '../services/roomExpansions';
import { loadTreehouseLayout, saveTreehouseLayout, roomSaleAmount, sellTreehouseRoom } from '../services/treehouseLayout';
import { loadCurrency } from '../services/currency';

interface RoomDrag { id: string; pointer: number; startX: number; startY: number; dx: number; dy: number; column: number; floor: number; moved: boolean }

export default function TreehouseUnitTest({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const live = !!onNavigate;
  const [joined, setJoined] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<'house' | 'grid'>('house');
  const [rooms, setRooms] = useState(() => live ? loadTreehouseLayout() : loadBuildPreview());
  const saveRooms = live ? saveTreehouseLayout : saveBuildPreview;
  const [iconId, setIconId] = useState('sofa');
  const [addStep, setAddStep] = useState(0);
  const [templateId, setTemplateId] = useState<RoomTemplateId>('hobby-room');
  const purchaseId = useRef('');
  const [slot, setSlot] = useState<{ column: number; floor: number } | null>(null);
  const [asset, setAsset] = useState<BuildRoomAsset>('room');
  const [name, setName] = useState('Hobbykamer');
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeId, setRemoveId] = useState('');
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [drag, setDrag] = useState<RoomDrag | null>(null);
  const dragRef = useRef<RoomDrag | null>(null);
  const suppressClick = useRef(false);
  const planeRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLElement>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight }));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const updateDrag = (value: RoomDrag | null) => { dragRef.current = value; setDrag(value); };
  useEffect(() => {
    const cancel = () => { dragRef.current = null; setDrag(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('blur', cancel); window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('blur', cancel); window.removeEventListener('keydown', escape); };
  }, []);
  const commitMove = (id: string, column: number, floor: number) => {
    const next = moveBuildRoom(rooms, id, column, floor);
    if (!next) { setNotice('Deze plek past niet. Kamers moeten verbonden blijven; boven een terras blijft het open.'); return; }
    if (!saveRooms(next)) { setNotice('Opslaan lukt even niet. De kamer blijft op zijn oude plek.'); return; }
    setRooms(next); setNotice(`${next.find(room => room.id === id)!.name} verplaatst.`);
  };
  const house = expandableTreehouseLayout(joined, rooms);
  const grid = prototypeUnitLayout(joined);
  const layout = mode === 'house' ? house : {
    ...grid, units: grid.units.map(unit => ({ ...unit, asset: 'room' as const, width: ROOM_UNIT_FRAME.width, height: ROOM_UNIT_FRAME.height })),
  };
  const dropAllowed = drag ? moveBuildRoom(rooms, drag.id, drag.column, drag.floor) !== null : false;
  const fitWidth = Math.min(viewportSize.width, viewportSize.height * layout.width / layout.height);
  const selectedRoom = rooms.find(room => room.id === removeId);
  const price = live ? nextRoomPrice(loadRoomExpansions(), ROOM_TEMPLATES.find(item => item.id === templateId)!.group) : 0;
  return <main className={`unit-test${live ? ' unit-test--live' : ''}`} aria-label="Mijn boomhut">
    <header className="unit-test__toolbar">
      <div className="unit-test__controls" role="toolbar" aria-label="Bouwgereedschap">
        <IconButton label="Uitzoomen" disabled={zoom <= 50} icon={<ZoomOut size={19} />} onClick={() => setZoom(value => Math.max(50, value - 10))} />
        <output aria-label="Zoom">{zoom}%</output>
        <IconButton label="Inzoomen" disabled={zoom >= 250} icon={<ZoomIn size={19} />} onClick={() => setZoom(value => Math.min(250, value + 10))} />
        <IconButton label="Weergave herstellen" disabled={zoom === 100} icon={<RotateCcw size={19} />} onClick={() => { setZoom(100); viewportRef.current?.scrollTo({ left: 0, top: 0 }); }} />
        {!live && <IconButton label="Bouwinstellingen" aria-expanded={settingsOpen} icon={<SlidersHorizontal size={19} />} onClick={() => setSettingsOpen(true)} />}
      </div>
    </header>
    <section ref={viewportRef} className="unit-test__viewport" aria-label={mode === 'house' ? 'Boomhut met slaapkamer, terras, woonkamer, keuken, dak en boomstam' : 'Vier kamerunits, twee naast en twee boven elkaar'} tabIndex={0}>
      <div ref={planeRef} className={`unit-test__plane${drag ? ' is-dragging' : ''}`} style={{ width: fitWidth > 0 ? `${fitWidth * zoom / 100}px` : `${zoom}%`, aspectRatio: `${layout.width} / ${layout.height}` }}>
        {layout.units.map((unit: PreviewUnit) => {
          const asset = TREEHOUSE_UNIT_ASSETS[unit.asset], frame = asset.frame;
          const room = mode === 'house' ? rooms.find(item => item.id === (unit.roomId ?? unit.id)) : undefined;
          const moving = !!room && drag?.id === room.id;
          return <div key={unit.id} className={`unit-test__room unit-test__room--${unit.asset}${room ? ' is-movable' : ''}${moving ? ' is-moving' : ''}`} data-unit={unit.id}
          role={room ? 'button' : undefined} tabIndex={room ? 0 : undefined} aria-label={room ? `${room.name}${unit.asset === 'roof' ? ' met dak' : ''} verplaatsen` : undefined} aria-roledescription={room ? 'sleepbare kamer' : undefined}
          onKeyDown={event => {
            if (!room) return;
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (live) onNavigate?.(`/treehouse/${room.id}`); else { setRemoveId(room.id); setError(''); setRemoving(true); } return; }
            const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
            if (!direction) return;
            event.preventDefault(); commitMove(room.id, room.column + direction[0], room.floor + direction[1]);
          }}
          onPointerDown={event => {
            if (!room || event.button !== 0 || dragRef.current) return;
            suppressClick.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
            setNotice('');
            updateDrag({ id: room.id, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, column: room.column, floor: room.floor, moved: false });
          }}
          onPointerMove={event => {
            const current = dragRef.current, plane = planeRef.current;
            if (!room || !current || current.pointer !== event.pointerId || !plane) return;
            const pixels = plane.getBoundingClientRect();
            const dx = (event.clientX - current.startX) * layout.width / pixels.width;
            const dy = (event.clientY - current.startY) * layout.height / pixels.height;
            updateDrag({ ...current, dx, dy, column: room.column + Math.round(dx / house.stepX), floor: room.floor - Math.round(dy / house.stepY), moved: current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 5 });
          }}
          onPointerUp={event => {
            const current = dragRef.current;
            if (!current || current.pointer !== event.pointerId) return;
            suppressClick.current = current.moved;
            if (current.moved) commitMove(current.id, current.column, current.floor);
            updateDrag(null);
          }}
          onClick={() => {
            if (!room || suppressClick.current) return;
            if (live) { onNavigate?.(`/treehouse/${room.id}`); return; }
            setRemoveId(room.id); setError(''); setRemoving(true);
          }}
          onPointerCancel={() => updateDrag(null)} onLostPointerCapture={() => updateDrag(null)} style={{
          left: `${unit.x / layout.width * 100}%`, top: `${unit.y / layout.height * 100}%`,
          width: `${unit.width / layout.width * 100}%`, height: `${unit.height / layout.height * 100}%`,
          transform: moving ? `translate(${drag.dx / unit.width * 100}%, ${drag.dy / unit.height * 100}%)` : unit.flipX ? 'scaleX(-1)' : undefined,
        }}>
          <img src={asset.src} alt={rooms.find(room => room.id === unit.id)?.name ?? asset.label} draggable={false} style={{
            left: `${-frame.x / frame.width * 100}%`, top: `${-frame.y / frame.height * 100}%`,
            width: `${frame.sourceWidth / frame.width * 100}%`, height: `${frame.sourceHeight / frame.height * 100}%`,
          }} />
        </div>; })}
        {drag?.moved && <div className={`unit-test__drop${dropAllowed ? ' is-allowed' : ''}`} aria-hidden="true" style={{ left: `${(100 + drag.column * house.stepX) / layout.width * 100}%`, top: `${(480 + (house.highest - drag.floor) * house.stepY) / layout.height * 100}%`, width: `${ROOM_UNIT_FRAME.width / layout.width * 100}%`, height: `${ROOM_UNIT_FRAME.height / layout.height * 100}%` }} />}
        {live && mode === 'house' && rooms.map(room => {
          const unit = layout.units.find(item => item.id === room.id)!;
          const { Icon } = ROOM_ICONS.find(icon => icon.id === room.icon) ?? ROOM_ICONS[0];
          return <IconButton key={`nav-${room.id}`} className="unit-test__room-link" label={`${room.name} openen`} title={room.name} icon={<Icon size={23} />} style={{ left: `${(unit.x + unit.width / 2) / layout.width * 100}%`, top: `${(unit.y + unit.height * .6) / layout.height * 100}%` }} onClick={() => onNavigate?.(`/treehouse/${room.id}`)} />;
        })}
        {mode === 'house' && house.slots.slice(0, 1).map(place => <button key="add-room" className="unit-test__add" type="button" aria-label="Kamer toevoegen" title="Kamer toevoegen" style={{ left: `${(place.x + place.width / 2) / layout.width * 100}%`, top: `${(place.y + place.height * (rooms.some(room => room.column === place.column && room.floor === place.floor - 1) ? .15 : .5)) / layout.height * 100}%` }} onClick={() => { setSlot(place); setAsset('room'); setName('Hobbykamer'); setTemplateId('hobby-room'); setIconId('sofa'); setAddStep(0); purchaseId.current = crypto.randomUUID(); setError(''); }}><Plus /></button>)}
      </div>
    </section>
    <p className={`unit-test__notice${notice ? ' is-visible' : ''}`} role="status">{notice}</p>
    <Dialog open={removing} title={rooms.find(room => room.id === removeId)?.name ?? 'Onderdeel'} onClose={() => setRemoving(false)} primaryAction={null}>
      <div className="unit-test__sale">
      {live && <div className="unit-test__icon-library" role="group" aria-label="Kamericoon">{ROOM_ICONS.map(({ id, label, Icon }) => <IconButton key={id} label={label} aria-pressed={selectedRoom?.icon === id} icon={<Icon size={24} />} onClick={() => { const next = rooms.map(room => room.id === removeId ? { ...room, icon: id } : room); if (saveRooms(next)) setRooms(next); else setError('Opslaan lukt even niet.'); }} />)}</div>}
      <SellAction key={removeId} name={rooms.find(room => room.id === removeId)?.name ?? 'Onderdeel'} amount={live ? roomSaleAmount(removeId) : 0} disabled={!removeId || (live && !isExtraRoom(removeId)) || !validBuildRooms(rooms.filter(room => room.id !== removeId))} onSell={() => {
      const next = rooms.filter(room => room.id !== removeId);
      if (!removeId || !validBuildRooms(next) || !(live ? sellTreehouseRoom(removeId) : saveRooms(next))) return false;
      setRooms(next); setRemoving(false); setNotice('Kamer verwijderd.');
      return true;
      }} />
      {live && !isExtraRoom(removeId) ? <p className="unit-test__sale-note">Startkamer</p> : removeId && !validBuildRooms(rooms.filter(room => room.id !== removeId)) && <p role="alert">Deze kamer houdt je boomhut bij elkaar.</p>}
      {error && <p role="alert">{error}</p>}
      </div>
    </Dialog>
    <Dialog open={settingsOpen} title="Bouwinstellingen" onClose={() => setSettingsOpen(false)} primaryAction={<Button onClick={() => setSettingsOpen(false)}>Klaar</Button>}>
      <div className="unit-test__form">
        {!live && <label>Opstelling<select aria-label="Opstelling" value={mode} onChange={event => setMode(event.target.value as 'house' | 'grid')}><option value="house">Boomhut</option><option value="grid">Vier basisunits</option></select></label>}
        <label className="unit-test__toggle"><input type="checkbox" checked={joined} onChange={event => setJoined(event.target.checked)} />Kamers aansluiten</label>
        <label>Zoom<input aria-label="Zoom instellen" type="range" min="50" max="250" step="10" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label>
        {!live && JSON.stringify(rooms) !== JSON.stringify(INITIAL_BUILD_ROOMS) && <Button variant="quiet" startIcon={<Trash2 size={18} />} onClick={() => { setSettingsOpen(false); setError(''); setClearing(true); }}>Proefkamers wissen</Button>}
      </div>
    </Dialog>
    <Dialog open={slot !== null} title={addStep === 0 ? 'Kies je kamer' : 'Kies een icoon'} onClose={() => setSlot(null)} primaryAction={<Button disabled={!name.trim() || (addStep === 1 && live && (price === null || loadCurrency() < price))} startIcon={addStep === 0 ? <ArrowRight size={18} /> : <Plus size={18} />} onClick={() => {
      if (!slot || !name.trim()) return;
      if (addStep === 0) { setAddStep(1); return; }
      let id = `build-${crypto.randomUUID()}`;
      if (live) {
        if (price === null) return;
        const result = buyRoom(templateId, name, purchaseId.current, price);
        if (!result.room || !['applied', 'duplicate'].includes(result.status)) { setError(result.status === 'insufficient' ? 'Niet genoeg CocoCoins.' : 'Bouwen lukt even niet. Probeer opnieuw.'); return; }
        id = result.room;
      }
      const next = [...rooms, { id, asset, icon: iconId, name: name.trim().slice(0, 30), column: slot.column, floor: slot.floor }];
      if (!saveRooms(next)) {
        if (live) { setRooms(loadTreehouseLayout()); setSlot(null); setNotice('Kamer gebouwd. De indeling is automatisch geplaatst.'); return; }
        setError('Opslaan lukt even niet. Probeer opnieuw.'); return;
      }
      setRooms(next); setSlot(null);
    }}>{addStep === 0 ? 'Volgende' : live ? <>Bouwen <Coins size={17} /> {price ?? 'Vol'}</> : 'Toevoegen'}</Button>} secondaryAction={addStep === 1 ? <Button variant="quiet" startIcon={<ArrowLeft size={18} />} onClick={() => setAddStep(0)}>Terug</Button> : undefined}>
      <div className="unit-test__form">
        {addStep === 0 && <>
        {live ? <label>Ruimte<select aria-label="Ruimte" value={templateId} onChange={event => {
          const chosen = ROOM_TEMPLATES.find(item => item.id === event.target.value)!;
          setTemplateId(chosen.id); setName(chosen.label); setAsset(chosen.id === 'extra-bedroom' ? 'bedroom' : 'room'); setIconId(chosen.id === 'extra-bedroom' ? 'bed' : chosen.group === 'balcony' ? 'plant' : 'paint');
        }}>{ROOM_TEMPLATES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label> :
        <label>Ruimte<select aria-label="Ruimte" value={asset} onChange={event => { const value = event.target.value as BuildRoomAsset; setAsset(value); setName(value === 'room' ? 'Hobbykamer' : TREEHOUSE_UNIT_ASSETS[value].label); }}>
          <option value="room">Hobbykamer</option><option value="bedroom">Slaapkamer</option><option value="kitchen">Keuken</option><option value="terrace">Terras</option>
        </select></label>}
        <label>Naam<input aria-label="Naam" value={name} maxLength={30} onChange={event => setName(event.target.value)} /></label>
        </>}
        {addStep === 1 && <div className="unit-test__icon-library" role="group" aria-label="Iconenbibliotheek">{ROOM_ICONS.map(({ id, label, Icon }) => <IconButton key={id} label={label} aria-pressed={iconId === id} icon={<Icon size={25} />} onClick={() => setIconId(id)} />)}</div>}
        {live && addStep === 1 && (price === null || loadCurrency() < price) && <p role="status">{price === null ? 'Alle uitbreidingen zijn gebouwd.' : 'Nog niet genoeg CocoCoins.'}</p>}
        {error && <p role="alert">{error}</p>}
      </div>
    </Dialog>
    <Dialog open={clearing} title="Proefopstelling herstellen?" description="Extra proefkamers verdwijnen en de oorspronkelijke kamers gaan terug naar hun beginplek. Je echte boomhut blijft bewaard." onClose={() => setClearing(false)} primaryAction={<Button variant="danger" onClick={() => {
      if (!saveBuildPreview(INITIAL_BUILD_ROOMS)) { setError('Opslaan lukt even niet. Probeer opnieuw.'); return; }
      setRooms([...INITIAL_BUILD_ROOMS]); setClearing(false);
    }}>Wissen</Button>} secondaryAction={<Button variant="quiet" onClick={() => setClearing(false)}>Annuleren</Button>}>
      {error && <p role="alert">{error}</p>}
    </Dialog>
  </main>;
}
