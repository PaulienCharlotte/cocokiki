import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { IconButton } from '../design-system';
import { prototypeUnitLayout, ROOM_UNIT_ASSET, ROOM_UNIT_FRAME as frame } from '../data/treehouseUnits';
import './treehouse-unit-test.css';

export default function TreehouseUnitTest() {
  const [joined, setJoined] = useState(true);
  const [zoom, setZoom] = useState(100);
  const layout = prototypeUnitLayout(joined);
  return <main className="unit-test" aria-labelledby="unit-test-title">
    <header className="unit-test__toolbar">
      <h1 id="unit-test-title">Boomhutproef</h1>
      <div className="unit-test__controls">
        <label><input type="checkbox" checked={joined} onChange={event => setJoined(event.target.checked)} />Balken aansluiten</label>
        <label className="unit-test__zoom">Zoom<input aria-label="Zoom" type="range" min="50" max="160" step="10" value={zoom} onChange={event => setZoom(Number(event.target.value))} /><output>{zoom}%</output></label>
        <IconButton label="Weergave herstellen" icon={<RotateCcw size={20} />} onClick={() => { setJoined(true); setZoom(100); }} />
      </div>
    </header>
    <section className="unit-test__viewport" aria-label="Vier kamerunits, twee naast en twee boven elkaar" tabIndex={0}>
      <div className="unit-test__plane" style={{ width: `${zoom}%`, aspectRatio: `${layout.width} / ${layout.height}` }}>
        {layout.units.map((unit, index) => <div key={unit.id} className="unit-test__room" style={{
          left: `${unit.x / layout.width * 100}%`, top: `${unit.y / layout.height * 100}%`,
          width: `${frame.width / layout.width * 100}%`, height: `${frame.height / layout.height * 100}%`,
        }}>
          <img src={ROOM_UNIT_ASSET} alt={`Lege kamer ${index + 1}`} draggable={false} style={{
            left: `${-frame.x / frame.width * 100}%`, top: `${-frame.y / frame.height * 100}%`,
            width: `${frame.sourceWidth / frame.width * 100}%`, height: `${frame.sourceHeight / frame.height * 100}%`,
          }} />
        </div>)}
      </div>
    </section>
  </main>;
}
