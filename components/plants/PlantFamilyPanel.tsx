import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Pencil, X } from 'lucide-react';
import { Button } from '../../design-system';
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
  type AdoptedPlant,
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

/** Mijn Planten: een rustig overzicht, met één plant tegelijk in beeld als je erop tikt. */
export default function PlantFamilyPanel({ onClose }: { onClose: () => void }) {
  const [family, setFamily] = useState<PlantFamilyState>(loadPlantFamily);
  const [open, setOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
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

  const toestandVan = (plant: AdoptedPlant) => {
    const species = PLANT_SPECIES_BY_ID[plant.speciesId];
    return species ? plantCondition(plant, species, nu) : null;
  };

  const aandacht = family.plants.filter(plant => toestandVan(plant)?.kind !== 'fresh' && toestandVan(plant) !== null).length;
  const gekozen = open ? family.plants.find(plant => plant.id === open) ?? null : null;

  return <div className="plant-card-backdrop" role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="plant-family" role="dialog" aria-modal="true" aria-labelledby="plant-family-title">
      <header className="plant-family__top">
        {gekozen
          ? <button type="button" className="plant-family__back" onClick={() => { setOpen(null); setRenaming(false); }} aria-label="Terug naar al mijn planten"><ArrowLeft /></button>
          : <div><h2 id="plant-family-title">Mijn Planten</h2>
              <p>{family.plants.length === 0 ? 'Nog geen planten' : aandacht > 0 ? `${aandacht} ${aandacht === 1 ? 'plant wil' : 'planten willen'} aandacht` : 'Alles ziet er goed uit'}</p>
            </div>}
        <button type="button" className="plant-family__sluit" onClick={onClose} aria-label="Sluiten"><X /></button>
      </header>

      {family.plants.length === 0 ? <div className="plant-family__empty">
        <img src={ASSET_LIBRARY.avatars.kikiPoses.explore} alt="" />
        <p>Je hebt nog geen plant geadopteerd.</p>
        <small>Koop er een in de plantenwinkel, dan mag jij hem een naam geven.</small>
      </div> : gekozen ? <PlantDetail
        plant={gekozen}
        nu={nu}
        renaming={renaming}
        draft={draft}
        onDraft={setDraft}
        onStartRename={() => { setDraft(gekozen.nickname); setRenaming(true); }}
        onRename={() => { bewaar(huidig => renamePlant(huidig, gekozen.id, draft)); setRenaming(false); }}
        onCancelRename={() => setRenaming(false)}
        onWater={() => bewaar(huidig => waterPlant(huidig, gekozen.id))}
        onInfo={() => setInfo({ speciesId: gekozen.speciesId, nickname: gekozen.nickname })}
      /> : <ul className="plant-family__grid">
        {family.plants.map(plant => {
          const species = PLANT_SPECIES_BY_ID[plant.speciesId];
          const product = plantProduct(plant.speciesId);
          const toestand = toestandVan(plant);
          if (!species || !product || !toestand) return null;
          const ziek = plantStageImage(species, toestand.stage);
          return <li key={plant.id}>
            <button type="button" className={`plant-family__card is-${toestand.stage}`} onClick={() => setOpen(plant.id)}>
              {ziek
                ? <img className="decor-asset" src={ziek} alt="" />
                : <DecorAsset product={product} />}
              <strong>{plant.nickname}</strong>
              <small className={`plant-family__staat is-${toestand.stage}`}>{stageLabel(species, toestand.stage)}</small>
            </button>
          </li>;
        })}
      </ul>}
    </section>

    {info && <PlantFlashcard speciesId={info.speciesId} nickname={info.nickname} onClose={() => setInfo(null)} />}
  </div>;
}

interface DetailProps {
  plant: AdoptedPlant;
  nu: number;
  renaming: boolean;
  draft: string;
  onDraft: (waarde: string) => void;
  onStartRename: () => void;
  onRename: () => void;
  onCancelRename: () => void;
  onWater: () => void;
  onInfo: () => void;
}

/** Eén plant groot in beeld, met alles wat je ermee kunt doen bij elkaar. */
function PlantDetail({ plant, nu, renaming, draft, onDraft, onStartRename, onRename, onCancelRename, onWater, onInfo }: DetailProps) {
  const species = PLANT_SPECIES_BY_ID[plant.speciesId];
  const product = plantProduct(plant.speciesId);
  if (!species || !product) return null;
  const toestand = plantCondition(plant, species, nu);
  const ziek = plantStageImage(species, toestand.stage);
  const advies = stageKiki(species, toestand.stage);

  return <div className="plant-detail">
    <div className="plant-detail__plant">
      {ziek
        ? <img className="decor-asset" src={ziek} alt={`${plant.nickname}: ${stageLabel(species, toestand.stage)}`} />
        : <DecorAsset product={product} />}
    </div>

    {renaming ? <form className="plant-detail__rename" onSubmit={event => { event.preventDefault(); onRename(); }}>
      <input
        type="text"
        value={draft}
        maxLength={MAX_NICKNAME_LENGTH}
        aria-label={`Nieuwe naam voor ${plant.nickname}`}
        autoFocus
        onChange={event => onDraft(event.target.value)}
      />
      <button type="submit" aria-label="Naam opslaan"><Check /></button>
      <button type="button" aria-label="Naam wijzigen afbreken" onClick={onCancelRename}><X /></button>
    </form> : <h3 className="plant-detail__naam">
      {plant.nickname}
      <button type="button" onClick={onStartRename} aria-label={`${plant.nickname} een andere naam geven`}><Pencil /></button>
    </h3>}

    <p className="plant-detail__soort">{species.commonName} · sinds {adoptieDatum(plant.adoptedAt)}</p>

    <p className={`plant-detail__staat is-${toestand.stage}`}>{stageLabel(species, toestand.stage)}</p>
    {advies && <p className="plant-detail__advies">{advies}</p>}

    <div className="plant-detail__acties">
      <Button variant="primary" fullWidth pill onClick={onWater}>Water geven</Button>
      <Button variant="quiet" fullWidth onClick={onInfo}>Meer over deze plant</Button>
    </div>
  </div>;
}
