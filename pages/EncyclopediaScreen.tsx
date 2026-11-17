import { TRAVEL_ADVENTURES } from '../data/travel/adventures';
import { loadTravelAdventures, startTravelAdventure } from '../services/travelAdventures';
import { studyLocations } from '../data/learning';
import { loadCakeOrder } from '../services/cakeOrder';
import { MapPin } from 'lucide-react';
import { discoveredPlaces } from '../services/travelKnowledge';
import { locationFact } from '../data/topography/facts';
import type { Location } from '../types';
import { completedTasks, taskCollection } from '../services/completedTasks';
import InfoKnop from '../components/ui/InfoKnop';
import './encyclopedie.css';
import FoodKnowledgeDialog from '../components/food/FoodKnowledge';
import { FOOD_LESSONS } from '../data/cooking/foodLessons';
import { loadFoodKnowledge } from '../services/foodKnowledge';
import React, { useState } from 'react';
import { CakeSlice, Leaf, Lock, Stamp, Trash2 } from 'lucide-react';
import CookingAssetImage from '../components/cooking/CookingAssetImage';
import { Button, Dialog } from '../design-system';
import { INGREDIENTS, RECIPES } from '../data/cooking/catalog';
import type { IngredientEntry } from '../data/cooking/types';
import { loadCookingProgress } from '../services/cookingProgress';
import { plantProduct } from '../data/plants/species';
import { plantFirstAid, PLANT_PROBLEM_LABEL } from '../data/plants/firstAid';
import { KNOWLEDGE_HINT, KNOWLEDGE_LABEL, knowledgeProgress, plantKnowledge, type PlantKnowledge } from '../services/plantKnowledge';
import { STAMPS_NEEDED } from '../services/plantClinic';
import { laadGalerij, verwijderUitGalerij, type BewaardeTaart } from '../services/cakeStudio';
import { GARDEN_CROPS, type GardenCrop } from '../data/plants/garden';
import { loadGarden } from '../services/garden';
import GardenCropFacts from '../components/plants/GardenCropFacts';

interface EncyclopediaScreenProps { onNavigate: (path: string) => void }
type Afdeling = 'opdrachten' | 'planten' | 'voeding' | 'taarten' | 'moestuin' | 'plekken' | 'recepten';
interface Goal { title: string; description: string; path?: string; travelId?: string; label?: string }

