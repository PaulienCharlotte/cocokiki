import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Brush, Copy, Download, Droplets, Eraser, Layers, PaintBucket, Redo2, RotateCcw, RotateCw, Save, Sparkles, Trash2, Undo2,
} from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import { TAART_BODEMS, TAART_BODEMS_BY_ID, VERSIERINGEN } from '../../data/cake/catalog';
import {
  BASIS_BREEDTE, TEKENMAAT, default as CakeCanvas, type CakeCanvasHandle,
} from './CakeCanvas';
import {
  MAX_SCHAAL, MIN_SCHAAL, bewaarOntwerp, laadOntwerp, nieuweVersieringId, verplaatsInStapel,
} from '../../services/cakeStudio';
import type { GeplaatsteVersiering, Penseel, VersieringSoort } from '../../data/cake/types';
import './cake-studio.css';

/**
 * Het taartenatelier: kies een taart, teken erop en leg er versieringen op.
 *
 * Er is hier geen goed of fout. Alles wat een kind maakt blijft bewaard in
 * één ontwerp, dat later weer opengaat zoals het was.
 */
const KLEUREN = [
  { id: '#fffdf8', naam: 'Wit' }, { id: '#f49ac1', naam: 'Roze' }, { id: '#7ec4e8', naam: 'Blauw' },
  { id: '#b08ad4', naam: 'Paars' }, { id: '#f7c948', naam: 'Geel' }, { id: '#7bbd6a', naam: 'Groen' },
  { id: '#7b4b2a', naam: 'Chocolade' },
];
const PENSELEN: Array<{ id: Penseel; naam: string; icoon: React.ReactNode }> = [
  { id: 'lijn', naam: 'Tekenen', icoon: <Brush size={20} /> },
  { id: 'spuitzak', naam: 'Spuitzak', icoon: <PaintBucket size={20} /> },
  { id: 'stippen', naam: 'Stippen', icoon: <Droplets size={20} /> },
  { id: 'gum', naam: 'Gum', icoon: <Eraser size={20} /> },
];
const DIKTES = [{ naam: 'Dun', waarde: 8 }, { naam: 'Normaal', waarde: 18 }, { naam: 'Dik', waarde: 34 }];
const SOORTEN: Array<{ id: VersieringSoort; naam: string }> = [
  { id: 'slagroom', naam: 'Slagroom' }, { id: 'fruit', naam: 'Fruit' }, { id: 'snoep', naam: 'Snoep' },
  { id: 'chocolade', naam: 'Chocolade' }, { id: 'versiering', naam: 'Versiering' },
];
const MAX_TERUG = 12;

