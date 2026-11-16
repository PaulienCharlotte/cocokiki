import React from 'react';
import { Check } from 'lucide-react';
import { CHARACTERS } from '../../data/characters';
import './rekenspel.css';
import { BLADEN } from './redactie/bladen';
import { laadBladen } from './redactie/bladVoortgang';

/**
 * Het huiswerk terugvinden: elk blad uit de map is een kaart, met hetzelfde
 * nummer als op het papier. Een kaart laat zien hoe ver je bent, zodat je
 * ziet welk blad nog moet. Vrij oefenen staat er als laatste kaart achter.
 */
export default function RedactieBladen({ onBlad, onVrij }: { onBlad: (nr: number) => void; onVrij: () => void }) {
  const voortgang = laadBladen();
  const kaarten = BLADEN.map(blad => {
    const antwoorden = voortgang[blad.nr] ?? {};
    const gemaakt = Object.keys(antwoorden).length;
    const goed = Object.values(antwoorden).filter(Boolean).length;
    const af = gemaakt === blad.sommen.length;
    return {
      id: String(blad.nr),
      titel: `Blad ${blad.nr}`,
      onder: af ? `${goed} van de ${blad.sommen.length} goed` : gemaakt ? `${gemaakt} van de ${blad.sommen.length} gemaakt` : `${blad.sommen.length} sommen`,
      meta: af ? <Check size={18} aria-label="af" /> : undefined,
    };
  });
  // In de huisstijl: de bladen liggen als papiertjes in de wereld, Lua vraagt
  // welk blad je maakt, en vrij oefenen is de hoofdknop rechtsonder.
  const lua = CHARACTERS.lua;
  return <section className="ck-scherm rekenspel rekenbladen" data-wereld="school" aria-label="Huiswerkbladen">
    <ul className="rekenbladen__stapel" aria-label="Kies een huiswerkblad">
      {kaarten.map((kaart, i) => <li key={kaart.id} style={{ '--blad': i } as React.CSSProperties}>
        <button type="button" className={`rekenblad ck-papier${kaart.meta ? ' is-af' : ''}`} onClick={() => onBlad(Number(kaart.id))}>
          <strong>{kaart.titel}</strong><span>{kaart.onder}</span>{kaart.meta && <span className="rekenblad__af">{kaart.meta}</span>}
        </button>
      </li>)}
    </ul>
    <div className="ck-zone-personage rekenspel__personage">
      <img className="ck-ballon__gezicht" src={lua.beeld} alt={lua.naam} />
      <p className="ck-ballon__tekst"><span className="ck-ballon__naam">BABY LUA</span>Welk blad maak je vandaag?</p>
    </div>
    <div className="ck-zone-antwoord"><button type="button" className="ck-knop ck-knop--hoofd" onClick={onVrij}>Vrij oefenen</button></div>
  </section>;
}
