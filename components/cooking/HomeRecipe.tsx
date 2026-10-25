import React from 'react';
import { Download } from 'lucide-react';
import { EQUIPMENT_BY_ID } from '../../data/cooking/catalog';
import type { RecipeConfig } from '../../data/cooking/types';
export function HomeRecipeContent({ recipe }: { recipe: RecipeConfig }) {
  const home = recipe.homeRecipe;
  if (!home) return null;
  return <article className="home-recipe">
    <h2>{recipe.name}</h2><p>{home.introduction}</p>
    <p>{recipe.servings} {recipe.servings === 1 ? 'portie' : 'porties'} · ongeveer {recipe.preparationMinutes} minuten</p>
    <h3>Ingrediënten</h3><ul>{recipe.ingredients.map(item => <li key={item.ingredientId}>{item.displayAmount}</li>)}{home.optionalIngredients?.map(item => <li key={item}>Optioneel: {item}</li>)}</ul>
    <h3>Benodigdheden</h3><p>{[...recipe.equipmentIds.map(id => EQUIPMENT_BY_ID[id]?.name ?? id), ...(home.extraEquipment ?? [])].join(', ')}{recipe.ingredients.some(item => item.unit === 'gram') ? ', keukenweegschaal' : ''}{recipe.ingredients.some(item => item.unit === 'milliliter') ? ', maatbeker' : ''}</p>
    <h3>Bereiding</h3><ol>{home.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
    <h3>Veilig koken</h3><p>{home.safety}</p>
    <h3>Serveertip</h3><p>{home.servingTip}</p>
    <h3>Allergenen</h3><p>{home.allergens.join(' · ')}</p>
  </article>;
}
export default function HomeRecipe({ recipe }: { recipe: RecipeConfig }) {
  return <div className="home-recipe-section"><HomeRecipeContent recipe={recipe} /><a className="cooking-button" href={`/recipes/${recipe.id}.html`} download={`${recipe.id}.html`}><Download aria-hidden="true" />Download recept</a></div>;
}
