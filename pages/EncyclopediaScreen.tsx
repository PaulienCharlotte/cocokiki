import React, { useState } from 'react';
import { BookOpen, Leaf } from 'lucide-react';
import CookingAssetImage from '../components/cooking/CookingAssetImage';
import { Button } from '../design-system';
import { INGREDIENTS } from '../data/cooking/catalog';
import { loadCookingProgress } from '../services/cookingProgress';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../data/cooking/discovery';
import { NUTRIENTS, NUTRIENTS_BY_ID } from '../data/cooking/nutrients';

interface EncyclopediaScreenProps {
  onNavigate: (path: string) => void;
}

export default function EncyclopediaScreen({ onNavigate }: EncyclopediaScreenProps) {
  const [progress] = useState(loadCookingProgress);
  const collected = INGREDIENTS.filter(item => progress.discoveredIngredientIds.includes(item.id));

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
  </main>;
}
