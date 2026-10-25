import React, { useEffect, useState } from 'react';
import { Check, Droplet, Info, Pencil, Sprout, X } from 'lucide-react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct } from '../../data/plants/species';
import {
  loadPlantFamily,
  MAX_NICKNAME_LENGTH,
  PLANT_FAMILY_CHANGE_EVENT,
  PLANT_FAMILY_KEY,
  plantThirst,
  renamePlant,
  savePlantFamily,
  STAGE_LABEL,
  stageImage,
  waterPlant,
  type PlantFamilyState,
} from '../../services/plantFamily';
import { subscribeLocalState } from '../../services/localState';
import DecorAsset from '../shop/DecorAsset';
import PlantFlashcard from './PlantFlashcard';

function adoptieDatum(waarde: string): string {
  const datum = new Date(waarde);
  if (Number.isNaN(datum.getTime())) return '';
  return datum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Mijn Plantenfamilie: de geadopteerde planten met hun eigen naam. */
export default function PlantFamilyPanel({ onClose }: { onClose: () => void }) {
  const [family, setFamily] = useState<PlantFamilyState>(loadPlantFamily);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [info, setInfo] = useState<{ speciesId: string; nickname: string } | null>(null);
  const [nu, setNu] = useState(() => Date.now());
  useEffect(() => { const klok = window.setInterval(() => setNu(Date.now()), 30000); return () => window.clearInterval(klok); }, []);

  useEffect(() => {
    const update = () => setFamily(loadPlantFamily());
    const unsubscribe = subscribeLocalState(update, PLANT_FAMILY_KEY);
    window.addEventListener(PLANT_FAMILY_CHANGE_EVENT, update);
    return () => { unsubscribe(); window.removeEventListener(PLANT_FAMILY_CHANGE_EVENT, update); };
  }, []);

  const bewaar = (next: PlantFamilyState) => {
    if (next === family) return;
    if (savePlantFamily(next)) setFamily(next);
  };

  return <div className="plant-card-backdrop" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="plant-family" role="dialog" aria-modal="true" aria-labelledby="plant-family-title">
      <header>
        <div><small>Mijn boomhut</small><h2 id="plant-family-title">Mijn Planten</h2><p>Alle planten die jij geadopteerd hebt.</p></div>
        <button type="button" onClick={onClose} aria-label="Sluiten"><X /></button>
      </header>

      {family.plants.some(plant => plantThirst(plant, PLANT_SPECIES_BY_ID[plant.speciesId]?.waterDays ?? 7, nu).stage !== 'fresh') && <aside className="plant-family__alert">
        <img src={ASSET_LIBRARY.avatars.kikiPoses.worried} alt="" />
        <p><strong>Kiki zegt</strong>Er staat een plant droog. Geef hem een slokje water met het druppeltje.</p>
      </aside>}
      {family.plants.length === 0 ? <div className="plant-family__empty">
        <img src={ASSET_LIBRARY.avatars.kikiPoses.explore} alt="" />
        <p>Je hebt nog geen plant geadopteerd.</p>
        <small>Koop er een in de plantenwinkel, dan mag jij hem een naam geven.</small>
      </div> : <div className="plant-family__grid">
        {family.plants.map(plant => {
          const species = PLANT_SPECIES_BY_ID[plant.speciesId];
          const product = plantProduct(plant.speciesId);
          if (!species || !product) return null;
          const bezig = renaming === plant.id;
          const thirst = plantThirst(plant, species.waterDays, nu);
          const ziek = stageImage(species.stages, thirst.stage);
          return <article key={plant.id} className={`plant-family__card is-${thirst.stage}`}>
            {ziek
              ? <img className="decor-asset plant-family__stage" src={ziek} alt={`${plant.nickname} heeft dorst`} />
              : <DecorAsset product={product} />}
            {bezig ? <form className="plant-family__rename" onSubmit={event => {
              event.preventDefault();
              bewaar(renamePlant(family, plant.id, draft));
              setRenaming(null);
            }}>
              <input
                type="text"
                value={draft}
                maxLength={MAX_NICKNAME_LENGTH}
                aria-label={`Nieuwe naam voor ${plant.nickname}`}
                autoFocus
                onChange={event => setDraft(event.target.value)}
              />
              <button type="submit" aria-label="Naam opslaan"><Check /></button>
              <button type="button" aria-label="Naam wijzigen afbreken" onClick={() => setRenaming(null)}><X /></button>
            </form> : <strong className="plant-family__nickname">{plant.nickname}</strong>}
            <small className="plant-family__species">{species.commonName}</small>
            <small className={`plant-family__stage-label is-${thirst.stage}`}><Droplet aria-hidden="true" />{STAGE_LABEL[thirst.stage]}</small>
            <small className="plant-family__date"><Sprout aria-hidden="true" />Sinds {adoptieDatum(plant.adoptedAt)}</small>
            <div className="plant-family__actions">
              <button type="button" className="plant-family__water" aria-label={`${plant.nickname} water geven`} title="Water geven" onClick={() => bewaar(waterPlant(family, plant.id))}><Droplet /></button>
              <button type="button" aria-label={`Meer weten over ${species.commonName}`} onClick={() => setInfo({ speciesId: plant.speciesId, nickname: plant.nickname })}><Info /></button>
              {!bezig && <button type="button" aria-label={`${plant.nickname} een andere naam geven`} onClick={() => { setDraft(plant.nickname); setRenaming(plant.id); }}><Pencil /></button>}
            </div>
          </article>;
        })}
      </div>}
    </section>

    {info && <PlantFlashcard speciesId={info.speciesId} nickname={info.nickname} onClose={() => setInfo(null)} />}
  </div>;
}
