import React from 'react';
import { CHARACTERS, type CharacterId } from '../../data/characters';
import './speech-bubble.css';

/**
 * De spraakwolk: het personage zegt het, geen kopje erboven.
 *
 * Dit is de enige vorm waarin de app iets uitlegt of een vraag stelt. Eén
 * stem per scherm, dus één wolk per scherm. Bouw er geen los paneel of eigen
 * overlay naast; dan gaan de spellen weer uit elkaar lopen.
 */
interface SpeechBubbleProps {
  character: CharacterId;
  /** Achter de naam, in kapitalen: waar dit over gaat ("vraag van de dag"). */
  label?: React.ReactNode;
  /** Rechts op de naamregel, bijvoorbeeld een stand. Houd het kort. */
  aside?: React.ReactNode;
  /** Hoe de wolk erbij staat: gewoon, goed gedaan, of iets rechtzetten. */
  tone?: 'default' | 'goed' | 'alert';
  /** Id voor de tekst in de wolk, zodat een kaart ernaar kan verwijzen. */
  textId?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SpeechBubble({ character, label, aside, tone = 'default', textId, children, className }: SpeechBubbleProps) {
  const { naam, beeld } = CHARACTERS[character];
  return <div className={`ck-zegt${tone === 'default' ? '' : ` is-${tone}`}${className ? ` ${className}` : ''}`} role="status">
    <img className="ck-zegt__gids" src={beeld} alt={naam} />
    <div className="ck-zegt__wolk">
      <p className="ck-zegt__naam">
        <strong>{naam}</strong>{label && <span> · {label}</span>}
        {aside && <span className="ck-zegt__erbij">{aside}</span>}
      </p>
      <p className="ck-zegt__tekst" id={textId}>{children}</p>
    </div>
  </div>;
}