export default function CakeStudio({ onClose }: { onClose: () => void }) {
  const [ontwerp, setOntwerp] = useState(laadOntwerp);
  const [versieringen, setVersieringen] = useState<GeplaatsteVersiering[]>(() => ontwerp.versieringen);
  const [bodemId, setBodemId] = useState(ontwerp.bodemId);
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [soort, setSoort] = useState<VersieringSoort>('slagroom');
  const [penseel, setPenseel] = useState<Penseel>('spuitzak');
  const [kleur, setKleur] = useState(KLEUREN[0].id);
  const [dikte, setDikte] = useState(DIKTES[1].waarde);
  const [melding, setMelding] = useState('');
  const [klaar, setKlaar] = useState(false);
  const doek = useRef<CakeCanvasHandle>(null);
  const terug = useRef<Array<string | null>>([]);
  const vooruit = useRef<Array<string | null>>([]);
  const [standen, setStanden] = useState({ terug: 0, vooruit: 0 });

  useEffect(() => { doek.current?.herstelTekening(ontwerp.tekening); }, [ontwerp.tekening]);

  const onthoud = useCallback(() => {
    terug.current = [...terug.current.slice(-(MAX_TERUG - 1)), doek.current?.tekening() ?? null];
    vooruit.current = [];
    setStanden({ terug: terug.current.length, vooruit: 0 });
  }, []);

  const stapTerug = () => {
    const vorige = terug.current.pop();
    if (vorige === undefined) return;
    vooruit.current.push(doek.current?.tekening() ?? null);
    doek.current?.herstelTekening(vorige);
    setStanden({ terug: terug.current.length, vooruit: vooruit.current.length });
  };
  const stapVooruit = () => {
    const volgende = vooruit.current.pop();
    if (volgende === undefined) return;
    terug.current.push(doek.current?.tekening() ?? null);
    doek.current?.herstelTekening(volgende);
    setStanden({ terug: terug.current.length, vooruit: vooruit.current.length });
  };

  const bodem = TAART_BODEMS_BY_ID[bodemId] ?? TAART_BODEMS[0];
  const actief = versieringen.find(item => item.id === gekozen) ?? null;
  const bibliotheek = useMemo(() => VERSIERINGEN.filter(item => item.soort === soort), [soort]);

  const leg = (versieringId: string) => {
    const nieuw: GeplaatsteVersiering = { id: nieuweVersieringId(), versieringId, x: .5, y: .45, schaal: 1, draai: 0 };
    setVersieringen(lijst => [...lijst, nieuw]);
    setGekozen(nieuw.id);
  };
  const pasAan = (verandering: Partial<GeplaatsteVersiering>) => {
    if (!actief) return;
    setVersieringen(lijst => lijst.map(item => item.id === actief.id ? { ...item, ...verandering } : item));
  };

  /** Alles samen als één plaatje: de taart, de tekening en de versieringen. */
  const maakAfbeelding = useCallback(async (): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = TEKENMAAT;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const laad = (bron: string) => new Promise<HTMLImageElement | null>(klaar => {
      const beeld = new Image();
      beeld.onload = () => klaar(beeld);
      beeld.onerror = () => klaar(null);
      beeld.src = bron;
    });
    const achtergrond = await laad(bodem.beeld);
    if (achtergrond) {
      const schaal = Math.min(TEKENMAAT / achtergrond.width, TEKENMAAT / achtergrond.height);
      const breedte = achtergrond.width * schaal, hoogte = achtergrond.height * schaal;
      context.drawImage(achtergrond, (TEKENMAAT - breedte) / 2, (TEKENMAAT - hoogte) / 2, breedte, hoogte);
    }
    const tekening = doek.current?.tekening();
    if (tekening) {
      const laag = await laad(tekening);
      if (laag) context.drawImage(laag, 0, 0, TEKENMAAT, TEKENMAAT);
    }
    for (const stuk of versieringen) {
      const bron = VERSIERINGEN.find(item => item.id === stuk.versieringId);
      if (!bron) continue;
      const beeld = await laad(bron.beeld);
      if (!beeld) continue;
      const breedte = BASIS_BREEDTE * stuk.schaal * TEKENMAAT;
      const hoogte = breedte / bron.verhouding;
      context.save();
      context.translate(stuk.x * TEKENMAAT, stuk.y * TEKENMAAT);
      context.rotate(stuk.draai * Math.PI / 180);
      context.drawImage(beeld, -breedte / 2, -hoogte / 2, breedte, hoogte);
      context.restore();
    }
    return canvas.toDataURL('image/webp', .8);
  }, [bodem.beeld, versieringen]);

  const bewaar = async (afsluiten: boolean) => {
    const voorbeeld = await maakAfbeelding();
    const volgende = { ...ontwerp, bodemId, versieringen, tekening: doek.current?.tekening() ?? null, voorbeeld };
    if (!bewaarOntwerp(volgende)) { setMelding('Opslaan lukt even niet. Je taart staat nog op het werkblad.'); return; }
    setOntwerp(volgende);
    setMelding('Je taart is bewaard.');
    if (afsluiten) setKlaar(true);
  };

  const exporteer = async () => {
    const plaatje = await maakAfbeelding();
    if (!plaatje) { setMelding('Het plaatje maken lukt even niet.'); return; }
    const link = document.createElement('a');
    link.href = plaatje;
    link.download = 'mijn-taart.webp';
    link.click();
  };

  const opnieuw = () => {
    onthoud();
    doek.current?.wis();
    setVersieringen([]);
    setGekozen(null);
    setMelding('');
  };

  if (klaar) return <section className="taart-klaar" aria-live="polite">
    <article className="taart-klaar__kaart">
      {ontwerp.voorbeeld && <img src={ontwerp.voorbeeld} alt="Jouw taart" />}
      <p className="taart-klaar__kop"><Sparkles size={19} aria-hidden="true" />Je taart staat klaar</p>
      <div className="taart-klaar__acties">
        <Button size="large" onClick={onClose}>Terug naar de bakkerij</Button>
        <Button variant="quiet" onClick={() => setKlaar(false)}>Nog iets veranderen</Button>
      </div>
    </article>
  </section>;

  return <main className="taart-atelier" aria-label="Taartenatelier">
    <header className="taart-atelier__balk">
      <IconButton label="Terug naar de bakkerij" icon={<ArrowLeft size={19} />} onClick={onClose} />
      <div className="taart-atelier__taarten" role="group" aria-label="Kies een taart">
        {TAART_BODEMS.map(item => <button key={item.id} type="button" className={`taart-keuze${item.id === bodemId ? ' is-actief' : ''}`}
          aria-pressed={item.id === bodemId} title={item.naam} onClick={() => setBodemId(item.id)}>
          <img src={item.beeld} alt={item.naam} />
        </button>)}
      </div>
      <div className="taart-atelier__opslaan">
        <IconButton label="Ongedaan maken" icon={<Undo2 size={19} />} disabled={!standen.terug} onClick={stapTerug} />
        <IconButton label="Opnieuw uitvoeren" icon={<Redo2 size={19} />} disabled={!standen.vooruit} onClick={stapVooruit} />
        <IconButton label="Taart als plaatje opslaan" icon={<Download size={19} />} onClick={() => void exporteer()} />
        <IconButton label="Bewaren" icon={<Save size={19} />} onClick={() => void bewaar(false)} />
        <Button onClick={() => void bewaar(true)}>Klaar</Button>
      </div>
    </header>

    <div className="taart-atelier__werk">
      <section className="taart-gereedschap" aria-label="Gereedschap">
        <div className="taart-gereedschap__rij" role="group" aria-label="Kies gereedschap">
          {PENSELEN.map(item => <button key={item.id} type="button" className={`taart-knop${penseel === item.id ? ' is-actief' : ''}`}
            aria-pressed={penseel === item.id} title={item.naam} onClick={() => setPenseel(item.id)}>{item.icoon}<small>{item.naam}</small></button>)}
        </div>
        <div className="taart-gereedschap__rij taart-kleuren" role="group" aria-label="Kies een kleur">
          {KLEUREN.map(item => <button key={item.id} type="button" className={`taart-kleur${kleur === item.id ? ' is-actief' : ''}`}
            style={{ background: item.id }} aria-pressed={kleur === item.id} aria-label={item.naam} title={item.naam} onClick={() => setKleur(item.id)} />)}
        </div>
        <label className="taart-dikte">
          <span>Dikte</span>
          <input type="range" min={4} max={48} step={1} value={dikte} aria-valuetext={`${dikte} pixels`} onChange={event => setDikte(Number(event.target.value))} />
          <span className="taart-dikte__stappen">{DIKTES.map(item => <button key={item.naam} type="button" className={dikte === item.waarde ? 'is-actief' : ''} onClick={() => setDikte(item.waarde)}>{item.naam}</button>)}</span>
        </label>
        <Button variant="quiet" startIcon={<RotateCcw size={18} />} onClick={opnieuw}>Opnieuw beginnen</Button>
      </section>

      <div className="taart-atelier__midden">
        <CakeCanvas
          ref={doek}
          bodemBeeld={bodem.beeld}
          bodemNaam={bodem.naam}
          versieringen={versieringen}
          gekozen={gekozen}
          penseel={penseel}
          kleur={kleur}
          dikte={dikte}
          onVoorStreek={onthoud}
          onVersieringen={setVersieringen}
          onKies={setGekozen}
        />
        {melding && <p className="taart-melding" role="status">{melding}</p>}
        {actief && <div className="taart-instellingen" aria-label="Geselecteerde versiering">
          <label><span>Maat</span>
            <input type="range" min={MIN_SCHAAL * 100} max={MAX_SCHAAL * 100} step={5} value={Math.round(actief.schaal * 100)}
              aria-valuetext={`${Math.round(actief.schaal * 100)} procent`} onChange={event => pasAan({ schaal: Number(event.target.value) / 100 })} />
          </label>
          <div className="taart-instellingen__knoppen">
            <IconButton label="Naar links draaien" icon={<RotateCcw size={18} />} onClick={() => pasAan({ draai: actief.draai - 15 })} />
            <IconButton label="Naar rechts draaien" icon={<RotateCw size={18} />} onClick={() => pasAan({ draai: actief.draai + 15 })} />
            <IconButton label="Naar voren halen" icon={<Layers size={18} />} onClick={() => setVersieringen(lijst => verplaatsInStapel(lijst, actief.id, 'voor'))} />
            <IconButton label="Naar achteren zetten" icon={<Layers size={18} className="is-omgekeerd" />} onClick={() => setVersieringen(lijst => verplaatsInStapel(lijst, actief.id, 'achter'))} />
            <IconButton label="Nog een keer" icon={<Copy size={18} />} onClick={() => {
              const kopie = { ...actief, id: nieuweVersieringId(), x: Math.min(1, actief.x + .06), y: Math.min(1, actief.y + .06) };
              setVersieringen(lijst => [...lijst, kopie]);
              setGekozen(kopie.id);
            }} />
            <IconButton label="Weghalen" icon={<Trash2 size={18} />} onClick={() => {
              setVersieringen(lijst => lijst.filter(item => item.id !== actief.id));
              setGekozen(null);
            }} />
          </div>
        </div>}
      </div>

      <section className="taart-bibliotheek" aria-label="Versieringen">
        <nav className="taart-bibliotheek__soorten" aria-label="Soort versiering">
          {SOORTEN.map(item => <button key={item.id} type="button" className={soort === item.id ? 'is-actief' : ''}
            aria-pressed={soort === item.id} onClick={() => setSoort(item.id)}>{item.naam}</button>)}
        </nav>
        <ul className="taart-bibliotheek__lijst">
          {bibliotheek.map(item => <li key={item.id}>
            <button type="button" onClick={() => leg(item.id)} title={item.naam}>
              <img src={item.beeld} alt={item.naam} loading="lazy" />
            </button>
          </li>)}
        </ul>
      </section>
    </div>
  </main>;
}
