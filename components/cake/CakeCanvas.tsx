import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { RotateCw, X } from 'lucide-react';
import { VERSIERINGEN_BY_ID } from '../../data/cake/catalog';
import type { GeplaatsteVersiering, Penseel } from '../../data/cake/types';

/**
 * Het werkblad: de taart, de tekenlaag erop en de versieringen erbovenop.
 *
 * De tekenlaag is één canvas van vaste grootte; de versieringen zijn losse
 * voorwerpen met een eigen plek, maat en draaiing. Alles wordt bewaard in
 * verhoudingen van 0 tot 1, zodat het klopt op elk scherm.
 */
export const TEKENMAAT = 900;
/** Een versiering op schaal 1 is dit deel van de taartbreedte. */
export const BASIS_BREEDTE = .18;

export interface CakeCanvasHandle {
  /** De tekenlaag als afbeelding, of null als er niets getekend is. */
  tekening(): string | null;
  herstelTekening(bron: string | null): void;
  wis(): void;
}

interface Props {
  bodemBeeld: string;
  bodemNaam: string;
  versieringen: GeplaatsteVersiering[];
  gekozen: string | null;
  penseel: Penseel;
  kleur: string;
  dikte: number;
  /** Alleen waar op het tabblad Tekenen. Anders laat het werkblad geen
      streken toe, zodat versieren niet per ongeluk stippen achterlaat. */
  kanTekenen: boolean;
  /** Wordt aangeroepen vlak voordat er op de tekenlaag gekrast wordt. */
  onVoorStreek: () => void;
  onVersieringen: (volgende: GeplaatsteVersiering[]) => void;
  onKies: (id: string | null) => void;
  onVerwijder: (id: string) => void;
}

const graden = (radialen: number) => radialen * 180 / Math.PI;

