import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct } from '../../data/plants/species';
import { MAX_NICKNAME_LENGTH, type AdoptedPlant } from '../../services/plantFamily';
import DecorAsset from '../shop/DecorAsset';

interface PlantAdoptionDialogProps {
  /** De zojuist gekochte planten; ze krijgen één voor één een naam. */
  plants: AdoptedPlant[];
  onName: (id: string, nickname: string) => void;
  onDone: () => void;
}

/** Kiki vraagt hoe de nieuwe plant gaat heten. Overslaan mag altijd. */
export default function PlantAdoptionDialog({ plants, onName, onDone }: PlantAdoptionDialogProps) {
  const [index, setIndex] = useState(0);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const plant = plants[index];

  useEffect(() => { setName(''); inputRef.current?.focus(); }, [plant?.id]);

  if (!plant) return null;
  const species = PLANT_SPECIES_BY_ID[plant.speciesId];
  const product = plantProduct(plant.speciesId);
  if (!species || !product) return null;

  const verder = () => {
    if (name.trim()) onName(plant.id, name);
    if (index + 1 < plants.length) setIndex(index + 1);
    else onDone();
  };

  return <div className="plant-card-backdrop" role="presentation">
    <section className="plant-adopt" role="dialog" aria-modal="true" aria-labelledby="plant-adopt-title">
      <img className="plant-adopt__kiki" src={ASSET_LIBRARY.avatars.kikiPoses.plant} alt="" />
      <h2 id="plant-adopt-title">Jeeee! Een nieuwe plant!</h2>
      <p>Hoe zullen we hem noemen?</p>

      <div className="plant-adopt__plant">
        <DecorAsset product={product} />
        <small>{species.commonName}</small>
      </div>

      <form onSubmit={event => { event.preventDefault(); verder(); }}>
        <label className="plant-adopt__field">
          <span>Naam van je plant</span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            maxLength={MAX_NICKNAME_LENGTH}
            placeholder="Bijvoorbeeld Henk"
            onChange={event => setName(event.target.value)}
          />
        </label>
        <div className="plant-adopt__actions">
          <button type="submit" className="plant-adopt__confirm"><Check aria-hidden="true" />{name.trim() ? 'Zo gaat hij heten' : 'Later een naam kiezen'}</button>
        </div>
      </form>

      {plants.length > 1 && <small className="plant-adopt__counter">Plant {index + 1} van {plants.length}</small>}
    </section>
  </div>;
}
