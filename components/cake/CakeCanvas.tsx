import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { VERSIERINGEN_BY_ID } from '../../data/cake/catalog';
import { MAX_SCHAAL, MIN_SCHAAL } from '../../services/cakeStudio';
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
  /** Wordt aangeroepen vlak voordat er op de tekenlaag gekrast wordt. */
  onVoorStreek: () => void;
  onVersieringen: (volgende: GeplaatsteVersiering[]) => void;
  onKies: (id: string | null) => void;
}

const graden = (radialen: number) => radialen * 180 / Math.PI;

export default forwardRef<CakeCanvasHandle, Props>(function CakeCanvas({
  bodemBeeld, bodemNaam, versieringen, gekozen, penseel, kleur, dikte, onVoorStreek, onVersieringen, onKies,
}, ref) {
  const vlak = useRef<HTMLDivElement>(null);
  const doek = useRef<HTMLCanvasElement>(null);
  const bezig = useRef<{ x: number; y: number } | null>(null);
  const sleep = useRef<{ id: string; soort: 'verplaats' | 'schaal' | 'draai'; dx: number; dy: number } | null>(null);
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
    context.lineWidth = penseel === 'spuitzak' ? dikte * 2 : dikte;
    context.beginPath();
    context.moveTo(van.x, van.y);
    context.lineTo(naar.x, naar.y);
    context.stroke();
    if (penseel === 'spuitzak') {
      // Een toef heeft een lichte streep in het midden; dat leest als slagroom.
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = '#ffffff88';
      context.lineWidth = Math.max(1, dikte * .6);
      context.stroke();
      context.strokeStyle = kleur;
    }
  };

  const startTekenen = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
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
  const startSleep = (event: React.PointerEvent, id: string, soort: 'verplaats' | 'schaal' | 'draai') => {
    event.stopPropagation();
    const maat = plat();
    const stuk = versieringen.find(item => item.id === id);
    if (!maat || !stuk) return;
    onKies(id);
    sleep.current = { id, soort, dx: stuk.x - (event.clientX - maat.left) / maat.width, dy: stuk.y - (event.clientY - maat.top) / maat.height };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  useEffect(() => {
    if (!sleep.current) return;
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
        const afstand = Math.hypot(x - stuk.x, y - stuk.y);
        if (bezigheid.soort === 'schaal') {
          return { ...stuk, schaal: Math.min(MAX_SCHAAL, Math.max(MIN_SCHAAL, afstand / (BASIS_BREEDTE * .75))) };
        }
        return { ...stuk, draai: Math.round(graden(Math.atan2(y - stuk.y, x - stuk.x)) + 90) };
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
          <button type="button" className="taart-greep taart-greep--draai" aria-label={`${bron.naam} draaien`}
            onPointerDown={event => startSleep(event, stuk.id, 'draai')} />
          <button type="button" className="taart-greep taart-greep--schaal" aria-label={`${bron.naam} groter of kleiner maken`}
            onPointerDown={event => startSleep(event, stuk.id, 'schaal')} />
        </>}
      </div>;
    })}
  </div>;
});
