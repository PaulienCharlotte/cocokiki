import React, { useState } from 'react';
import { Undo2 } from 'lucide-react';
import SpeechBubble from '../../components/ui/SpeechBubble';

/**
 * De tijdlijn: hoe lang duurt het van de ene kloktijd tot de andere?
 *
 * Kloktijden zijn geen kommagetallen: 17.35 − 15.05 is geen 2,30 uur. Daarom
 * reken je ze hier niet uit met de sombouwer, maar spring je over een lijn:
 * eerst hele uren, dan minuten. Daarna zet je het om:
 * - eenheid 'uur': met de kwartierstrook (30 minuten is 0,5 uur);
 * - eenheid 'minuten': je telt de sprongen op tot minuten.
 */
const SPRONGEN = [60, 30, 15, 5] as const;
const naarMinuten = (tijd: string) => { const [u, m] = tijd.split('.').map(Number); return u * 60 + (m || 0); };
const alsKlok = (min: number) => `${Math.floor(min / 60)}.${String(min % 60).padStart(2, '0')}`;
const sprongNaam = (s: number) => (s === 60 ? '1 uur' : `${s} min`);
const KWARTIEREN = [{ min: 0, deel: 0, naam: '0' }, { min: 15, deel: 0.25, naam: '0,25' }, { min: 30, deel: 0.5, naam: '0,5' }, { min: 45, deel: 0.75, naam: '0,75' }];

export default function Tijdlijn({ van, tot, eenheid, onKlaar }: { van: string; tot: string; eenheid: string; onKlaar: (waarde: number) => void }) {
  const start = naarMinuten(van), eind = naarMinuten(tot), duur = eind - start;
  const [sprongen, setSprongen] = useState<number[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [wiebel, setWiebel] = useState(0);
  const [minuten, setMinuten] = useState('');
  const nu = start + sprongen.reduce((a, b) => a + b, 0);
  const aangekomen = nu === eind;
  const uren = Math.floor(duur / 60), rest = duur % 60;
  const fout = (tekst: string) => { setHint(tekst); setWiebel(w => w + 1); };

  const spring = (s: number) => {
    if (aangekomen) return;
    if (nu + s > eind) { fout(s === 60 ? 'Een heel uur is te ver. Spring nu in minuten.' : 'Te ver! Kies een kleinere sprong.'); return; }
    setHint(null); setSprongen([...sprongen, s]);
  };
  const kiesKwartier = (k: typeof KWARTIEREN[number]) => {
    if (k.min !== rest) { fout(`Een uur heeft 60 minuten, niet 100. Hoeveel is ${rest} minuten van een uur?`); return; }
    onKlaar(uren + k.deel);
  };
  const telOp = (event: React.FormEvent) => {
    event.preventDefault();
    const waarde = Number(minuten.replace(',', '.'));
    if (waarde !== duur) { fout('Tel alle sprongen nog eens op. Een uur is 60 minuten.'); setMinuten(''); return; }
    onKlaar(waarde);
  };
  const plek = (min: number) => `${((min - start) / duur) * 100}%`;

  return <div className="tijdlijn">
    <div className="tijdlijn__lijn" aria-label={`Tijdlijn van ${van} tot ${tot}. Je bent bij ${alsKlok(nu)}.`}>
      <span className="tijdlijn__paal is-start" style={{ left: '0%' }}>{van}</span>
      <span className="tijdlijn__paal is-eind" style={{ left: '100%' }}>{aangekomen ? '' : tot}</span>
      {sprongen.map((s, i) => { const vanaf = start + sprongen.slice(0, i).reduce((a, b) => a + b, 0); return <span key={i} className={`tijdlijn__boog${s === 60 ? ' is-uur' : ''}`} style={{ left: plek(vanaf), width: `${(s / duur) * 100}%` }}><small>{sprongNaam(s)}</small></span>; })}
      <span key={wiebel} className={`tijdlijn__wijzer${hint ? ' is-fout' : ''}${aangekomen ? ' is-er' : ''}`} style={{ left: plek(nu) }}>{alsKlok(nu)}</span>
    </div>

    {!aangekomen && <div className="tijdlijn__sprongen" role="group" aria-label="Spring verder">
      {SPRONGEN.map(s => <button key={s} type="button" className={`tijdlijn__sprong${s === 60 ? ' is-uur' : ''}`} onClick={() => spring(s)}>+{sprongNaam(s)}</button>)}
      {sprongen.length > 0 && <button type="button" className="tijdlijn__terug" aria-label="Laatste sprong terug" onClick={() => { setHint(null); setSprongen(sprongen.slice(0, -1)); }}><Undo2 size={22} aria-hidden="true" /></button>}
    </div>}

    {aangekomen && <p className="tijdlijn__duur" role="status">Dat is {uren ? `${uren} uur` : ''}{uren && rest ? ' en ' : ''}{rest ? `${rest} minuten` : ''}.</p>}

    {aangekomen && eenheid === 'uur' && (rest === 0
      ? <button type="button" className="tijdlijn__sprong is-uur" onClick={() => onKlaar(uren)}>{uren} uur</button>
      : <div className="tijdlijn__kwartieren" role="group" aria-label={`Hoeveel uur is ${rest} minuten?`}>
        {KWARTIEREN.map(k => <button key={k.min} type="button" className="tijdlijn__kwartier" onClick={() => kiesKwartier(k)}>
          <span className="tijdlijn__taart" style={{ ['--deel' as string]: `${k.deel * 360}deg` }} aria-hidden="true" />
          <strong>{uren}{k.min ? k.naam.slice(1) : ''} uur</strong><small>{k.min} min</small>
        </button>)}
      </div>)}

    {aangekomen && eenheid !== 'uur' && <form className="tijdlijn__optellen" onSubmit={telOp}>
      <label>Samen <input inputMode="numeric" autoFocus value={minuten} onChange={e => setMinuten(e.target.value)} aria-label="Hoeveel minuten samen" /> minuten</label>
      <button type="submit" className="tijdlijn__sprong" disabled={!minuten.trim()}>Klaar</button>
    </form>}

    {hint && <SpeechBubble character="lua" label="tip" className="tijdlijn__hint">{hint}</SpeechBubble>}
  </div>;
}
