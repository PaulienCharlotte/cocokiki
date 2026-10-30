import React from 'react';
import './card-grid.css';

/**
 * Elk keuzescherm in de app ziet er zo uit.
 *
 * Een meerkeuzevraag is een lijst (`ChoiceList`), maar "waar wil je heen?" is
 * iets anders: daar kijk je naar plaatjes en kies je er één. Dat zijn schone
 * witte kaarten in een raster, met ruimte eromheen en één zachte schaduw —
 * geen rand én schaduw, geen eigen kleur per spel.
 *
 * Hier staat het spelletjesmenu van rekenen in, de continenten van het
 * vlaggenmemory, en alles van dezelfde soort dat er nog bij komt.
 */
export interface GridCard {
  id: string;
  titel: string;
  /** Eén korte regel eronder. Laat hem weg als het plaatje het al zegt. */
  onder?: string;
  /** Pad naar een plaatje; vult het bovenvlak van de kaart. */
  beeld?: string;
  /** Een icoon als er geen tekening is. */
  icoon?: React.ReactNode;
  /** Eén kort ding rechtsonder: een stand, een aantal. */
  meta?: React.ReactNode;
}

interface CardGridProps {
  cards: GridCard[];
  onChoose: (id: string) => void;
  /** Hoeveel kaarten er naast elkaar passen op een breed scherm. */
  kolommen?: 2 | 3;
  /** Wat een voorleesprogramma zegt over het raster. */
  label?: string;
  className?: string;
}

export default function CardGrid({ cards, onChoose, kolommen = 3, label, className }: CardGridProps) {
  // Kaarten zonder tekening zijn laag; die mogen op een telefoon naast elkaar
  // blijven staan, anders wordt het één lange lijst om langs te scrollen.
  const compact = cards.every(kaart => !kaart.beeld);
  return <ul className={`ck-kaarten is-${kolommen}${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`} aria-label={label}>
    {cards.map(kaart => <li key={kaart.id}>
      <button type="button" className="ck-kaart" onClick={() => onChoose(kaart.id)}>
        {/* Een tekening vult het bovenvlak; een icoon krijgt een klein vierkantje. */}
        {(kaart.beeld || kaart.icoon) && <span className={`ck-kaart__beeld${kaart.beeld ? '' : ' is-icoon'}`}>
          {kaart.beeld ? <img src={kaart.beeld} alt="" /> : kaart.icoon}
        </span>}
        <span className="ck-kaart__tekst">
          <strong>{kaart.titel}</strong>
          {kaart.onder && <small>{kaart.onder}</small>}
        </span>
        {kaart.meta && <span className="ck-kaart__meta">{kaart.meta}</span>}
      </button>
    </li>)}
  </ul>;
}
