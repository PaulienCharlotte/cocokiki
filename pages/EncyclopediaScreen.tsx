import React, { useState } from 'react';
import { BookOpen, Leaf, Stamp } from 'lucide-react';
import CookingAssetImage from '../components/cooking/CookingAssetImage';
import { Button } from '../design-system';
import { INGREDIENTS } from '../data/cooking/catalog';
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

/**
 * Eén plantenpagina. Hoe meer je met de plant gedaan hebt, hoe meer er staat:
 * eerst waar hij vandaan komt, dan zijn verzorging, en bij de stempel ook de
 * EHBO-kaart met alles wat er mis kan gaan.
 */
function PlantPagina({ item }: { key?: React.Key; item: PlantKnowledge }) {
  const { species, level, diagnoses } = item;
  const product = plantProduct(species.id);
  return <article role="listitem" className={`encyclopedia-entry is-niveau-${level}`}>
    {product && <img src={product.image} alt="" />}
    <div>
      <h3>{species.commonName}</h3>
      <p>{species.origin}</p>
      <span className="encyclopedia-entry__niveau">
        {level === 3 ? <Stamp size={15} /> : <Leaf size={15} />}{KNOWLEDGE_LABEL[level]}
        {level < 3 && <small>{level === 2 ? `${diagnoses}/${STAMPS_NEEDED} herkend` : KNOWLEDGE_HINT[level]}</small>}
      </span>
      {level >= 2 && <dl className="encyclopedia-entry__feiten">
        <div><dt>Licht</dt><dd>{species.light}</dd></div>
        <div><dt>Water</dt><dd>{species.water}</dd></div>
        <div><dt>Hoe vaak</dt><dd>Om de {species.waterDays} dagen</dd></div>
      </dl>}
      <details><summary>Alles over {species.commonName.toLowerCase()}</summary>
        <p>{species.habitat}</p>
        <p>{species.funFact}</p>
        {level >= 3 ? <ul>
          {plantFirstAid(species.id).map(probleem => <li key={probleem.cause}>
            <strong>{PLANT_PROBLEM_LABEL[probleem.cause]}:</strong> {probleem.signs} {probleem.fix}
          </li>)}
        </ul> : <p><em>Verdien zijn stempel in het spreekuur om te zien wat er mis kan gaan.</em></p>}
      </details>
    </div>
  </article>;
}

export default function EncyclopediaScreen({ onNavigate }: EncyclopediaScreenProps) {
  const [progress] = useState(loadCookingProgress);
  const [planten] = useState(() => plantKnowledge());
  const collected = INGREDIENTS.filter(item => progress.discoveredIngredientIds.includes(item.id));
  const plantenOpen = planten.filter(item => item.level > 0);
  const plantenStand = knowledgeProgress(planten);

  return <main className="encyclopedia-screen" aria-labelledby="encyclopedia-title">
    <div className="encyclopedia-screen__backdrop" aria-hidden="true" />
    <section className="encyclopedia-collection">
      <header>
        <span aria-hidden="true"><BookOpen size={25} /></span>
        <div><small>Mijn verzameling</small><h1 id="encyclopedia-title">Mijn Encyclopedie</h1></div>
      </header>
      {collected.length ? <div className="encyclopedia-grid" role="list" aria-label={`${collected.length} ontdekte ingrediënten`}>
        {collected.map(item => <article key={item.id} role="listitem" className="encyclopedia-entry">
          <CookingAssetImage src={item.image} alt={item.name} />
          <div>
            <h2>{item.name}</h2>
            <p>{item.origin ?? 'Meer informatie volgt later.'}</p>
            {item.nutrients.length > 0 && <span><Leaf size={15} />{item.nutrients.join(' · ')}</span>}
            <details><summary>Alles over {item.name.toLowerCase()}</summary>
              <p>{INGREDIENT_DISCOVERIES_BY_ID[item.id]?.heroFact}</p>
              <p>{INGREDIENT_DISCOVERIES_BY_ID[item.id]?.origin.text}</p>
              {item.season && <p><strong>Seizoen:</strong> {item.season}</p>}
              {item.productionRegions.length > 0 && <p><strong>Groeit of wordt gemaakt in:</strong> {item.productionRegions.join(', ')}</p>}
              <ul>{INGREDIENT_DISCOVERIES_BY_ID[item.id]?.nutrition.map(fact => <li key={fact.nutrient}>{NUTRIENTS.find(nutrient => nutrient.name === fact.nutrient)?.bodyFunction ?? <><strong>{fact.nutrient}:</strong> {fact.role}</>}</li>)}
                {item.nutrientIds?.filter(id => !INGREDIENT_DISCOVERIES_BY_ID[item.id]?.nutrition.some(fact => fact.nutrient === NUTRIENTS_BY_ID[id]?.name)).map(id => NUTRIENTS_BY_ID[id] && <li key={id}>{NUTRIENTS_BY_ID[id].bodyFunction}</li>)}
              </ul>
              <p>{INGREDIENT_DISCOVERIES_BY_ID[item.id]?.foodKnowledge.text}</p>
            </details>
          </div>
        </article>)}
      </div> : <div className="encyclopedia-empty">
        <Leaf size={42} aria-hidden="true" />
        <h2>Nog geen ingrediënten ontdekt</h2>
        <p>Start een kookavontuur en verzamel ingrediënten tijdens de ontdekfase.</p>
        <Button size="large" onClick={() => onNavigate('/treehouse/cookbook')}>Naar Mijn Kookboek</Button>
      </div>}
    </section>

    <section className="encyclopedia-collection">
      <header>
        <span aria-hidden="true"><Leaf size={25} /></span>
        <div><small>{plantenStand.compleet} van {plantenStand.totaal} compleet</small><h2>Mijn Planten</h2></div>
      </header>
      {plantenOpen.length ? <div className="encyclopedia-grid" role="list" aria-label={`${plantenOpen.length} ontdekte planten`}>
        {plantenOpen.map(item => <PlantPagina key={item.species.id} item={item} />)}
      </div> : <div className="encyclopedia-empty">
        <Leaf size={42} aria-hidden="true" />
        <h2>Nog geen planten ontdekt</h2>
        <p>Koop een plant in de plantenwinkel, dan komt hij hier in je verzameling.</p>
        <Button size="large" onClick={() => onNavigate('/shop')}>Naar de winkel</Button>
      </div>}
    </section>
  </main>;
}
