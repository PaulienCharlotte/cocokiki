import React from 'react';
import { BookOpen, ChefHat, Compass, Gamepad2, ShoppingBasket, Sparkles, Trophy } from 'lucide-react';
import { Surface } from '../design-system';
import type { DestinationDefinition } from '../platform/destinationRegistry';

interface DestinationScreenProps {
  destination: DestinationDefinition;
  onNavigate: (path: string) => void;
}

const ICONS = {
  treehouse: <BookOpen size={36} />,
  travel: <Compass size={36} />,
  cooking: <ChefHat size={36} />,
  shop: <ShoppingBasket size={36} />,
} as const;

export default function DestinationScreen({ destination, onNavigate }: DestinationScreenProps) {
  const isTravel = destination.id === 'travel';
  const isTreehouse = destination.id === 'treehouse';
  const immersive = Boolean(destination.background);

  return <main className={`destination-page destination-page--${destination.id}${immersive ? ' destination-page--immersive' : ''}`}>
    {destination.background && <img className="destination-page__background" src={destination.background} alt={destination.backgroundAlt ?? ''} />}
    {isTravel ? <section className="travel-entry" aria-labelledby="destination-title">
      <h1 id="destination-title" className="destination-page__sr-title">Topo</h1>
      <button className="travel-entry__cta" type="button" aria-label="Open Topo" onClick={() => onNavigate('/games/topo')}>
        <img src="/games/destinations/topo-entry.webp" alt="" />
      </button>
    </section> : <section className="destination-page__layout" aria-labelledby="destination-title">
      {!immersive && <div className="destination-page__visual" aria-hidden="true">
        {destination.illustration
          ? <img src={destination.illustration} alt="" />
          : <span>{ICONS[destination.id]}</span>}
      </div>}
      <Surface className="destination-page__surface" elevated padding="large">
        <span className="destination-page__icon" aria-hidden="true">{ICONS[destination.id]}</span>
        <p className="destination-page__eyebrow">{destination.eyebrow}</p>
        <h1 id="destination-title">{destination.title}</h1>
        <p className="destination-page__description">{destination.description}</p>
        <div className="destination-page__status" role="status">
          {isTreehouse ? <Trophy size={19} /> : <Sparkles size={19} />}
          <span>{isTreehouse ? 'Je persoonlijke verzameling krijgt hier later een plek.' : 'Deze bestemming wordt in een volgende fase geopend.'}</span>
        </div>
      </Surface>
    </section>}
  </main>;
}
