import React, { useState } from 'react';
import { Leaf, Lock, Stamp } from 'lucide-react';
import CookingAssetImage from '../components/cooking/CookingAssetImage';
import { Button, Dialog } from '../design-system';
import { INGREDIENTS } from '../data/cooking/catalog';
import type { IngredientEntry } from '../data/cooking/types';
import { loadCookingProgress } from '../services/cookingProgress';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../data/cooking/discovery';
import { NUTRIENTS, NUTRIENTS_BY_ID } from '../data/cooking/nutrients';
import { plantProduct } from '../data/plants/species';
import { plantFirstAid, PLANT_PROBLEM_LABEL } from '../data/plants/firstAid';
import { KNOWLEDGE_HINT, KNOWLEDGE_LABEL, knowledgeProgress, plantKnowledge, type PlantKnowledge } from '../services/plantKnowledge';
import { STAMPS_NEEDED } from '../services/plantClinic';

interface EncyclopediaScreenProps {
  onNavigate: (path: string) => void;
}

type Afdeling = 'planten' | 'voeding';

/**
 * De encyclopedie is de plek waar alles samenkomt wat een kind geleerd heeft,
 * uit welk spel het ook komt. Daarom staat hij in het topmenu en niet in een
 * kamer, en daarom is de opzet hier bewust saai: één kaart, twee afdelingen,
 * een raster met tegels. Alle uitleg zit in een venster dat je zelf opent, dus
 * het overzicht blijft een overzicht.
 */
export default function EncyclopediaScreen({ onNavigate }: EncyclopediaScreenProps) {
  const [progress] = useState(loadCookingProgress);
  const [planten] = useState(() => plantKnowledge());
  const [afdeling, setAfdeling] = useState<Afdeling>('planten');
  const [openPlant, setOpenPlant] = useState<PlantKnowledge | null>(null);
  const [openEten, setOpenEten] = useState<IngredientEntry | null>(null);

  const ingredienten = INGREDIENTS.filter(item => progress.discoveredIngredientIds.includes(item.id));
  const stand = knowledgeProgress(planten);

  return <main className="encyclopedie" aria-labelledby="encyclopedie-titel">
    <section className="encyclopedie__kaart">
      <header className="encyclopedie__top">
        <div>
          <small>Alles wat je geleerd hebt</small>
          <h1 id="encyclopedie-titel">Encyclopedie</h1>
        </div>
      </header>

      <div className="encyclopedie__tabs" role="tablist" aria-label="Afdelingen">
        <Tab id="planten" actief={afdeling} op={setAfdeling} label="Planten" teller={`${stand.open}/${stand.totaal}`} />
        <Tab id="voeding" actief={afdeling} op={setAfdeling} label="Voeding" teller={`${ingredienten.length}/${INGREDIENTS.length}`} />
      </div>

      {afdeling === 'planten' ? <div
        className="encyclopedie__raster"
        role="tabpanel"
        id="afdeling-planten"
        aria-labelledby="tab-planten"
      >
        {planten.map(item => <PlantTegel key={item.species.id} item={item} op={() => setOpenPlant(item)} />)}
      </div> : ingredienten.length ? <div
        className="encyclopedie__raster"
        role="tabpanel"
        id="afdeling-voeding"
        aria-labelledby="tab-voeding"
      >
        {ingredienten.map(item => <button key={item.id} type="button" className="encyclopedie__tegel" onClick={() => setOpenEten(item)}>
          <CookingAssetImage src={item.image} alt="" />
          <strong>{item.name}</strong>
          <small>{item.nutrients[0] ?? 'Ontdekt'}</small>
        </button>)}
      </div> : <div className="encyclopedie__leeg" role="tabpanel" id="afdeling-voeding" aria-labelledby="tab-voeding">
        <Leaf size={38} aria-hidden="true" />
        <p>Nog niets ontdekt. Ga koken, dan vult deze afdeling zich.</p>
        <Button pill onClick={() => onNavigate('/treehouse/cookbook')}>Naar Mijn Kookboek</Button>
      </div>}
    </section>

    <Dialog
      open={openPlant !== null}
      title={openPlant ? openPlant.species.commonName : ''}
      description={openPlant ? KNOWLEDGE_LABEL[openPlant.level] : undefined}
      onClose={() => setOpenPlant(null)}
      primaryAction={<Button pill onClick={() => setOpenPlant(null)}>Klaar</Button>}
    >
      {openPlant && <PlantVenster item={openPlant} onNavigate={onNavigate} />}
    </Dialog>

    <Dialog
      open={openEten !== null}
      title={openEten ? openEten.name : ''}
      onClose={() => setOpenEten(null)}
      primaryAction={<Button pill onClick={() => setOpenEten(null)}>Klaar</Button>}
    >
      {openEten && <EtenVenster item={openEten} />}
    </Dialog>
  </main>;
}

