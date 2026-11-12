import React, { useState } from 'react';
import { Button, Dialog } from '../../design-system';

/**
 * Maten omrekenen.
 *
 * Eén soort tegelijk: je kiest eerst lengte of inhoud of gewicht, en ziet
 * dan alleen díé trap. Tik twee maten aan en er spant zich een brug tussen,
 * met daarop wat de sprong kost. Die brug is het hele idee: je ziet hoe ver
 * twee maten uit elkaar liggen in plaats van dat je het moet onthouden.
 *
 * Bij oppervlakte is elke stap × 100 en bij volume × 1000. Dat is precies
 * wat kinderen door elkaar halen, dus het staat op de brug zelf.
 */
interface Trap { naam: string; factor: number; maten: string[]; basis: string; weetjes: string[] }

export const TRAPPEN: Trap[] = [
  { naam: 'Lengte', factor: 10, basis: 'm', maten: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], weetjes: ['1 km = 1000 m'] },
  { naam: 'Inhoud', factor: 10, basis: 'l', maten: ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'], weetjes: ['1 liter = 1 dm³', '1 ml = 1 cm³'] },
  { naam: 'Gewicht', factor: 10, basis: 'g', maten: ['ton', 'kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'], weetjes: ['1 ton = 1000 kg', '1 pond = 500 g'] },
  { naam: 'Oppervlakte', factor: 100, basis: 'm²', maten: ['km²', 'ha', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'], weetjes: ['1 ha = 10.000 m²', '1 are = 1 dam²'] },
  { naam: 'Volume', factor: 1000, basis: 'm³', maten: ['m³', 'dm³', 'cm³', 'mm³'], weetjes: ['1 dm³ = 1 liter', '1 cm³ = 1 ml'] },
];

/** Maten die geen trap zijn maar wel steeds terugkomen in de sommen. */
export const WEETJES = ['1 uur = 60 minuten', '1 dozijn = 12', '1 gros = 144'];

/** Van de ene maat naar de andere: elke stap naar rechts is keer de factor. */
export function reken(aantal: number, stappen: number, factor: number): number {
  const uitkomst = aantal * factor ** stappen;
  return Math.round(uitkomst * 1e9) / 1e9;
}

export const toonMaat = (waarde: number) =>
  waarde.toLocaleString('nl-NL', { maximumFractionDigits: 9, useGrouping: Math.abs(waarde) >= 10000 });

export default function Maten({ onClose }: { onClose: () => void }) {
  const [soort, setSoort] = useState(0);
  const [van, setVan] = useState<number | null>(null);
  const [naar, setNaar] = useState<number | null>(null);
  const [aantal, setAantal] = useState('1');

  const trap = TRAPPEN[soort];
  const kiesSoort = (index: number) => { setSoort(index); setVan(null); setNaar(null); };
  const tik = (maat: number) => {
    if (van === null || naar !== null) { setVan(maat); setNaar(null); return; }
    if (van === maat) { setVan(null); return; }
    setNaar(maat);
  };

  const klaar = van !== null && naar !== null;
  const stappen = klaar ? naar - van : 0;
  const getal = Number(aantal.replace(',', '.'));
  const uitkomst = klaar && Number.isFinite(getal) ? reken(getal, stappen, trap.factor) : null;
  const sprong = trap.factor ** Math.abs(stappen);

  return <Dialog className="maten-dialoog" open title="Maten omrekenen" onClose={onClose}
    closeLabel="Maten sluiten" primaryAction={<Button onClick={onClose}>Klaar</Button>}>
    <div className="maten">
      <nav className="maten-soorten" aria-label="Wat wil je omrekenen?">
        {TRAPPEN.map((item, index) => <button key={item.naam} type="button" aria-pressed={index === soort}
          className={index === soort ? 'is-actief' : undefined} onClick={() => kiesSoort(index)}>{item.naam}</button>)}
      </nav>

      <div className="maten-vak maten-trap-schuif">
        <div className="maten-trap" role="group" aria-label="Kies twee maten" style={{ ['--maten' as string]: trap.maten.length }}>
          {trap.maten.map((maat, index) => <button
            key={maat} type="button" aria-pressed={index === van || index === naar}
            className={`${index === van || index === naar ? 'is-gekozen' : ''}${maat === trap.basis ? ' is-basis' : ''}`}
            onClick={() => tik(index)}
          >{maat}</button>)}
        {/* De brug tussen de twee gekozen maten, met de sprong erop. */}
        {klaar && <p className="maten-brug" style={{ gridColumn: `${Math.min(van, naar) + 1} / ${Math.max(van, naar) + 2}` }}>
          {stappen > 0 ? '×' : '÷'} {toonMaat(sprong)}
        </p>}
        </div>
      </div>

      {klaar
        ? <div className="maten-vak maten-uitkomst" role="status">
            <p>
              <label>
                <span className="sr-only">Hoeveel {trap.maten[van]}?</span>
                <input type="text" inputMode="decimal" value={aantal} onChange={event => setAantal(event.target.value)} />
              </label>
              <span>{trap.maten[van]}</span>
              <i aria-hidden="true">=</i>
              <output>{uitkomst === null ? '—' : toonMaat(uitkomst)}</output>
              <span>{trap.maten[naar]}</span>
            </p>
            <small>{Math.abs(stappen)} {Math.abs(stappen) === 1 ? 'stap' : 'stappen'} naar {stappen > 0 ? 'rechts' : 'links'}</small>
          </div>
        : <p className="maten-vak maten-hint">{van === null
            ? `Tik twee maten aan. Elke stap naar rechts is × ${trap.factor}.`
            : `Je koos ${trap.maten[van]}. Tik nu de maat aan waar je naartoe wilt.`}</p>}

      <p className="maten-weetjes">{[...trap.weetjes, ...WEETJES].join(' · ')}</p>
    </div>
  </Dialog>;
}