export default function EncyclopediaScreen({ onNavigate }: EncyclopediaScreenProps) {
  const [finished] = useState(completedTasks);
  const [goals] = useState(taskCollection);
  const [garden] = useState(loadGarden);
  const [progress] = useState(loadCookingProgress);
  const [foodKnowledge] = useState(loadFoodKnowledge);
  const [planten] = useState(() => plantKnowledge());
  const [places] = useState(discoveredPlaces);
  const [travel] = useState(loadTravelAdventures);
  const [cakeOrder] = useState(loadCakeOrder);
  const [taarten, setTaarten] = useState<BewaardeTaart[]>(laadGalerij);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [notice, setNotice] = useState('');
  const [openTrip, setOpenTrip] = useState<(typeof TRAVEL_ADVENTURES)[number] | null>(null);
  const [openCrop, setOpenCrop] = useState<GardenCrop | null>(null);
  const [openEten, setOpenEten] = useState<IngredientEntry | null>(null);
  const [openPlace, setOpenPlace] = useState<Location | null>(null);
  const [openPlant, setOpenPlant] = useState<PlantKnowledge | null>(() => {
    const id = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('plant');
    return planten.find(item => item.species.id === id && item.level > 0) ?? null;
  });
  const [afdeling, setAfdeling] = useState<Afdeling>(() => {
    const tab = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('tab');
    return ['opdrachten', 'planten', 'voeding', 'taarten', 'moestuin', 'plekken', 'recepten'].includes(tab ?? '') ? tab as Afdeling : 'planten';
  });
  const chapter = afdeling === 'planten' || afdeling === 'moestuin' ? 'tuin' : afdeling === 'voeding' || afdeling === 'taarten' || afdeling === 'recepten' ? 'keuken' : afdeling === 'plekken' ? 'wereld' : 'school';
  const stand = knowledgeProgress(planten);
  const ingredienten = INGREDIENTS.filter(item => progress.discoveredIngredientIds.includes(item.id));
  const recipes = RECIPES.filter(recipe => recipe.contentStatus === 'ready');
  const madeRecipes = recipes.filter(recipe => progress.completions[recipe.id]);
  const tripsDone = TRAVEL_ADVENTURES.filter(item => travel.completed[item.id]).length;
  const beginTrip = (id: string) => {
    if (!startTravelAdventure(id)) { setNotice('Bewaren lukte niet. Probeer opnieuw.'); return; }
    onNavigate(`/games/topo?avontuur=${encodeURIComponent(id)}&from=seb`);
  };
  const closeGoal = () => { setGoal(null); setNotice(''); };
  const tab = (id: Afdeling, label: string, count: string) => <Tab id={id} actief={afdeling} op={setAfdeling} label={label} teller={count} />;

  return <main className="encyclopedie" data-wereld={chapter} aria-labelledby="encyclopedie-titel">
    <section className="encyclopedie__kaart ck-paper-surface">
      <header className="encyclopedie__top"><h1 id="encyclopedie-titel">Encyclopedie</h1><InfoKnop titel="Mijn encyclopedie">Je ziet alvast wat je kunt verzamelen. Een doorzichtig plaatje met een slotje is je volgende doel. Tik erop om te ontdekken hoe je de pagina verdient.</InfoKnop></header>
      <nav className="encyclopedie__chapters" aria-label="Eilanden in je encyclopedie">
        {([{ id: 'tuin', label: 'Planteneiland', tab: 'planten', image: '/assets/library/plants/garden/navigation.webp' }, { id: 'keuken', label: 'Kookeiland', tab: 'voeding', image: '/games/treehouse/cookbook-cta.webp' }, { id: 'wereld', label: 'Reiseiland', tab: 'plekken', image: '/games/school/topo-cta.webp' }, { id: 'school', label: 'Mijn projecten', tab: 'opdrachten', image: '/assets/library/projects/luna-crib.webp' }] as const).map(item => <button type="button" className="ck-knop" data-wereld={item.id} key={item.id} aria-pressed={chapter === item.id} onClick={() => setAfdeling(item.tab)}><img src={item.image} alt="" />{item.label}</button>)}
      </nav>
      <div className="encyclopedie__tabs" role="tablist" aria-label="Verzamelingen op dit eiland">
        {chapter === 'tuin' && <>{tab('planten', 'Verzorgde planten', `${stand.open}/${stand.totaal}`)}{tab('moestuin', 'Mijn oogst', `${garden.discovered.length}/${GARDEN_CROPS.length}`)}</>}
        {chapter === 'keuken' && <>{tab('voeding', 'Ingrediënten', `${ingredienten.length}/${INGREDIENTS.length}`)}{tab('recepten', 'Gemaakte recepten', `${madeRecipes.length}/${recipes.length}`)}{tab('taarten', 'Mijn taarten', `${taarten.length}`)}</>}
        {chapter === 'wereld' && tab('plekken', 'Mijn reizen', `${tripsDone}/${TRAVEL_ADVENTURES.length}`)}
        {chapter === 'school' && tab('opdrachten', 'Afgeronde opdrachten', `${finished.length}/${goals.length}`)}
      </div>
      <div role="tabpanel" id={`afdeling-${afdeling}`} aria-labelledby={`tab-${afdeling}`}>
        {afdeling === 'planten' && <div className="encyclopedie__raster">{planten.map(item => item.level === 0 ? <GoalTile key={item.species.id} title={item.species.commonName} image={plantProduct(item.species.id)?.image} onOpen={() => setGoal({ title: item.species.commonName, description: 'Haal deze plant in huis en leer hem verzorgen. Zo groeit zijn pagina met je mee.', path: '/shop/plants', label: 'Bekijk planten' })} /> : <PlantTegel key={item.species.id} item={item} op={() => setOpenPlant(item)} />)}</div>}
        {afdeling === 'moestuin' && <><div className="encyclopedie__raster">{GARDEN_CROPS.map(crop => garden.discovered.includes(crop.id) ? <button key={crop.id} type="button" className="encyclopedie__tegel" onClick={() => setOpenCrop(crop)}><img src={crop.image} alt="" /><strong>{crop.name}</strong><small>Zelf geoogst</small></button> : <GoalTile key={crop.id} title={crop.name} image={crop.image} onOpen={() => setGoal({ title: crop.name, description: `Zaai en verzorg ${crop.name.toLowerCase()} in je moestuin. Na je eerste oogst komt deze pagina tot leven.`, path: '/plants/garden', label: 'Ga tuinieren' })} />)}</div><Button variant="quiet" onClick={() => onNavigate('/plants/garden')}>Naar mijn moestuin</Button></>}
        {afdeling === 'voeding' && <><Button variant="secondary" onClick={() => onNavigate('/cooking/discover')}>Ontdek je eten · {foodKnowledge.length}/{FOOD_LESSONS.length} ontdekt</Button><div className="encyclopedie__raster">{INGREDIENTS.map(item => progress.discoveredIngredientIds.includes(item.id) ? <button key={item.id} type="button" className="encyclopedie__tegel" onClick={() => setOpenEten(item)}><CookingAssetImage src={item.image} alt="" /><strong>{item.name}</strong><small>{item.nutrients[0] ?? 'Ontdekt'}</small></button> : <GoalTile key={item.id} title={item.name} image={item.image} onOpen={() => setGoal({ title: item.name, description: 'Ontdek dit ingrediënt tijdens het maken van een recept. Daarna bewaar je hier wat je hebt geleerd.', path: '/treehouse/cookbook', label: 'Open het kookboek' })} />)}</div></>}
        {afdeling === 'recepten' && <div className="encyclopedie__raster">{recipes.map(recipe => progress.completions[recipe.id] ? <button type="button" className="encyclopedie__tegel" key={recipe.id} onClick={() => onNavigate(`/treehouse/cookbook?recipe=${encodeURIComponent(recipe.id)}`)}><CookingAssetImage src={recipe.image} alt="" /><strong>{recipe.name}</strong><small>Zelf gemaakt</small></button> : <GoalTile key={recipe.id} title={recipe.name} image={recipe.image} hint={recipe.homeOnly ? 'Recept voor thuis' : 'Nog te maken'} onOpen={() => setGoal({ title: recipe.name, description: recipe.homeOnly ? 'Dit recept kun je thuis maken. Je kunt het nu al in het kookboek bekijken.' : 'Maak dit recept in de kookstudio om je verzameling aan te vullen.', path: `/treehouse/cookbook?recipe=${encodeURIComponent(recipe.id)}`, label: 'Bekijk het recept' })} />)}</div>}
        {afdeling === 'taarten' && <div className="encyclopedie__raster">{!cakeOrder.delivered ? <GoalTile title="Sebs verjaardagstaart" image="/assets/library/cooking/taarten/roze-rand.webp" hint="Help Seb" onOpen={() => setGoal({ title: 'Sebs verjaardagstaart', description: 'Maak de verjaardagstaart voor Seb af. Je eigen bewaarde ontwerpen krijgen hier ook een plek.', path: '/opdrachten?gebied=bakken', label: 'Bekijk opdrachten' })} /> : <figure className="encyclopedie__tegel"><img src="/assets/library/cooking/taarten/roze-rand.webp" alt="" /><strong>Sebs verjaardagstaart</strong><small>Afgeleverd</small></figure>}{taarten.map(taart => <figure key={taart.id} className="encyclopedie__taart"><img src={taart.beeld} alt={taart.naam} /><figcaption>{taart.naam}</figcaption><button type="button" aria-label={`${taart.naam} weghalen`} onClick={() => { verwijderUitGalerij(taart.id); setTaarten(laadGalerij()); }}><Trash2 size={16} aria-hidden="true" /></button></figure>)}</div>}
        {afdeling === 'opdrachten' && <div className="encyclopedie__raster encyclopedie__opdrachten">{goals.map(task => task.completed ? <button type="button" key={task.id} className="encyclopedie__tegel" onClick={() => setGoal({ title: task.title, description: task.description })}><img src={task.image} alt="" /><strong>{task.title}</strong><small>Afgerond</small></button> : <GoalTile key={task.id} title={task.title} image={task.image} hint="Nog te helpen" onOpen={() => setGoal({ title: task.title, description: task.description, path: task.path, label: 'Bekijk opdrachten' })} />)}</div>}
        {afdeling === 'plekken' && <><div className="encyclopedie__raster">{TRAVEL_ADVENTURES.map(adventure => travel.completed[adventure.id] ? <button type="button" className="encyclopedie__tegel" key={adventure.id} onClick={() => setOpenTrip(adventure)}><img src={adventure.image} alt="" /><strong>{adventure.areaName}</strong><small>Een 10 met Seb</small></button> : <GoalTile key={adventure.id} title={adventure.areaName} image={adventure.image} hint="Haal een 10 met Seb" onOpen={() => setGoal({ title: adventure.title, description: `${adventure.description} Je verdient ${adventure.reward} extra CocoCoins, boven op je oefenmunten.`, travelId: adventure.id, label: 'Help Seb' })} />)}</div>{places.length > 0 && <details className="encyclopedie__kaartweetjes"><summary>Weetjes uit het oefenen · {places.length}</summary><div className="encyclopedie__raster">{places.map(place => <button type="button" className="encyclopedie__tegel" key={place.id} onClick={() => setOpenPlace(place)}><MapPin aria-hidden="true" /><strong>{place.name}</strong><small>Ontdekt op de kaart</small></button>)}</div></details>}</>}
      </div>
    </section>
    <Dialog open={Boolean(goal)} title={goal?.title ?? ''} onClose={closeGoal} primaryAction={<Button onClick={() => { if (goal?.travelId) beginTrip(goal.travelId); else if (goal?.path) onNavigate(goal.path); else closeGoal(); }}>{goal?.label ?? 'Klaar'}</Button>}><p>{goal?.description}</p>{notice && <p role="alert">{notice}</p>}</Dialog>
    <Dialog open={Boolean(openTrip)} title={openTrip?.areaName ?? ''} onClose={() => setOpenTrip(null)} primaryAction={<Button onClick={() => openTrip && beginTrip(openTrip.id)}>Bekijk de kaart</Button>}>{openTrip && <><p>Je hebt Seb geholpen en de volledige toets met een 10 afgerond.</p><nav className="encyclopedie__reisplaatsen" aria-label="Plekken op deze reis">{studyLocations(openTrip.selection).map(place => <Button key={place.id} variant="quiet" onClick={() => { setOpenTrip(null); setOpenPlace(place); }}>{place.name}</Button>)}</nav></>}</Dialog>
    <Dialog open={Boolean(openPlace)} title={openPlace?.name ?? ''} primaryAction={null} onClose={() => setOpenPlace(null)}>{openPlace && <p>{locationFact(openPlace).fact}</p>}</Dialog>
    <Dialog open={openPlant !== null} title={openPlant?.species.commonName ?? ''} description={openPlant ? KNOWLEDGE_LABEL[openPlant.level] : undefined} onClose={() => setOpenPlant(null)} primaryAction={<Button pill onClick={() => setOpenPlant(null)}>Klaar</Button>}>{openPlant && <PlantVenster item={openPlant} onNavigate={onNavigate} />}</Dialog>
    {openEten && <FoodKnowledgeDialog ingredient={openEten} onClose={() => setOpenEten(null)} />}
    <Dialog primaryAction={null} open={Boolean(openCrop)} title={openCrop?.name ?? ''} onClose={() => setOpenCrop(null)}>{openCrop && <GardenCropFacts crop={openCrop} />}</Dialog>
  </main>;
}
function Tab({ id, actief, op, label, teller }: { id: Afdeling; actief: Afdeling; op: (value: Afdeling) => void; label: string; teller: string }) {
  return <button type="button" role="tab" id={`tab-${id}`} aria-selected={actief === id} aria-controls={`afdeling-${id}`} className={`encyclopedie__tab${actief === id ? ' is-aan' : ''}`} onClick={() => op(id)}>{label}<small>{teller}</small></button>;
}
function GoalTile({ title, image, hint = 'Nog niet ontdekt', onOpen }: { key?: React.Key; title: string; image?: string; hint?: string; onOpen: () => void }) {
  return <button type="button" className="encyclopedie__tegel is-slot is-vergrendeld" aria-label={`${title}, ${hint}`} onClick={onOpen}>{image && <img src={image} alt="" />}<span className="encyclopedie__slot" aria-hidden="true"><Lock /></span><strong>{title}</strong><small>{hint}</small></button>;
}
function PlantTegel({ item, op }: { key?: React.Key; item: PlantKnowledge; op: () => void }) {
  const product = plantProduct(item.species.id);
  return <button type="button" className={`encyclopedie__tegel is-niveau-${item.level}`} onClick={op}>{product && <img src={product.image} alt="" />}<strong>{item.species.commonName}</strong><small>{item.level === 3 ? <><Stamp size={13} aria-hidden="true" />Compleet</> : item.level === 2 ? `${item.diagnoses}/${STAMPS_NEEDED} herkend` : KNOWLEDGE_LABEL[item.level]}</small></button>;
}

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
      <p className="plantpagina__tip"><strong>Kiki zegt</strong>{species.kikiTip}</p>
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