export default forwardRef<CakeCanvasHandle, Props>(function CakeCanvas({
  bodemBeeld, bodemNaam, versieringen, gekozen, penseel, kleur, dikte, kanTekenen, onVoorStreek, onVersieringen, onKies, onVerwijder,
}, ref) {
  const vlak = useRef<HTMLDivElement>(null);
  const doek = useRef<HTMLCanvasElement>(null);
  const bezig = useRef<{ x: number; y: number } | null>(null);
  const sleep = useRef<{ id: string; soort: 'verplaats' | 'draai'; dx: number; dy: number } | null>(null);
  const [tekenen, setTekenen] = useState(false);

  const plat = useCallback(() => {
    const maat = vlak.current?.getBoundingClientRect();
    return maat && maat.width > 0 ? maat : null;
  }, []);

  useImperativeHandle(ref, () => ({
    tekening() {
      const canvas = doek.current;
      if (!canvas) return null;
      const context = canvas.getContext('2d');
      if (!context) return null;
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return canvas.toDataURL('image/webp', .82);
      return null;
    },
    herstelTekening(bron) {
      const canvas = doek.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (!bron) return;
      const beeld = new Image();
      beeld.onload = () => context.drawImage(beeld, 0, 0, canvas.width, canvas.height);
      beeld.src = bron;
    },
    wis() {
      const canvas = doek.current;
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    },
  }), []);

  // Tekenen op de laag zelf
  const puntOpDoek = (event: React.PointerEvent) => {
    const maat = plat();
    if (!maat) return null;
    return { x: (event.clientX - maat.left) / maat.width * TEKENMAAT, y: (event.clientY - maat.top) / maat.height * TEKENMAAT };
  };

  /** Een toef met een getande rand: dat leest als een spuitzak met sterretje. */
  const toef = (context: CanvasRenderingContext2D, x: number, y: number, straal: number) => {
    const tanden = 9;
    context.beginPath();
    for (let i = 0; i <= tanden * 2; i += 1) {
      const hoek = i / (tanden * 2) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? straal : straal * .6;
      const px = x + Math.cos(hoek) * r;
      const py = y + Math.sin(hoek) * r;
      if (i === 0) context.moveTo(px, py); else context.lineTo(px, py);
    }
    context.closePath();
    context.fill();
  };

  const streek = (van: { x: number; y: number }, naar: { x: number; y: number }) => {
    const context = doek.current?.getContext('2d');
    if (!context) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = penseel === 'gum' ? 'destination-out' : 'source-over';
    context.strokeStyle = kleur;
    context.fillStyle = kleur;
    if (penseel === 'stippen') {
      context.beginPath();
      context.arc(naar.x, naar.y, dikte * .9, 0, Math.PI * 2);
      context.fill();
      return;
    }
    if (penseel === 'spuitzak') {
      // Toefjes achter elkaar langs de streek; de rand blijft daardoor geschulpt.
      const straal = Math.max(5, dikte);
      const stap = Math.max(2, straal * .5);
      const lengte = Math.hypot(naar.x - van.x, naar.y - van.y);
      const stappen = Math.max(1, Math.ceil(lengte / stap));
      for (let i = 1; i <= stappen; i += 1) {
        const deel = i / stappen;
        const x = van.x + (naar.x - van.x) * deel;
        const y = van.y + (naar.y - van.y) * deel;
        toef(context, x, y, straal);
        context.fillStyle = '#ffffff55';
        context.beginPath();
        context.arc(x - straal * .18, y - straal * .18, straal * .22, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = kleur;
      }
      return;
    }
    context.lineWidth = dikte;
    context.beginPath();
    context.moveTo(van.x, van.y);
    context.lineTo(naar.x, naar.y);
    context.stroke();
  };

  const startTekenen = (event: React.PointerEvent) => {
    if (event.button !== 0 || sleep.current) return;
    // Op een versieringstabblad tekent het werkblad niet mee; een klik naast
    // een versiering laat die dan alleen los.
    if (!kanTekenen) { onKies(null); return; }
    const punt = puntOpDoek(event);
    if (!punt) return;
    onKies(null);
    onVoorStreek();
    bezig.current = punt;
    setTekenen(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    streek(punt, punt);
  };

  const beweegTekenen = (event: React.PointerEvent) => {
    if (!bezig.current) return;
    const punt = puntOpDoek(event);
    if (!punt) return;
    streek(bezig.current, punt);
    bezig.current = punt;
  };

  const stopTekenen = () => { bezig.current = null; setTekenen(false); };

  // Versieringen verplaatsen, schalen en draaien
  const startSleep = (event: React.PointerEvent, id: string, soort: 'verplaats' | 'draai') => {
    event.stopPropagation();
    const maat = plat();
    const stuk = versieringen.find(item => item.id === id);
    if (!maat || !stuk) return;
    onKies(id);
    sleep.current = { id, soort, dx: stuk.x - (event.clientX - maat.left) / maat.width, dy: stuk.y - (event.clientY - maat.top) / maat.height };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  // Deze listeners hangen bewust altijd klaar: hingen ze pas na het kiezen van
  // een versiering, dan beweegt een stuk dat al gekozen was helemaal niet.
  useEffect(() => {
    const beweeg = (event: PointerEvent) => {
      const bezigheid = sleep.current;
      const maat = plat();
      if (!bezigheid || !maat) return;
      const x = (event.clientX - maat.left) / maat.width;
      const y = (event.clientY - maat.top) / maat.height;
      onVersieringen(versieringen.map(stuk => {
        if (stuk.id !== bezigheid.id) return stuk;
        if (bezigheid.soort === 'verplaats') {
          return { ...stuk, x: Math.min(1, Math.max(0, x + bezigheid.dx)), y: Math.min(1, Math.max(0, y + bezigheid.dy)) };
        }
        const dx = (x - stuk.x) * maat.width;
        const dy = (y - stuk.y) * maat.height;
        return { ...stuk, draai: Math.round(graden(Math.atan2(dy, dx)) + 90) };
      }));
    };
    const los = () => { sleep.current = null; };
    window.addEventListener('pointermove', beweeg);
    window.addEventListener('pointerup', los);
    window.addEventListener('pointercancel', los);
    return () => {
      window.removeEventListener('pointermove', beweeg);
      window.removeEventListener('pointerup', los);
      window.removeEventListener('pointercancel', los);
    };
  });

  return <div
    ref={vlak}
    className={`taart-vlak${tekenen ? ' is-tekenen' : ''}`}
    onPointerDown={startTekenen}
    onPointerMove={beweegTekenen}
    onPointerUp={stopTekenen}
    onPointerCancel={stopTekenen}
  >
    <img className="taart-vlak__bodem" src={bodemBeeld} alt={bodemNaam} draggable={false} />
    <canvas className="taart-vlak__tekening" ref={doek} width={TEKENMAAT} height={TEKENMAAT} />
    {versieringen.map(stuk => {
      const bron = VERSIERINGEN_BY_ID[stuk.versieringId];
      if (!bron) return null;
      const breedte = BASIS_BREEDTE * stuk.schaal * 100;
      return <div
        key={stuk.id}
        className={`taart-stuk${gekozen === stuk.id ? ' is-gekozen' : ''}`}
        style={{ left: `${stuk.x * 100}%`, top: `${stuk.y * 100}%`, width: `${breedte}%`, aspectRatio: bron.verhouding, transform: `translate(-50%, -50%) rotate(${stuk.draai}deg)` }}
        onPointerDown={event => startSleep(event, stuk.id, 'verplaats')}
      >
        <img src={bron.beeld} alt={bron.naam} draggable={false} />
        {gekozen === stuk.id && <>
          {/* Twee kleine grepen, net als bij de meubels: draaien en weghalen.
              Groter en kleiner gaat met de knoppen onder het werkblad. */}
          <button type="button" className="taart-greep taart-greep--draai" title="Draaien" aria-label={`${bron.naam} draaien`}
            onPointerDown={event => startSleep(event, stuk.id, 'draai')}><RotateCw size={13} aria-hidden="true" /></button>
          <button type="button" className="taart-greep taart-greep--weg" title="Weghalen" aria-label={`${bron.naam} weghalen`}
            onPointerDown={event => event.stopPropagation()}
            onClick={event => { event.stopPropagation(); onVerwijder(stuk.id); }}><X size={13} aria-hidden="true" /></button>
        </>}
      </div>;
    })}
  </div>;
});
