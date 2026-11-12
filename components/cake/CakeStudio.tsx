import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BookHeart, Brush, Copy, Download, Droplets, Eraser, Layers, Minus, PaintBucket, Plus, Redo2, RotateCcw, RotateCw, Save, Sparkles, Trash2, Undo2,
} from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import { TAART_BODEMS, TAART_BODEMS_BY_ID, VERSIERINGEN } from '../../data/cake/catalog';
import {
  BASIS_BREEDTE, TEKENMAAT, default as CakeCanvas, type CakeCanvasHandle,
} from './CakeCanvas';
import {
  MAX_SCHAAL, MIN_SCHAAL, bewaarInGalerij, bewaarOntwerp, laadOntwerp, nieuweVersieringId, verplaatsInStapel,
} from '../../services/cakeStudio';
import type { GeplaatsteVersiering, Penseel, VersieringSoort } from '../../data/cake/types';
import './cake-studio.css';
import SpeechBubble from '../ui/SpeechBubble';
import { cakeMeetsOrder, deliverCakeOrder, loadCakeOrder, saveCakeOrder } from '../../services/cakeOrder';

/**
 * Het taartenatelier: kies een taart, teken erop en leg er versieringen op.
 *
 * Er is hier geen goed of fout. Alles wat een kind maakt blijft bewaard in
 * één ontwerp, dat later weer opengaat zoals het was.
 *
 * Alle keuzes staan in één paneel onder het werkblad, met één tabblad tegelijk
 * open. Zo houdt de taart zoveel mogelijk ruimte, en kan er maar één ding
 * tegelijk aanstaan: op een versieringstabblad tekent het werkblad niet mee.
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
/** De tabbladen van het paneel, in de volgorde waarin je ze tegenkomt. */
type Tabblad = 'taart' | 'tekenen' | VersieringSoort;
const TABBLADEN: Array<{ id: Tabblad; naam: string }> = [
  { id: 'taart', naam: 'Taart' }, { id: 'tekenen', naam: 'Tekenen' }, ...SOORTEN,
];
const MAX_TERUG = 12;
/** De taart in de encyclopedie hoeft niet groot te zijn; dat scheelt opslag. */
const GALERIJ_MAAT = 420;

