import React from 'react';
import WorldTopBar from '../components/platform/WorldTopBar';
import { WORLD_ISLANDS } from '../data/worldHub';
import { ASSET_LIBRARY } from '../data/assetLibrary';

interface WorldHubProps {
  coins: number;
  onNavigate: (path: string) => void;
}

export default function WorldHub({ coins, onNavigate }: WorldHubProps) {
  return <main className="world-canvas" aria-label="CocoKiki avonturenwereld">
    <picture className="world-canvas__picture">
      <source
        media="(max-width: 700px)"
        srcSet={ASSET_LIBRARY.world.backgroundMobile}
      />
      <img
        className="world-canvas__background"
        src={ASSET_LIBRARY.world.backgroundDesktop}
        alt="Een dromerig berglandschap met helderblauw water en zwevende eilanden"
        fetchPriority="high"
      />
    </picture>

    <nav className="world-islands" aria-label="Kies een bestemming">
      {WORLD_ISLANDS.map((destination, index) => <button
        key={destination.id}
        type="button"
        className={`world-island world-island--${destination.id}`}
        style={{ '--island-index': index } as React.CSSProperties}
        aria-label={`${destination.label} openen`}
        onClick={() => onNavigate(destination.path)}
      >
        <img
          src={destination.image}
          alt={destination.alt}
          draggable={false}
          loading={index < 2 ? 'eager' : 'lazy'}
        />
        <span>{destination.label}</span>
      </button>)}
    </nav>

    <WorldTopBar coins={coins} onHome={() => onNavigate('/')} />

  </main>;
}
