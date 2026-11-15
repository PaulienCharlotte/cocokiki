import React from 'react';
import { Check } from 'lucide-react';
import CardGrid from '../../components/ui/CardGrid';
import SpeechBubble from '../../components/ui/SpeechBubble';
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
  return <section className="redactie-bladen" aria-label="Huiswerkbladen">
    <SpeechBubble character="lua" label="Huiswerk">Welk blad maak je vandaag?</SpeechBubble>
    <CardGrid label="Kies een huiswerkblad" cards={[...kaarten, { id: 'vrij', titel: 'Vrij oefenen', onder: 'Elke keer nieuwe sommen' }]}
      onChoose={id => (id === 'vrij' ? onVrij() : onBlad(Number(id)))} />
  </section>;
}
