import React from 'react';
import { Button } from '../../design-system';
import SpeechBubble from '../ui/SpeechBubble';
import CocoCoin from '../platform/CocoCoin';
import CookingAssetImage from './CookingAssetImage';
import Confetti from './Confetti';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { CHARACTERS } from '../../data/characters';
import type { Bestelling } from '../../data/cooking/orders';
import type { RecipeConfig } from '../../data/cooking/types';
import './orders.css';

/**
 * De aflevering: het eind van een bestelling.
 *
 * Vroeger stond hier "Klaar, chef!" en een aantal porties. Dat is geen einde,
 * dat is een melding. Nu breng je het weg en zegt degene voor wie je het
 * maakte er zelf iets over — over de wens waar je op lette en over hoeveel je
 * er hebt gemaakt. Daarna is de bestelling echt van de toonbank af.
 */
interface OrderDeliveryProps {
  bestelling: Bestelling;
  recipe: RecipeConfig;
  /** Hoe vaak er gebakken is; samen met de porties het aantal dat je brengt. */
  keer: number;
  /** De bonus die erbij kwam, of 0 als het zoeken was. */
  bonus: number;
  /** Of recept en aantal meteen goed waren. */
  inEenKeer: boolean;
  onClose: () => void;
}

export default function OrderDelivery({ bestelling, recipe, keer, bonus, inEenKeer, onClose }: OrderDeliveryProps) {
  const klant = CHARACTERS[bestelling.klant];
  const stuks = (recipe.servings ?? 1) * keer;
  return <section className="bestel-aflevering" aria-live="polite">
    <img className="bestel-aflevering__achtergrond" src={ASSET_LIBRARY.treehouse.stations.worktop} alt="" />
    <article className="bestel-kaart bestel-kaart--aflevering">
      <div className="bestel-aflevering__gerecht">
        <Confetti />
        <CookingAssetImage src={recipe.image} alt={recipe.name} />
      </div>
      <p className="bestel-aflevering__kop">Afgeleverd bij {klant.naam}</p>
      <SpeechBubble character={bestelling.klant} tone="goed">{bestelling.dank}</SpeechBubble>
      <dl className="bestel-bon">
        <div><dt>Gemaakt</dt><dd>{recipe.name}</dd></div>
        <div><dt>Gebakken</dt><dd>{keer}× · {stuks} {stuks === 1 ? 'portie' : 'porties'}</dd></div>
        <div><dt>De wens</dt><dd>{inEenKeer ? 'Meteen goed' : 'Na even zoeken goed'}</dd></div>
      </dl>
      {bonus > 0 && <p className="bestel-bonus"><CocoCoin size={19} />+{bonus} erbij, omdat je het in één keer goed had</p>}
      <Button size="large" onClick={onClose}>Terug naar de toonbank</Button>
    </article>
  </section>;
}
