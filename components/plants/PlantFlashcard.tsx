import React from 'react';
import { Droplets, Globe2, Sparkles, Sprout, Sun, X } from 'lucide-react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct } from '../../data/plants/species';
import DecorAsset from '../shop/DecorAsset';

interface PlantFlashcardProps {
  speciesId: string | null;
  /** De bijnaam van een geadopteerde plant; in de winkel leeg. */
  nickname?: string;
  onClose: () => void;
}

/** De leerkaart bij een plant: waar hij vandaan komt en wat hij nodig heeft. */
export default function PlantFlashcard({ speciesId, nickname, onClose }: PlantFlashcardProps) {
  const species = speciesId ? PLANT_SPECIES_BY_ID[speciesId] : undefined;
  const product = speciesId ? plantProduct(speciesId) : undefined;
  if (!species || !product) return null;

  return <div className="plant-card-backdrop" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="plant-card" role="dialog" aria-modal="true" aria-labelledby="plant-card-title">
      <button className="plant-card__close" type="button" onClick={onClose} aria-label="Sluiten"><X /></button>

      <header className="plant-card__hero">
        <DecorAsset product={product} className="plant-card__art" />
        <div>
          {nickname && <small className="plant-card__nickname">{nickname}</small>}
          <h2 id="plant-card-title">{species.commonName}</h2>
          <em>{species.scientificName}</em>
        </div>
      </header>

      <dl className="plant-card__facts">
        <div>
          <span aria-hidden="true"><Globe2 /></span>
          <div><dt>Waar vandaan</dt><dd>{species.origin}</dd></div>
        </div>
        <div>
          <span aria-hidden="true"><Sprout /></span>
          <div><dt>Hoe hij groeit</dt><dd>{species.habitat}</dd></div>
        </div>
        <div>
          <span aria-hidden="true"><Sun /></span>
          <div><dt>Licht</dt><dd>{species.light}</dd></div>
        </div>
        <div>
          <span aria-hidden="true"><Droplets /></span>
          <div><dt>Water</dt><dd>{species.water}</dd></div>
        </div>
        <div>
          <span aria-hidden="true"><Sparkles /></span>
          <div><dt>Wist je dat?</dt><dd>{species.funFact}</dd></div>
        </div>
      </dl>

      <aside className="plant-card__kiki">
        <img src={ASSET_LIBRARY.avatars.kikiPoses.tip} alt="" />
        <p><strong>Kiki zegt</strong>{species.kikiTip}</p>
      </aside>
    </section>
  </div>;
}
