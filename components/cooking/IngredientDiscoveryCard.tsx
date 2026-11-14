import React, { useState } from 'react';
import FoodKnowledgeDialog, { FoodText } from '../food/FoodKnowledge';
import { ArrowLeft } from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import SpeechBubble from '../ui/SpeechBubble';
import FoodIllustration from '../food/FoodIllustration';
import { foodTextParts } from '../../data/cooking/foodGlossary';
import type { IngredientDiscoveryConfig, IngredientEntry } from '../../data/cooking/types';
import CookingAssetImage from './CookingAssetImage';
import './ingredient-discovery.css';

interface IngredientDiscoveryCardProps {
  key?: string;
  config: IngredientDiscoveryConfig;
  ingredient: IngredientEntry;
  onReady?: () => void;
  initialPage?: 0 | 1 | 2;
}

export default function IngredientDiscoveryCard({ config, ingredient, onReady, initialPage = 0 }: IngredientDiscoveryCardProps) {
  const [page, setPage] = useState<number>(initialPage);
  const [term, setTerm] = useState<string | null>(null);
  const nutritionTerm = config.nutrition.flatMap(item => foodTextParts(item.nutrient)).find(part => part.termId)?.termId;
  const labels = [config.origin.label, 'In je lichaam', config.foodKnowledge.label];
  return <div className="ingredient-explorer">
    <header className="ingredient-lesson__hero">
      <CookingAssetImage src={ingredient.image} alt={ingredient.name} />
      <div><p>Ontdek het ingrediënt</p><h1 id="discovery-title">{ingredient.name}</h1></div>
    </header>
    <div className="ingredient-explorer__dots" aria-label={`Ontdekking ${page + 1} van 3`}>{labels.map((label, index) => <span key={index} className={index === page ? 'is-current' : ''} title={label} />)}</div>
    <div className="ingredient-explorer__page" key={page}>
      {page === 1 && nutritionTerm && <FoodIllustration termId={nutritionTerm} caption={false} />}
      <SpeechBubble character="coco" label={labels[page]}>
        {page === 0 ? <FoodText text={config.origin.text} onTerm={setTerm} /> : page === 2 ? <FoodText text={config.foodKnowledge.text} onTerm={setTerm} /> : config.nutrition.length ? config.nutrition.map(item => <span className="ingredient-explorer__fact" key={item.nutrient}><strong><FoodText text={item.nutrient} onTerm={setTerm} /></strong><br /><FoodText text={item.role} onTerm={setTerm} /></span>) : 'Dit ingrediënt gebruiken we vooral voor smaak of om het bakken te laten lukken.'}
      </SpeechBubble>
    </div>
    <div className="ingredient-explorer__actions">
      {page > 0 && <IconButton label="Vorige ontdekking" icon={<ArrowLeft size={16} />} onClick={() => setPage(page - 1)} />}
      <Button size="large" onClick={() => page < 2 ? setPage(page + 1) : onReady?.()}>{page === 0 ? 'Ontdek de voeding' : page === 1 ? 'Ontdek de keukentip' : 'Probeer de vragen'}</Button>
    </div>
    {term && <FoodKnowledgeDialog termId={term} onClose={() => setTerm(null)} />}
  </div>;
}
