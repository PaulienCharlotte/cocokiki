import { INGREDIENTS } from '../../data/cooking/catalog';
import { NUTRIENTS } from '../../data/cooking/nutrients';
import React, { useRef, useState } from 'react';
import { Button, Dialog } from '../../design-system';
import type { IngredientEntry } from '../../data/cooking/types';
import { FOOD_TERMS_BY_ID, foodTextParts } from '../../data/cooking/foodGlossary';
import { PRODUCT_KNOWLEDGE } from '../../data/cooking/productKnowledge';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../../data/cooking/discovery';
import CookingAssetImage from '../cooking/CookingAssetImage';
import FoodIllustration from './FoodIllustration';
import './food-knowledge.css';

export function FoodText({ text, onTerm, exclude }: { text: string; onTerm: (id: string) => void; exclude?: string }) {
  return <>{foodTextParts(text).map((part, index) => part.termId && part.termId !== exclude
    ? <button type="button" className="food-word" key={index} aria-label={`Wat betekent ${part.text}?`} onClick={() => onTerm(part.termId!)}>{part.text}</button>
    : <React.Fragment key={index}>{part.text}</React.Fragment>)}</>;
}

export default function FoodKnowledgeDialog({ ingredient: initialIngredient, termId, onClose }: { ingredient?: IngredientEntry; termId?: string; onClose: () => void }) {
  const [ingredient, setIngredient] = useState(initialIngredient);
  const articleRef = useRef<HTMLDivElement>(null);
  const resetScroll = () => articleRef.current?.closest<HTMLElement>('.ck-dialog')?.scrollTo({ top: 0 });
  const chooseProduct = (product: IngredientEntry) => { setIngredient(product); setPath([]); setSection('product'); resetScroll(); };
  const [path, setPath] = useState<string[]>(termId ? [termId] : []);
  const [section, setSection] = useState<'product' | 'body' | 'kitchen' | 'explore'>('product');
  const current = path.at(-1);
  const term = current ? FOOD_TERMS_BY_ID[current] : undefined;
  const discovery = ingredient ? INGREDIENT_DISCOVERIES_BY_ID[ingredient.id] : undefined;
  const knowledge = ingredient ? PRODUCT_KNOWLEDGE[ingredient.id] : undefined;
  const root = ingredient?.name ?? (termId ? FOOD_TERMS_BY_ID[termId]?.title : undefined);
  const openTerm = (id: string) => { if (FOOD_TERMS_BY_ID[id] && id !== current) setPath(previous => [...previous, id]); };
  const back = () => setPath(previous => previous.slice(0, -1));
  const canBack = path.length > (ingredient ? 0 : termId ? 1 : 0);
  return <Dialog open={Boolean(ingredient || term)} title={term?.title ?? ingredient?.name ?? ''}
    description={term ? 'Een woord uitgelegd' : 'Ontdek het product'}
    onClose={canBack ? back : onClose}
    closeLabel={canBack ? 'Terug naar de vorige uitleg' : 'Sluiten'}
    primaryAction={<Button onClick={canBack ? back : onClose}>{canBack ? `Terug naar ${path.length > 1 ? FOOD_TERMS_BY_ID[path[path.length - 2]]?.title.toLowerCase() : root?.toLowerCase()}` : 'Klaar'}</Button>}
  >
    {term ? <div ref={articleRef} className="food-article">
      <FoodIllustration termId={term.id} />
      <p><strong><FoodText text={term.summary} onTerm={openTerm} exclude={term.id} /></strong></p>
      <p><FoodText text={term.explanation} onTerm={openTerm} exclude={term.id} /></p>
      <p><FoodText text={term.example} onTerm={openTerm} exclude={term.id} /></p>
      {INGREDIENTS.some(product => product.nutrientIds?.includes(term.id)) && <section className="food-explore"><h3>Waar vind je dit ook?</h3><div className="food-explore__products">{INGREDIENTS.filter(product => product.nutrientIds?.includes(term.id)).map(product => <button type="button" key={product.id} onClick={() => chooseProduct(product)}><CookingAssetImage src={product.image} alt="" /><span>{product.name}</span></button>)}</div></section>}
      <nav className="food-related" aria-label="Ontdek verder">{term.related.map(id => <Button key={id} variant="quiet" size="small" onClick={() => openTerm(id)}>{FOOD_TERMS_BY_ID[id]?.title}</Button>)}</nav>
    </div> : ingredient && <div ref={articleRef} className="food-article">
      <CookingAssetImage className="food-article__image" src={ingredient.image} alt={ingredient.name} />
      <nav className="food-sections" aria-label="Wat wil je over dit product weten?">
        {([{ id: 'product', label: 'Het product' }, { id: 'body', label: 'In je lichaam' }, { id: 'kitchen', label: 'In de keuken' }, { id: 'explore', label: 'Andere producten' }] as const).map(item => <Button key={item.id} variant={section === item.id ? 'secondary' : 'quiet'} size="small" aria-pressed={section === item.id} onClick={() => { setSection(item.id); resetScroll(); }}>{item.label}</Button>)}
      </nav>
      {section === 'product' && <>
        <p><FoodText text={discovery?.heroFact ?? ingredient.origin ?? ''} onTerm={openTerm} /></p>
        {discovery?.origin.text && <p><FoodText text={discovery.origin.text} onTerm={openTerm} /></p>}
        {ingredient.season && <p><strong>Wanneer vind je het?</strong> {ingredient.season}</p>}
        {ingredient.productionRegions.length > 0 && <p><strong>Waar komt het vandaan?</strong> {ingredient.productionRegions.join(', ')}</p>}
      </>}
      {section === 'body' && <>
        {knowledge ? <p><FoodText text={knowledge.body} onTerm={openTerm} /></p> : discovery?.nutrition.length ? discovery.nutrition.map(fact => <p key={fact.nutrient}><strong><FoodText text={fact.nutrient} onTerm={openTerm} /></strong> · <FoodText text={fact.role} onTerm={openTerm} /></p>) : <p>Dit ingrediënt gebruiken we vooral voor smaak of om iets te laten lukken bij het bakken. Niet elk ingrediënt is een belangrijke bron van voedingsstoffen.</p>}
        <p className="food-hint">Een onderstreept woord kun je aantikken voor uitleg.</p>
      </>}
      {section === 'kitchen' && <>
        <p><FoodText text={knowledge?.kitchen ?? discovery?.foodKnowledge.text ?? ingredient.facts.join(' ')} onTerm={openTerm} /></p>
        {knowledge && <p><strong>Probeer te ontdekken</strong><br /><FoodText text={knowledge.discover} onTerm={openTerm} /></p>}
      </>}
      {section === 'explore' && <section className="food-explore"><h3>Ontdek andere producten</h3><div className="food-explore__products">{INGREDIENTS.filter(product => product.contentStatus === 'ready' && product.id !== ingredient.id).map(product => <button type="button" key={product.id} onClick={() => chooseProduct(product)}><CookingAssetImage src={product.image} alt="" /><span>{product.name}</span></button>)}</div></section>}
      <section className="food-explore"><h3>Ontdek voedingsstoffen</h3><nav className="food-related" aria-label="Voedingsstoffen ontdekken">{NUTRIENTS.filter(nutrient => FOOD_TERMS_BY_ID[nutrient.id]).map(nutrient => <Button key={nutrient.id} variant="quiet" onClick={() => { openTerm(nutrient.id); resetScroll(); }}>{nutrient.name}</Button>)}</nav></section>
    </div>}
  </Dialog>;
}
