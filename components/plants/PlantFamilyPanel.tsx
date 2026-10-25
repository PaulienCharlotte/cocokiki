import React, { useEffect, useState } from 'react';
import { Check, Droplet, Info, Pencil, Sprout, X } from 'lucide-react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct, plantStageImage } from '../../data/plants/species';
import {
  loadPlantFamily,
  MAX_NICKNAME_LENGTH,
  PLANT_FAMILY_CHANGE_EVENT,
  PLANT_FAMILY_KEY,
  plantCondition,
  renamePlant,
  savePlantFamily,
  stageKiki,
  stageLabel,
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

  /**
   * Werk altijd vanaf wat er nú is opgeslagen. Twee snelle tikken achter elkaar
   * zouden anders allebei van dezelfde oude stand uitgaan en elkaar wissen.
   */
  const bewaar = (verander: (huidig: PlantFamilyState) => PlantFamilyState) => {
    const huidig = loadPlantFamily();
    const next = verander(huidig);
    if (next === huidig) return;
    if (savePlantFamily(next)) setFamily(next);
  };

  // Kiki noemt de plant die er het ergst aan toe is, met het symptoom van díé soort.
  const dorstigste = family.plants
    .map(plant => {
      const species = PLANT_SPECIES_BY_ID[plant.speciesId];
      if (!species) return null;
      const toestand = plantCondition(plant, species, nu);
      const kiki = stageKiki(species, toestand.stage);
      return kiki ? { nickname: plant.nickname, kiki, ratio: toestand.urgency } : null;
    })
    .filter((item): item is { nickname: string; kiki: string; ratio: number } => item !== null)
    .sort((a, b) => b.ratio - a.ratio)[0];

  return <div className="plant-card-backdrop" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="plant-family" role="dialog" aria-modal="true" aria-labelledby="plant-family-title">
      <header>
        <div><small>Mijn boomhut</small><h2 id="plant-family-title">Mijn Planten</h2><p>Alle planten die jij geadopteerd hebt.</p></div>
        <button type="button" onClick={onClose} aria-label="Sluiten"><X /></button>
      </header>

      {dorstigste && <aside className="plant-family__alert">
        <img src={ASSET_LIBRARY.avatars.kikiPoses.worried} alt="" />
        <p><strong>Kiki zegt</strong>{dorstigste.nickname}: {dorstigste.kiki}</p>
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
          const toestand = plantCondition(plant, species, nu);
          const ziek = plantStageImage(species, toestand.stage);
          return <article key={plant.id} className={`plant-family__card is-${toestand.stage}`}>
            {ziek
              ? <img className="decor-asset plant-family__stage" src={ziek} alt={`${plant.nickname}: ${stageLabel(species, toestand.stage)}`} />
              : <DecorAsset product={product} />}
            {bezig ? <form className="plant-family__rename" onSubmit={event => {
              event.preventDefault();
              bewaar(huidig => renamePlant(huidig, plant.id, draft));
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
            <small className={`plant-family__stage-label is-${toestand.stage}`}><Droplet aria-hidden="true" />{stageLabel(species, toestand.stage)}</small>
            <small className="plant-family__date"><Sprout aria-hidden="true" />Sinds {adoptieDatum(plant.adoptedAt)}</small>
            <div className="plant-family__actions">
              <button type="button" className="plant-family__water" aria-label={`${plant.nickname} water geven`} title="Water geven" onClick={() => bewaar(huidig => waterPlant(huidig, plant.id))}><Droplet /></button>
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
