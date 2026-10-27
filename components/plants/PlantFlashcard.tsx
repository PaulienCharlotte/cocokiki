import React, { useState } from 'react';
import { CircleCheck, CloudMoon, Droplets, Snowflake, Sun, Wind, X } from 'lucide-react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { PLANT_SPECIES_BY_ID, plantProduct } from '../../data/plants/species';
import { plantFirstAid, PLANT_PROBLEM_LABEL, type PlantProblemCause } from '../../data/plants/firstAid';
import DecorAsset from '../shop/DecorAsset';

interface PlantFlashcardProps {
  speciesId: string | null;
  /** De bijnaam van een geadopteerde plant; in de winkel leeg. */
  nickname?: string;
  onClose: () => void;
}

/** Een eigen tekentje per oorzaak, zodat je het probleem al aan het plaatje ziet. */
const PROBLEM_ICON: Record<PlantProblemCause, React.ReactNode> = {
  'te-weinig-water': <Droplets />,
  'te-veel-water': <Droplets />,
  'te-veel-zon': <Sun />,
  'te-weinig-licht': <CloudMoon />,
  'droge-lucht': <Wind />,
  'te-koud': <Snowflake />,
};

/**
 * Eén regel op de kaart. Beide tabbladen gebruiken dezelfde opbouw, zodat de
 * kaart hetzelfde aanvoelt en alleen de inhoud verandert.
 */
interface CardRowProps {
  key?: React.Key;
  icon: React.ReactNode;
  tone?: string;
  title: string;
  children: React.ReactNode;
}

function CardRow({ icon, tone, title, children }: CardRowProps) {
  return <li className={`plant-card__row${tone ? ` is-${tone}` : ''}`}>
    <span className="plant-card__row-icon" aria-hidden="true">{icon}</span>
    <div><strong>{title}</strong>{children}</div>
  </li>;
}

/** Kiki hoort op elk tabblad; zij is de gids van de plantenwereld. */
function KikiSays({ pose, children }: { pose: string; children: React.ReactNode }) {
  return <aside className="plant-card__kiki">
    <img src={pose} alt="" />
    <p><strong>Kiki zegt</strong>{children}</p>
  </aside>;
}

/** De leerkaart bij een plant: waar hij vandaan komt, en wat je doet als het misgaat. */
export default function PlantFlashcard({ speciesId, nickname, onClose }: PlantFlashcardProps) {
  const [tab, setTab] = useState<'over' | 'ehbo'>('over');
  const species = speciesId ? PLANT_SPECIES_BY_ID[speciesId] : undefined;
  const product = speciesId ? plantProduct(speciesId) : undefined;
  if (!species || !product) return null;
  const problems = plantFirstAid(species.id);
  const grootste = problems[0];

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

      {problems.length > 0 && <div className="plant-card__tabs" role="tablist" aria-label="Wat wil je weten?">
        <button type="button" role="tab" id="plant-tab-over" aria-selected={tab === 'over'} aria-controls="plant-panel-over" className={tab === 'over' ? 'is-active' : undefined} onClick={() => setTab('over')}>Over deze plant</button>
        <button type="button" role="tab" id="plant-tab-ehbo" aria-selected={tab === 'ehbo'} aria-controls="plant-panel-ehbo" className={tab === 'ehbo' ? 'is-active' : undefined} onClick={() => setTab('ehbo')}>Help, wat is er?</button>
      </div>}

      {tab === 'over' ? <div id="plant-panel-over" role="tabpanel" aria-labelledby="plant-tab-over">
        <dl className="plant-card__feiten">
          <div><dt>Waar vandaan</dt><dd>{species.origin}</dd></div>
          <div><dt>Hoe hij groeit</dt><dd>{species.habitat}</dd></div>
          <div><dt>Licht</dt><dd>{species.light}</dd></div>
          <div><dt>Water</dt><dd>{species.water}</dd></div>
          <div><dt>Wist je dat?</dt><dd>{species.funFact}</dd></div>
        </dl>
        <KikiSays pose={ASSET_LIBRARY.avatars.kikiPoses.tip}>{species.kikiTip}</KikiSays>
      </div> : <div id="plant-panel-ehbo" role="tabpanel" aria-labelledby="plant-tab-ehbo">
        <p className="plant-card__intro">Gaat het niet goed met je plant? Zoek op wat je ziet. Bovenaan staat wat bij deze soort het vaakst misgaat.</p>
        <ul className="plant-card__rows">
          {problems.map(problem => <CardRow
            key={problem.cause}
            icon={PROBLEM_ICON[problem.cause]}
            tone={problem.cause}
            title={PLANT_PROBLEM_LABEL[problem.cause]}
          >
            <p>{problem.signs}</p>
            <p className="plant-card__fix"><CircleCheck aria-hidden="true" /><span className="sr-only">Doen: </span>{problem.fix}</p>
          </CardRow>)}
        </ul>
        {grootste && <KikiSays pose={ASSET_LIBRARY.avatars.kikiPoses.worried}>
          Bij een {species.commonName.toLowerCase()} gaat het meestal mis door {PLANT_PROBLEM_LABEL[grootste.cause].toLowerCase()}. Dat staat bovenaan: kijk daar als eerste.
        </KikiSays>}
      </div>}
    </section>
  </div>;
}
