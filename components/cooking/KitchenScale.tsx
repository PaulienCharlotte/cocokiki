import React from 'react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import type { BowlContents } from '../../data/cooking/preparation';

interface KitchenScaleProps {
  /** Het gewogen aantal gram. */
  value: number;
  full: number;
  ingredientImage: string;
  unit?: string;
  contents?: BowlContents;
}

const MAX_KORRELS = 24;

/**
 * Wat je in de kom ziet is het ingrediënt zelf, gestrooid als losse korrels.
 *
 * Eerst lag er één groot plaatje in de kom, en dat werd door de ronde rand
 * doormidden geknipt. Nu vallen er kleine stukjes in, en hoe meer je weegt,
 * hoe voller de kom raakt. Dezelfde korrel ligt altijd op dezelfde plek, zodat
 * de berg niet door elkaar springt als er eentje bij komt.
 */
function korrels(value: number, full: number) {
  const deel = Math.min(1, value / Math.max(1, full));
  return Array.from({ length: Math.max(1, Math.round(deel * MAX_KORRELS)) }, (_, i) => {
    // Een vaste, onregelmatige spreiding: geen rooster, maar ook geen toeval.
    const hoek = i * 2.399963;
    const straal = Math.sqrt((i + .5) / MAX_KORRELS) * 38;
    return {
      sleutel: i,
      stijl: {
        left: `${50 + Math.cos(hoek) * straal}%`,
        top: `${52 + Math.sin(hoek) * straal * .62}%`,
        transform: `translate(-50%, -50%) rotate(${(i * 57) % 360}deg)`,
      } as React.CSSProperties,
    };
  });
}

/**
 * Bestaande recepten houden hun lege kom; nieuwe stappen kunnen inhoud tonen.
 */
export default function KitchenScale({ value, full, contents, ingredientImage, unit = 'g' }: KitchenScaleProps) {
  return <div className="cooking-scale">
    <img className="cooking-scale__body" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    {contents && value > 0 && ingredientImage && <span className="baking-scale-fill" aria-hidden="true">
      {korrels(value, full).map(korrel => <img key={korrel.sleutel} src={ingredientImage} alt="" style={korrel.stijl} />)}
    </span>}
    <img className="cooking-scale__front" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    <span className="cooking-scale__display" aria-live="polite" aria-label={`${value} ${unit === 'g' ? 'gram' : 'milliliter'}`}>
      <b>{value}</b><em>{unit}</em>
    </span>
  </div>;
}
