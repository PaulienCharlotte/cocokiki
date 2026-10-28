import React from 'react';
import { Button, Dialog } from '../../design-system';
import { PLANT_ICOON, PLANT_SPECIES_BY_ID, plantProduct, type PlantSpecies } from '../../data/plants/species';
import DecorAsset from '../shop/DecorAsset';
import { levelFor } from '../../services/plantKnowledge';
import { reconcilePlantFamily } from '../../services/plantFamily';
import { loadClinic } from '../../services/plantClinic';

interface PlantFlashcardProps {
  speciesId: string | null;
  /** De bijnaam van een geadopteerde plant; in de winkel leeg. */
  nickname?: string;
  /** Zonder deze prop laadt de encyclopedie als gewone pagina. */
  onNavigate?: (path: string) => void;
  onClose: () => void;
}

/**
 * De drie dingen die een plant van je vraagt, elk met zijn eigen tekening:
 * de zon voor licht, de gieter voor water, de aarde voor hoe vaak.
 */
function verzorging(species: PlantSpecies) {
  return [
    { label: 'Licht', icoon: PLANT_ICOON.zon, tekst: species.light },
    { label: 'Water', icoon: PLANT_ICOON.gieter, tekst: species.water },
    { label: 'Hoe vaak', icoon: PLANT_ICOON.aarde, tekst: `Om de ${species.waterDays} dagen een beetje water` },
  ];
}

/**
 * De verzorgkaart: hoe heet deze plant, en wat heeft hij nodig.
 *
 * Meer dan dat staat er bewust niet op. Waar hij vandaan komt, hoe hij groeit
 * en wat er mis kan gaan hoort in de encyclopedie, net als bij de
 * voedingsstoffen — één plek waar alles verzameld wordt, in plaats van
 * dezelfde uitleg in de winkel, in je voorraad en bij je eigen planten.
 */
export default function PlantFlashcard({ speciesId, nickname, onNavigate, onClose }: PlantFlashcardProps) {
  const species = speciesId ? PLANT_SPECIES_BY_ID[speciesId] : undefined;
  const product = speciesId ? plantProduct(speciesId) : undefined;
  if (!species || !product) return null;

  // Alleen doorverwijzen naar een pagina die al bestaat: een plant die je nog
  // niet ontdekt hebt staat in de encyclopedie nog als leeg vakje.
  const ontdekt = levelFor(species.id, reconcilePlantFamily(), loadClinic()) > 0;

  return <Dialog
    className="verzorgkaart"
    open
    title={species.commonName}
    description={nickname ? `Jouw ${species.commonName.toLowerCase()} heet ${nickname}` : species.scientificName}
    illustration={<DecorAsset product={product} className="verzorgkaart__plant" />}
    onClose={onClose}
    primaryAction={<Button pill onClick={onClose}>Klaar</Button>}
    secondaryAction={ontdekt
      ? <Button variant="quiet" pill onClick={() => {
          const pad = `/encyclopedie?plant=${species.id}`;
          if (onNavigate) onNavigate(pad); else window.location.assign(pad);
        }}>Alles over deze plant</Button>
      : undefined}
  >
    <ul className="verzorgkaart__feiten">
      {verzorging(species).map(regel => <li key={regel.label}>
        <img src={regel.icoon} alt="" />
        <div><strong>{regel.label}</strong><span>{regel.tekst}</span></div>
      </li>)}
    </ul>
  </Dialog>;
}
