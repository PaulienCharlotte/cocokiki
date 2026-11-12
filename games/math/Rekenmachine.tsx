import React, { useRef, useState } from 'react';
import { Button, Dialog } from '../../design-system';

/**
 * De rekenmachine van Baby Lua.
 *
 * De tekening is de rekenmachine; de toetsen zijn doorzichtige vlakken die er
 * precies overheen liggen, opgemeten op de tekening zelf. Zo blijft het
 * Charlotte's plaatje en is het toch een echt apparaat.
 *
 * Hij is er voor de redactiesommen, waar het om de aanpak gaat en niet om
 * het hoofdrekenen. Bij de tafels zou hij het spel juist wegnemen.
 */
const BEELD = '/assets/library/math/rekenmachine.webp';
/** Het venster en elke toets, in procenten van de tekening. */
const VENSTER = { links: 19, top: 19.5, breed: 61, hoog: 17.5 };
type Toets = { teken: string; naam: string; links: number; top: number; breed: number; hoog: number };
const TOETSEN: Toets[] = [
  { teken: '7', naam: 'zeven', links: 13.84, top: 41.39, breed: 16.93, hoog: 9.68 },
  { teken: '8', naam: 'acht', links: 31.94, top: 41.39, breed: 16.68, hoog: 9.68 },
  { teken: '9', naam: 'negen', links: 49.79, top: 41.39, breed: 16.85, hoog: 9.68 },
  { teken: '÷', naam: 'delen door', links: 67.89, top: 41.77, breed: 17.51, hoog: 8.54 },
  { teken: '4', naam: 'vier', links: 13.51, top: 52.74, breed: 17.10, hoog: 9.83 },
  { teken: '5', naam: 'vijf', links: 31.78, top: 52.74, breed: 16.68, hoog: 9.83 },
  { teken: '6', naam: 'zes', links: 49.79, top: 52.74, breed: 17.01, hoog: 9.83 },
  { teken: '×', naam: 'keer', links: 67.97, top: 52.82, breed: 17.68, hoog: 8.38 },
  { teken: '1', naam: 'een', links: 13.18, top: 64.33, breed: 17.18, hoog: 9.76 },
  { teken: '2', naam: 'twee', links: 31.53, top: 64.33, breed: 17.26, hoog: 9.76 },
  { teken: '3', naam: 'drie', links: 49.96, top: 64.33, breed: 16.85, hoog: 9.76 },
  { teken: '−', naam: 'min', links: 68.06, top: 63.57, breed: 17.68, hoog: 8.00 },
  { teken: 'C', naam: 'wissen', links: 11.84, top: 76.60, breed: 18.43, hoog: 14.18 },
  { teken: '0', naam: 'nul', links: 31.69, top: 76.07, breed: 34.20, hoog: 11.51 },
  { teken: '+', naam: 'plus', links: 67.56, top: 73.78, breed: 18.85, hoog: 6.94 },
  { teken: '=', naam: 'is', links: 66.47, top: 82.01, breed: 19.43, hoog: 9.45 },
];
const BEWERKINGEN = '÷×−+';

/** Netjes op het schermpje: komma in plaats van punt, en niet eindeloos lang. */
export function toonGetal(waarde: number): string {
  if (!Number.isFinite(waarde)) return 'oeps';
  const afgerond = Math.round(waarde * 10000) / 10000;
  return String(afgerond).replace('.', ',').slice(0, 12);
}

export function rekenUit(links: number, bewerking: string, rechts: number): number {
  if (bewerking === '+') return links + rechts;
  if (bewerking === '−') return links - rechts;
  if (bewerking === '×') return links * rechts;
  return rechts === 0 ? NaN : links / rechts;
}

export default function Rekenmachine({ onClose, som = '' }: { onClose: () => void; som?: string }) {
  const [invoer, setInvoer] = useState('0');
  const [vorige, setVorige] = useState<number | null>(null);
  const [bewerking, setBewerking] = useState<string | null>(null);
  // Na een bewerking of een uitkomst begint het volgende cijfer een nieuw getal.
  const opnieuw = useRef(true);

  const druk = (teken: string) => {
    if (teken === 'C') { setInvoer('0'); setVorige(null); setBewerking(null); opnieuw.current = true; return; }
    if (/\d/.test(teken)) {
      // De vlag nu uitlezen: React draait de functie hieronder pas later,
      // en dan staat hij allang weer op false.
      const begint = opnieuw.current;
      setInvoer(huidig => (begint || huidig === '0' ? teken : (huidig + teken).slice(0, 10)));
      opnieuw.current = false;
      return;
    }
    const nu = Number(invoer.replace(',', '.'));
    const uitkomst = vorige !== null && bewerking ? rekenUit(vorige, bewerking, nu) : nu;
    setInvoer(toonGetal(uitkomst));
    opnieuw.current = true;
    if (teken === '=') { setVorige(null); setBewerking(null); return; }
    setVorige(Number.isFinite(uitkomst) ? uitkomst : null);
    setBewerking(teken);
  };

  const viaToetsenbord = (event: React.KeyboardEvent) => {
    const vertaling: Record<string, string> = { '/': '÷', '*': '×', '-': '−', '+': '+', Enter: '=', Escape: 'C', Backspace: 'C' };
    const teken = /^\d$/.test(event.key) ? event.key : vertaling[event.key];
    if (!teken) return;
    if (event.key === 'Escape') return;
    event.preventDefault();
    druk(teken);
  };

  return <Dialog className="rekenmachine-dialoog" open title="Rekenmachine" onClose={onClose} closeLabel="Rekenmachine sluiten"
    primaryAction={<Button onClick={onClose}>Klaar</Button>}>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
    {/* De som blijft erbij staan: anders ben je hem kwijt zodra je rekent. */}
    {som && <p className="rekenmachine__som">{som}</p>}
    <div className="rekenmachine" onKeyDown={viaToetsenbord}>
      <img src={BEELD} alt="" draggable={false} />
      <output
        className="rekenmachine__venster"
        aria-live="polite"
        style={{ left: `${VENSTER.links}%`, top: `${VENSTER.top}%`, width: `${VENSTER.breed}%`, height: `${VENSTER.hoog}%` }}
      >{invoer}{bewerking ? ` ${bewerking}` : ''}</output>
      {TOETSEN.map(toets => <button
        key={toets.teken}
        type="button"
        className={`rekenmachine__toets${BEWERKINGEN.includes(toets.teken) && bewerking === toets.teken ? ' is-actief' : ''}`}
        aria-label={toets.naam}
        style={{ left: `${toets.links}%`, top: `${toets.top}%`, width: `${toets.breed}%`, height: `${toets.hoog}%` }}
        onClick={() => druk(toets.teken)}
      ><span className="sr-only">{toets.teken}</span></button>)}
    </div>
  </Dialog>;
}