export default function CakeStudio({ onClose }: { onClose: () => void }) {
  const isOrder = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('order') === 'seb-birthday';
  const [order, setOrder] = useState(loadCakeOrder);
  const [busy, setBusy] = useState(false);
  const [timed, setTimed] = useState(false);
  const orderRef = useRef(order);
  orderRef.current = order;
  const designKey = isOrder ? 'cocokiki:taart:seb-birthday:v1' : undefined;
  const [ontwerp, setOntwerp] = useState(() => laadOntwerp(designKey));
  const [versieringen, setVersieringen] = useState<GeplaatsteVersiering[]>(() => ontwerp.versieringen);
  const [bodemId, setBodemId] = useState(ontwerp.bodemId);
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [tab, setTab] = useState<Tabblad>('slagroom');
  const [penseel, setPenseel] = useState<Penseel>('spuitzak');
  const [kleur, setKleur] = useState(KLEUREN[0].id);
  const [dikte, setDikte] = useState(DIKTES[1].waarde);
  const [melding, setMelding] = useState('');
  const [klaar, setKlaar] = useState(false);
  const [inEncyclopedie, setInEncyclopedie] = useState(false);
  const doek = useRef<CakeCanvasHandle>(null);
  const terug = useRef<Array<string | null>>([]);
  const vooruit = useRef<Array<string | null>>([]);
  const [standen, setStanden] = useState({ terug: 0, vooruit: 0 });
  const designRef = useRef({ ontwerp, bodemId, versieringen });
  designRef.current = { ontwerp, bodemId, versieringen };
  useEffect(() => {
    if (!isOrder || !order.started || order.delivered || klaar) return;
    const timer = window.setInterval(() => {
      if (!doek.current || document.visibilityState !== 'visible') return;
      const current = designRef.current;
      if (!bewaarOntwerp({ ...current.ontwerp, bodemId: current.bodemId, versieringen: current.versieringen, tekening: doek.current.tekening() }, undefined, designKey)) {
        setMelding('Automatisch bewaren lukt even niet. Houd dit scherm open en probeer Bewaren.');
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isOrder, order.started, order.delivered, klaar, designKey]);


  useEffect(() => {
    if (!isOrder || !order.started || order.delivered || klaar || busy) return;
    // Alleen zichtbare speeltijd telt. Kleine stukjes blijven bij verversen bewaard.
    let previous = performance.now();
    const tick = () => {
      const now = performance.now();
      const elapsed = document.visibilityState === 'visible' ? Math.min(2, (now - previous) / 1000) : 0;
      previous = now;
      if (!elapsed) return;
      const next = { ...orderRef.current, elapsed: orderRef.current.elapsed + elapsed };
      if (saveCakeOrder(next)) { orderRef.current = next; setOrder(next); }
    };
    const timer = window.setInterval(tick, 1000);
    const visibility = () => { previous = performance.now(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [isOrder, order.started, order.delivered, klaar, busy]);

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
  const soort = tab === 'taart' || tab === 'tekenen' ? null : tab;
  const bibliotheek = useMemo(() => soort ? VERSIERINGEN.filter(item => item.soort === soort) : [], [soort]);

  const leg = (versieringId: string) => {
    const nieuw: GeplaatsteVersiering = { id: nieuweVersieringId(), versieringId, x: .5, y: .45, schaal: 1, draai: 0 };
    setVersieringen(lijst => [...lijst, nieuw]);
    setGekozen(nieuw.id);
  };
  const pasAan = (verandering: Partial<GeplaatsteVersiering>) => {
    if (!actief) return;
    setVersieringen(lijst => lijst.map(item => item.id === actief.id ? { ...item, ...verandering } : item));
  };
  const verwijder = (id: string) => {
    setVersieringen(lijst => lijst.filter(item => item.id !== id));
    setGekozen(huidig => huidig === id ? null : huidig);
  };
  const kopieer = () => {
    if (!actief) return;
    const kopie = { ...actief, id: nieuweVersieringId(), x: Math.min(1, actief.x + .06), y: Math.min(1, actief.y + .06) };
    setVersieringen(lijst => [...lijst, kopie]);
    setGekozen(kopie.id);
  };

  /** Alles samen als één plaatje: de taart, de tekening en de versieringen. */
  const maakAfbeelding = useCallback(async (maat = TEKENMAAT): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = maat;
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
      const schaal = Math.min(maat / achtergrond.width, maat / achtergrond.height);
      const breedte = achtergrond.width * schaal, hoogte = achtergrond.height * schaal;
      context.drawImage(achtergrond, (maat - breedte) / 2, (maat - hoogte) / 2, breedte, hoogte);
    }
    const tekening = doek.current?.tekening();
    if (tekening) {
      const laag = await laad(tekening);
      if (laag) context.drawImage(laag, 0, 0, maat, maat);
    }
    for (const stuk of versieringen) {
      const bron = VERSIERINGEN.find(item => item.id === stuk.versieringId);
      if (!bron) continue;
      const beeld = await laad(bron.beeld);
      if (!beeld) continue;
      const breedte = BASIS_BREEDTE * stuk.schaal * maat;
      const hoogte = breedte / bron.verhouding;
      context.save();
      context.translate(stuk.x * maat, stuk.y * maat);
      context.rotate(stuk.draai * Math.PI / 180);
      context.drawImage(beeld, -breedte / 2, -hoogte / 2, breedte, hoogte);
      context.restore();
    }
    return canvas.toDataURL('image/webp', .8);
  }, [bodem.beeld, versieringen]);

  const bewaar = async (afsluiten: boolean) => {
    const voorbeeld = await maakAfbeelding();
    const volgende = { ...ontwerp, bodemId, versieringen, tekening: doek.current?.tekening() ?? null, voorbeeld };
    if (!bewaarOntwerp(volgende, undefined, designKey)) { setMelding('Opslaan lukt even niet. Je taart staat nog op het werkblad.'); return; }
    setOntwerp(volgende);
    setMelding('Je taart is bewaard.');
    if (afsluiten) { setInEncyclopedie(false); setKlaar(true); }
  };

  /** Een kopie van de taart die in de encyclopedie blijft staan. */
  const naarEncyclopedie = async () => {
    const plaatje = klaar ? ontwerp.voorbeeld : await maakAfbeelding(GALERIJ_MAAT);
    if (!plaatje || !bewaarInGalerij(plaatje, bodem.naam)) { setMelding('Bewaren in de encyclopedie lukt even niet.'); return; }
    setInEncyclopedie(true);
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

  const finish = async () => {
    if (isOrder && !cakeMeetsOrder(bodemId, versieringen)) {
      setMelding('Seb vroeg om een roze taart met aardbeien. Kies een roze taart en leg er een aardbei op.');
      return;
    }
    setBusy(true);
    try { await bewaar(true); } finally { setBusy(false); }
  };

  if (isOrder && order.delivered) return <section className="taart-klaar"><article className="taart-klaar__kaart">
    {ontwerp.voorbeeld && <img src={ontwerp.voorbeeld} alt="Jouw verjaardagstaart" />}
    <SpeechBubble character="seb" label="afgeleverd">Dank je! Een roze taart met aardbeien, precies wat mijn zusje leuk vindt. Dit wordt een feest!</SpeechBubble>
    <p>{order.reward} muntjes verdiend. Deze bestelling is afgeleverd.</p>
    <Button onClick={onClose}>Naar de toonbank</Button>
  </article></section>;

  if (isOrder && !order.started) return <section className="taart-klaar"><article className="taart-klaar__kaart">
    <IconButton label="Terug naar de toonbank" icon={<ArrowLeft size={19} />} onClick={onClose} />
    <SpeechBubble character="seb" label="een verjaardagstaart">Mijn zusje is jarig! Ze houdt van roze en aardbeien. Versier jij een roze taart met minstens één aardbei?</SpeechBubble>
    <p>Verdien 5 muntjes bij het afleveren.</p>
    <Button variant="secondary" aria-pressed={timed} onClick={() => setTimed(value => !value)}>{timed ? 'Met tijdsbonus: aan' : 'Met tijdsbonus: uit'}</Button>
    <p>Met tijdsbonus: 2 extra muntjes binnen 5 minuten. Daarna mag je rustig verder.</p>
    <Button onClick={() => {
      const next = { started: true, timed, elapsed: 0, delivered: false, reward: 0 };
      if (saveCakeOrder(next)) setOrder(next);
      else setMelding('Bewaren lukt even niet. Probeer opnieuw.');
    }}>Begin de taart</Button>
    {melding && <p role="alert">{melding}</p>}
  </article></section>;

  if (klaar) return <section className="taart-klaar" aria-live="polite">
    <article className="taart-klaar__kaart">
      {ontwerp.voorbeeld && <img src={ontwerp.voorbeeld} alt="Jouw taart" />}
      <p className="taart-klaar__kop"><Sparkles size={19} aria-hidden="true" />Je taart staat klaar</p>
      <div className="taart-klaar__acties">
        {isOrder && <>
          <SpeechBubble character="coco" label="naar de toonbank">De roze taart met aardbeien staat klaar voor Seb.</SpeechBubble>
          <Button onClick={() => { const result = deliverCakeOrder(bodemId, versieringen); if (result) setOrder(result); else setMelding('Afleveren lukt even niet. Je taart blijft bewaard. Probeer opnieuw.'); }}>Lever af aan Seb</Button>
        </>}

        <Button variant={isOrder ? 'secondary' : 'primary'} size="large" startIcon={<BookHeart size={18} />} disabled={inEncyclopedie} onClick={() => void naarEncyclopedie()}>
          {inEncyclopedie ? 'Staat in de encyclopedie' : 'Bewaar in de encyclopedie'}
        </Button>
        <Button variant="quiet" onClick={onClose}>Terug naar de bakkerij</Button>
        <Button variant="quiet" onClick={() => setKlaar(false)}>Nog iets veranderen</Button>
      </div>
      {melding && <p className="taart-melding" role="status">{melding}</p>}
    </article>
  </section>;

  return <main className="taart-atelier" aria-label="Taartenatelier">
    <header className="taart-atelier__balk">
      <IconButton label="Terug naar de bakkerij" icon={<ArrowLeft size={19} />} onClick={onClose} />
      <div className="taart-atelier__opslaan">
        <IconButton label="Ongedaan maken" icon={<Undo2 size={19} />} disabled={!standen.terug} onClick={stapTerug} />
        <IconButton label="Opnieuw uitvoeren" icon={<Redo2 size={19} />} disabled={!standen.vooruit} onClick={stapVooruit} />
        <IconButton label="Opnieuw beginnen" icon={<RotateCcw size={19} />} onClick={opnieuw} />
        <IconButton label="Taart als plaatje opslaan" icon={<Download size={19} />} onClick={() => void exporteer()} />
        <IconButton label="Bewaren" icon={<Save size={19} />} onClick={() => void bewaar(false)} />
        <Button disabled={busy} onClick={() => void finish()}>{isOrder ? 'Naar de toonbank' : 'Klaar'}</Button>
      </div>
    </header>

    {isOrder && <div className="taart-opdracht" role="status">
      <strong>Voor Seb: een roze taart met aardbeien</strong>
      <span>{cakeMeetsOrder(bodemId, versieringen) ? 'Alles voor de bestelling staat erop' : 'Kies een roze taart en voeg een aardbei toe'}</span>
      {order.timed && <span>{order.elapsed < 300 ? `Tijdsbonus: ${Math.floor((300 - order.elapsed) / 60)}:${String(Math.floor((300 - order.elapsed) % 60)).padStart(2, '0')}` : 'De bonustijd is voorbij. Maak je taart rustig af.'}</span>}
    </div>}
    <div className="taart-atelier__werk">
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
          kanTekenen={tab === 'tekenen'}
          onVoorStreek={onthoud}
          onVersieringen={setVersieringen}
          onKies={setGekozen}
          onVerwijder={verwijder}
        />
      </div>

      {actief && <div className="taart-instellingen" aria-label="Geselecteerde versiering">
        <div className="taart-instellingen__maat">
          <IconButton label="Kleiner maken" icon={<Minus size={18} />} disabled={actief.schaal <= MIN_SCHAAL}
            onClick={() => pasAan({ schaal: Math.max(MIN_SCHAAL, Number((actief.schaal - .15).toFixed(2))) })} />
          <label><span>Maat</span>
            <input type="range" min={MIN_SCHAAL * 100} max={MAX_SCHAAL * 100} step={5} value={Math.round(actief.schaal * 100)}
              aria-valuetext={`${Math.round(actief.schaal * 100)} procent`} onChange={event => pasAan({ schaal: Number(event.target.value) / 100 })} />
          </label>
          <IconButton label="Groter maken" icon={<Plus size={18} />} disabled={actief.schaal >= MAX_SCHAAL}
            onClick={() => pasAan({ schaal: Math.min(MAX_SCHAAL, Number((actief.schaal + .15).toFixed(2))) })} />
        </div>
        <div className="taart-instellingen__knoppen">
          <IconButton label="Naar links draaien" icon={<RotateCcw size={18} />} onClick={() => pasAan({ draai: actief.draai - 15 })} />
          <IconButton label="Naar rechts draaien" icon={<RotateCw size={18} />} onClick={() => pasAan({ draai: actief.draai + 15 })} />
          <IconButton label="Naar voren halen" icon={<Layers size={18} />} onClick={() => setVersieringen(lijst => verplaatsInStapel(lijst, actief.id, 'voor'))} />
          <IconButton label="Naar achteren zetten" icon={<Layers size={18} className="is-omgekeerd" />} onClick={() => setVersieringen(lijst => verplaatsInStapel(lijst, actief.id, 'achter'))} />
          <IconButton label="Nog een keer" icon={<Copy size={18} />} onClick={kopieer} />
          <IconButton label="Weghalen" icon={<Trash2 size={18} />} onClick={() => verwijder(actief.id)} />
        </div>
      </div>}
      {melding && <p className="taart-melding" role="status">{melding}</p>}

      <section className="taart-paneel" aria-label="Kiezen en versieren">
        <nav className="taart-paneel__tabs" aria-label="Wat wil je doen">
          {TABBLADEN.map(item => <button key={item.id} type="button" className={tab === item.id ? 'is-actief' : ''}
            aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.naam}</button>)}
        </nav>

        {tab === 'taart' && <ul className="taart-paneel__lijst" aria-label="Kies een taart">
          {TAART_BODEMS.map(item => <li key={item.id}>
            <button type="button" className={item.id === bodemId ? 'is-actief' : ''} aria-pressed={item.id === bodemId}
              title={item.naam} onClick={() => setBodemId(item.id)}>
              <img src={item.beeld} alt={item.naam} loading="lazy" />
            </button>
          </li>)}
        </ul>}

        {tab === 'tekenen' && <div className="taart-tekenen">
          <div className="taart-tekenen__rij" role="group" aria-label="Kies gereedschap">
            {PENSELEN.map(item => <button key={item.id} type="button" className={`taart-knop${penseel === item.id ? ' is-actief' : ''}`}
              aria-pressed={penseel === item.id} title={item.naam} onClick={() => setPenseel(item.id)}>{item.icoon}<small>{item.naam}</small></button>)}
          </div>
          <div className="taart-tekenen__rij taart-kleuren" role="group" aria-label="Kies een kleur">
            {KLEUREN.map(item => <button key={item.id} type="button" className={`taart-kleur${kleur === item.id ? ' is-actief' : ''}`}
              style={{ background: item.id }} aria-pressed={kleur === item.id} aria-label={item.naam} title={item.naam} onClick={() => setKleur(item.id)} />)}
          </div>
          <div className="taart-tekenen__rij taart-dikte" role="group" aria-label="Kies de dikte">
            {DIKTES.map(item => <button key={item.naam} type="button" className={`taart-knop${dikte === item.waarde ? ' is-actief' : ''}`}
              aria-pressed={dikte === item.waarde} onClick={() => setDikte(item.waarde)}>{item.naam}</button>)}
          </div>
        </div>}

        {soort && <ul className="taart-paneel__lijst" aria-label={`Versieringen: ${soort}`}>
          {bibliotheek.map(item => <li key={item.id}>
            <button type="button" onClick={() => leg(item.id)} title={item.naam}>
              <img src={item.beeld} alt={item.naam} loading="lazy" />
            </button>
          </li>)}
        </ul>}
      </section>
    </div>
  </main>;
}
