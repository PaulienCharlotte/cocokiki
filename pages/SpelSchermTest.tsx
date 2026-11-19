/* Testpagina voor het gedeelde spelscherm (stap 3 van docs/OMBOUWPLAN.md).
   Een kleine kassa-som met Baby Lua laat alle zones en onderdelen zien. */
import React, { useState } from 'react';
import SpelScherm, { Antwoorden, Bel, Doel, Gereedschapsbalk, Hangkaartje, Menu, Paneel, Personage, Statuseiland, useBeloning, type GereedschapId } from '../design-system/components/SpelScherm';
import { geluid } from '../design-system/geluid';

const RONDES = 5;
const ZINNEN_GOED = ['Ja! Precies goed.', 'Top, dat klopt.', 'Yes! Jij rekent snel.'];

function maakOpties(som: number) {
  const s = new Set([som]);
  while (s.size < 4) { const d = som + [-2, -1, 1, 2, 3, -3, 10][Math.floor(Math.random() * 7)]; if (d > 0) s.add(d); }
  return [...s].sort(() => Math.random() - .5);
}

function KassaSom({ onBeloning, ronde, volgende }: { onBeloning: (titel: string) => void; ronde: number; volgende: () => void }) {
  const beloon = useBeloning();
  const [prijzen] = useState(() => ronde === 0 ? [8, 6] : [2 + Math.floor(Math.random() * 9), 2 + Math.floor(Math.random() * 9)]);
  const [a, b] = prijzen;
  const [opties] = useState(() => maakOpties(a + b));
  const [fout, setFout] = useState<number | null>(null);
  const [goed, setGoed] = useState<number | null>(null);
  const [zin, setZin] = useState<string>(ronde === 0 ? 'Wat kost het samen?' : 'Nog eentje! Wat is het samen?');
  const [aan, setAan] = useState<GereedschapId[]>([]);

  const kies = (n: number, el: HTMLElement) => {
    if (goed !== null) return;
    if (n === a + b) {
      setGoed(n); setFout(null); geluid.goed(); beloon(el, 5);
      setZin(ZINNEN_GOED[ronde % 3]);
      window.setTimeout(() => onBeloning(ronde % 2 ? 'Snelle rekenaar' : 'Kassa-held'), 350);
      window.setTimeout(volgende, 2600);
    } else {
      setFout(null); requestAnimationFrame(() => setFout(n)); geluid.fout(); setAan(['hint']);
      setZin(n > a + b ? `Iets te veel. Tel eerst ${a}, dan nog ${b} erbij.` : `Bijna! Begin bij ${a} en tel er ${b} bij.`);
    }
  };

  return <>
    <Hangkaartje links="30%" boven="48%" onder="rijst">€{a}</Hangkaartje>
    <Hangkaartje links="48%" boven="44%" onder="tomaten" vertraging={1.2}>€{b}</Hangkaartje>
    <Doel id="mand" links="22%" boven="52%" breed="34%" hoog="18%" label="Kassa" />
    <Gereedschapsbalk tonen={['hint', 'rekenmachine']} aan={aan} namen={{ hint: 'Hint van Lua' }}
      onKies={id => setAan(huidig => huidig.includes(id) ? huidig.filter(x => x !== id) : [...huidig, id])} />
    <Personage naam="Baby Lua" gezicht="/images/avatars/lua.webp" zin={zin} blij={goed !== null} />
    <Antwoorden uitleg={goed === null && fout === null ? 'Tik of sleep een bel' : undefined}>
      {opties.map((n, i) => <React.Fragment key={n}><Bel kleur={(i + 1) as 1 | 2 | 3 | 4} doel="mand"
        status={goed !== null && goed !== n ? 'weg' : fout === n ? 'fout' : null}
        onKies={el => kies(n, el)}>{n}</Bel></React.Fragment>)}
    </Antwoorden>
  </>;
}

export default function SpelSchermTest({ onHome }: { onHome: () => void }) {
  const [ronde, setRonde] = useState(0);
  const [munten, setMunten] = useState(65);
  const [beloning, setBeloning] = useState<{ munten: number; titel: string } | null>(null);
  const [paneel, setPaneel] = useState<null | 'winkel' | 'todo'>(null);

  const onBeloning = (titel: string) => {
    setBeloning({ munten: 5, titel });
    window.setTimeout(() => setMunten(m => m + 5), 800);
    window.setTimeout(() => setBeloning(null), 2000);
  };

  return <SpelScherm
    wereld="school"
    achtergrond="/dreamworld/lua-workshop.webp"
    onTerug={onHome}
    terugLabel="Terug naar het eiland"
    status={<Statuseiland munten={munten} rondes={RONDES} klaar={ronde % RONDES} niveau="Niveau 1" beloning={beloning} />}
    menu={<Menu onWinkel={() => setPaneel('winkel')} onToDo={() => setPaneel('todo')} />}
    paneel={<Paneel open={paneel !== null} titel={paneel === 'winkel' ? 'Winkel' : 'To Do'} onSluit={() => setPaneel(null)}>
      <p>Hier komt de inhoud van het paneel. Het schuift van rechts over de wereld.</p>
    </Paneel>}
  >
    <React.Fragment key={ronde}><KassaSom ronde={ronde} onBeloning={onBeloning} volgende={() => setRonde(r => r + 1)} /></React.Fragment>
  </SpelScherm>;
}