function Tab({ id, actief, op, label, teller }: { id: Afdeling; actief: Afdeling; op: (waarde: Afdeling) => void; label: string; teller: string }) {
  const aan = actief === id;
  return <button
    type="button"
    role="tab"
    id={`tab-${id}`}
    aria-selected={aan}
    aria-controls={`afdeling-${id}`}
    className={`encyclopedie__tab${aan ? ' is-aan' : ''}`}
    onClick={() => op(id)}
  >{label}<small>{teller}</small></button>;
}

/**
 * Een tegel per soort, ook voor de planten die je nog niet hebt. Een leeg vakje
 * zegt zonder woorden dat er nog iets te halen valt, maar verklapt niets: geen
 * plaatje en geen naam zolang de plant onbekend is.
 */
function PlantTegel({ item, op }: { key?: React.Key; item: PlantKnowledge; op: () => void }) {
  const product = plantProduct(item.species.id);
  if (item.level === 0) return <div className="encyclopedie__tegel is-slot" aria-label="Nog niet ontdekt">
    <span aria-hidden="true"><Lock size={19} /></span>
  </div>;
  return <button type="button" className={`encyclopedie__tegel is-niveau-${item.level}`} onClick={op}>
    {product && <img src={product.image} alt="" />}
    <strong>{item.species.commonName}</strong>
    <small>{item.level === 3
      ? <><Stamp size={13} aria-hidden="true" />Compleet</>
      : item.level === 2 ? `${item.diagnoses}/${STAMPS_NEEDED} herkend`
      : KNOWLEDGE_LABEL[item.level]}</small>
  </button>;
}

/** Wat je over een plant te zien krijgt groeit mee met wat je ermee gedaan hebt. */
function PlantVenster({ item, onNavigate }: { item: PlantKnowledge; onNavigate: (path: string) => void }) {
  const { species, level } = item;
  const product = plantProduct(species.id);
  return <div className="plantpagina">
    {product && <img className="plantpagina__plant" src={product.image} alt="" />}
    <p className="plantpagina__latijn">{species.scientificName}</p>
    <p>{species.origin}</p>

    {level >= 2 ? <dl className="plantpagina__feiten">
      <div><dt>Licht</dt><dd>{species.light}</dd></div>
      <div><dt>Water</dt><dd>{species.water}</dd></div>
      <div><dt>Hoe vaak</dt><dd>Om de {species.waterDays} dagen</dd></div>
    </dl> : <p className="plantpagina__volgende">{KNOWLEDGE_HINT[level]}</p>}

    {level >= 2 && <>
      <p>{species.habitat}</p>
      <p>{species.funFact}</p>
    </>}

    {level >= 3 ? <ul className="plantpagina__ehbo">
      {plantFirstAid(species.id).map(probleem => <li key={probleem.cause}>
        <strong>{PLANT_PROBLEM_LABEL[probleem.cause]}</strong>
        <span>{probleem.signs} {probleem.fix}</span>
      </li>)}
    </ul> : level === 2 && <p className="plantpagina__volgende">
      {KNOWLEDGE_HINT[2]}
      <Button variant="quiet" size="small" pill onClick={() => onNavigate('/plantendokter')}>Naar het spreekuur</Button>
    </p>}
  </div>;
}

/** Hetzelfde venster voor een ingrediënt, zodat beide afdelingen gelijk aanvoelen. */
function EtenVenster({ item }: { item: IngredientEntry }) {
  const ontdekking = INGREDIENT_DISCOVERIES_BY_ID[item.id];
  const stoffen = ontdekking?.nutrition.map(fact => NUTRIENTS.find(nutrient => nutrient.name === fact.nutrient)?.bodyFunction ?? `${fact.nutrient}: ${fact.role}`) ?? [];
  const extra = item.nutrientIds?.filter(id => !ontdekking?.nutrition.some(fact => fact.nutrient === NUTRIENTS_BY_ID[id]?.name)).map(id => NUTRIENTS_BY_ID[id]?.bodyFunction).filter(Boolean) ?? [];
  return <div className="plantpagina">
    <CookingAssetImage className="plantpagina__plant" src={item.image} alt="" />
    <p>{ontdekking?.heroFact ?? item.origin ?? 'Meer informatie volgt later.'}</p>
    <p>{ontdekking?.origin.text}</p>
    <dl className="plantpagina__feiten">
      {item.season && <div><dt>Seizoen</dt><dd>{item.season}</dd></div>}
      {item.productionRegions.length > 0 && <div><dt>Groeit in</dt><dd>{item.productionRegions.join(', ')}</dd></div>}
    </dl>
    {[...stoffen, ...extra].length > 0 && <ul className="plantpagina__ehbo">
      {[...stoffen, ...extra].map(regel => <li key={String(regel)}><span>{regel}</span></li>)}
    </ul>}
    {ontdekking?.foodKnowledge.text && <p>{ontdekking.foodKnowledge.text}</p>}
  </div>;
}
