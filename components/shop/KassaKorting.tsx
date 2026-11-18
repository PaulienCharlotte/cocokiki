import React, { useState } from 'react';
import { CHARACTERS } from '../../data/characters';
import './kassa-korting.css';

/**
 * De kassa: reken zelf uit wat je betaalt, en je krijgt 10% korting.
 *
 * Eén vraag, vier bellen, en één zachte uitweg ("Gewoon betalen") voor wie
 * geen zin heeft om te rekenen; dan betaal je de volle prijs. Een fout kost
 * niets: de bel wiebelt, Lua geeft een tip, en je probeert opnieuw.
 */
export function kassaKorting(totaal: number) {
  const korting = Math.max(1, Math.round(totaal / 10));
  const prijs = totaal - korting;
  const keuzes = [...new Set([prijs, totaal - 10 === prijs ? totaal - 5 : totaal - 10, korting, totaal])].filter(n => n > 0);
  const draai = totaal % keuzes.length;
  return { korting, prijs, keuzes: [...keuzes.slice(draai), ...keuzes.slice(0, draai)] };
}

export default function KassaKorting({ totaal, onBetaal }: { totaal: number; onBetaal: (bedrag: number) => void }) {
  const { korting, prijs, keuzes } = kassaKorting(totaal);
  const [fout, setFout] = useState<number | null>(null);
  const [tip, setTip] = useState(false);
  const [goed, setGoed] = useState(false);
  const kies = (waarde: number) => {
    if (goed) return;
    if (waarde !== prijs) { setFout(waarde); setTip(true); return; }
    setGoed(true);
    window.setTimeout(() => onBetaal(prijs), 900);
  };
  const lua = CHARACTERS.lua;
  return <section className="kassa" aria-label="Kassa">
    <div className="ck-ballon kassa__ballon">
      <img className="ck-ballon__gezicht" src={lua.beeld} alt={lua.naam} />
      <p className="ck-ballon__tekst" role="status"><span className="ck-ballon__naam">{lua.naam}</span>
        {goed ? `Goed gerekend! Je betaalt ${prijs} in plaats van ${totaal}.`
          : tip ? (totaal % 10 ? `10% is een tiende: ${totaal} gedeeld door 10 is ${String(totaal / 10).replace('.', ',')}. Afgerond ${korting}. Haal dat eraf.` : `10% is een tiende: ${totaal} gedeeld door 10 is ${korting}. Haal dat eraf.`)
          : `Het kost ${totaal}. Reken zelf uit wat je met 10% korting betaalt!`}
      </p>
    </div>
    <div className="kassa__bellen" role="group" aria-label="Wat betaal je met korting?">
      {keuzes.map((waarde, i) => <button key={waarde} type="button"
        className={`ck-bel ck-bel--${(i % 4) + 1} kassa__bel${fout === waarde ? ' is-fout' : ''}${goed && waarde === prijs ? ' is-goed' : ''}${goed && waarde !== prijs ? ' is-weg' : ''}`}
        onAnimationEnd={() => fout === waarde && setFout(null)} onClick={() => kies(waarde)}>
        <span className="ck-bel__kern" />{waarde}
      </button>)}
    </div>
    {!goed && <button type="button" className="kassa__zonder" onClick={() => onBetaal(totaal)}>Gewoon {totaal} betalen</button>}
  </section>;
}
