import React from 'react';
import { Globe2, Leaf, Sparkles } from 'lucide-react';
import type { IngredientDiscoveryConfig, IngredientEntry } from '../../data/cooking/types';
import CookingAssetImage from './CookingAssetImage';

interface IngredientDiscoveryCardProps {
  config: IngredientDiscoveryConfig;
  ingredient: IngredientEntry;
}

export function NutritionFact({ nutrient, role }: { nutrient: string; role: string }) {
  return <li><span aria-hidden="true"><Sparkles /></span><p><strong>{nutrient}</strong><small>{role}</small></p></li>;
}

export default function IngredientDiscoveryCard({ config, ingredient }: IngredientDiscoveryCardProps) {
  return <div className="ingredient-lesson">
    <header className="ingredient-lesson__hero">
      <CookingAssetImage src={ingredient.image} alt={ingredient.name} />
      <div><p>Ingrediënt</p><h1 id="discovery-title">{ingredient.name}</h1><strong>{config.heroFact}</strong></div>
    </header>
    <div className="ingredient-lesson__sections">
      <section><span aria-hidden="true"><Globe2 /></span><div><h2>{config.origin.label}</h2><p>{config.origin.text}</p></div></section>
      <section className="ingredient-lesson__nutrition"><span aria-hidden="true"><Leaf /></span><div><h2>Voeding</h2><ul>{config.nutrition.map(item => <React.Fragment key={item.nutrient}><NutritionFact {...item} /></React.Fragment>)}</ul></div></section>
      <section><span aria-hidden="true"><Sparkles /></span><div><h2>{config.foodKnowledge.label}</h2><p>{config.foodKnowledge.text}</p></div></section>
    </div>
  </div>;
}
