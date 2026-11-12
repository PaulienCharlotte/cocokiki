import React, { useState } from 'react';
import { ArrowLeft, Droplets, Flame, Heart, Microscope, Utensils, Wind } from 'lucide-react';
import { INGREDIENTS } from '../data/cooking/catalog';
import { FOOD_TERMS_BY_ID } from '../data/cooking/foodGlossary';
import FoodKnowledgeDialog from '../components/food/FoodKnowledge';
import { Button, IconButton } from '../design-system';
import CardGrid from '../components/ui/CardGrid';
import SpeechBubble from '../components/ui/SpeechBubble';
import ChoiceList from '../components/ui/ChoiceList';
import { FOOD_LESSONS } from '../data/cooking/foodLessons';
import { completeFoodLesson, loadFoodKnowledge } from '../services/foodKnowledge';
import './food-discovery.css';

export default function FoodDiscoveryScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [view, setView] = useState<'products' | 'body' | 'lessons'>('products');
  const [productId, setProductId] = useState<string | null>(null);
  const [termId, setTermId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [completed, setCompleted] = useState(loadFoodKnowledge);
  const lesson = FOOD_LESSONS.find(item => item.id === lessonId);
  const question = lesson && step >= 0 ? lesson.questions[step] : undefined;
  const back = () => { setLessonId(null); setStep(-1); setSelected(null); };
  const next = () => {
    if (lesson && step === lesson.questions.length - 1) {
      const ids = [...new Set([...completed, lesson.id])];
      if (!completeFoodLesson(lesson.id)) { setNotice('Bewaren lukt even niet. Probeer opnieuw.'); return; }
      setCompleted(ids);
    }
    setNotice(''); setSelected(null); setStep(value => value + 1);
  };
  return <main className="food-discovery cooking-room">
    <img className="cooking-room__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="" />
    <section className="food-discovery__card">
      <IconButton label={lesson ? 'Terug naar de ontdekkingen' : 'Terug naar Coco'} icon={<ArrowLeft size={20} />} onClick={lesson ? back : () => onNavigate('/islands/cooking')} />
      {!lesson ? <>
        <SpeechBubble character="coco" label="ontdek je eten">{view === 'products' ? 'Kies een product. Ontdek waar het vandaan komt en wat je lichaam ermee doet.' : view === 'body' ? 'Hoe werkt jouw lichaam? Tik iets aan en ontdek het stap voor stap.' : 'Wat wil jij over eten ontdekken?'}</SpeechBubble>
        <nav className="food-sections" aria-label="Kies wat je ontdekt">
          {([{ id: 'products', label: 'Voedingsmiddelen' }, { id: 'body', label: 'Je lichaam' }, { id: 'lessons', label: 'Ontdekkingen' }] as const).map(item => <Button key={item.id} variant={view === item.id ? 'secondary' : 'quiet'} size="small" aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</Button>)}
        </nav>
        {view === 'products' && <>
          <label className="food-search">Zoek een product<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Bijvoorbeeld ei of havermout" /></label>
          <CardGrid label="Voedingsmiddelen" cards={INGREDIENTS.filter(item => item.contentStatus === 'ready' && item.name.toLocaleLowerCase('nl').includes(search.trim().toLocaleLowerCase('nl'))).map(item => ({ id: item.id, titel: item.name, beeld: item.image }))} onChoose={setProductId} />
          {!INGREDIENTS.some(item => item.contentStatus === 'ready' && item.name.toLocaleLowerCase('nl').includes(search.trim().toLocaleLowerCase('nl'))) && <p>Geen product gevonden. Probeer een ander woord.</p>}
        </>}
        {view === 'body' && <CardGrid label="Ontdek je lichaam" cards={[
          { id: 'red-blood-cells', icoon: <Droplets /> }, { id: 'oxygen', icoon: <Wind /> }, { id: 'cells', icoon: <Microscope /> },
          { id: 'blood', icoon: <Heart /> }, { id: 'digestion', icoon: <Utensils /> }, { id: 'energy', icoon: <Flame /> },
        ].map(item => ({ ...item, titel: FOOD_TERMS_BY_ID[item.id].title }))} onChoose={setTermId} />}
        {view === 'lessons' && <CardGrid label="Kies een ontdekking" cards={FOOD_LESSONS.map(item => ({ id: item.id, titel: item.title, beeld: item.image, meta: completed.includes(item.id) ? 'Ontdekt' : `${item.questions.length} ontdekkingen` }))} onChoose={id => { setLessonId(id); setStep(-1); }} />}
      </> : <>
        <img className="food-discovery__image" src={lesson.image} alt="" />
        {step === -1 ? <>
          <SpeechBubble character="coco" label={lesson.title}>{lesson.introduction}</SpeechBubble>
          <Button onClick={next}>Ontdekken</Button>
        </> : question ? <>
          <SpeechBubble character="coco" label={lesson.title} aside={`${step + 1} / ${lesson.questions.length}`}>{question.question}</SpeechBubble>
          <ChoiceList label="Kies je antwoord" disabled={selected !== null} choices={question.choices.map((label, index) => ({ id: String(index), label, staat: selected === null ? undefined : index === question.answer ? 'goed' as const : selected === index ? 'mis' as const : undefined }))} onChoose={id => setSelected(Number(id))} />
          {selected !== null && <><p className="food-discovery__explanation" role="status">{question.explanation}</p><Button onClick={next}>Verder</Button></>}
        </> : <>
          <SpeechBubble character="coco" label="ontdekt">Je hebt {lesson.title.toLowerCase()} ontdekt. Zullen we het in de keuken gebruiken?</SpeechBubble>
          <Button onClick={() => onNavigate(`/treehouse/cookbook?recipe=${lesson.recipeId}`)}>Kies het bijpassende recept</Button>
          <Button variant="quiet" onClick={back}>Nog iets ontdekken</Button>
          <a href={lesson.source} target="_blank" rel="noreferrer">Meer lezen bij het Voedingscentrum</a>
        </>}
      </>}
      {notice && <p role="alert">{notice}</p>}
    </section>
    {productId && <FoodKnowledgeDialog ingredient={INGREDIENTS.find(item => item.id === productId)} onClose={() => setProductId(null)} />}
    {termId && <FoodKnowledgeDialog termId={termId} onClose={() => setTermId(null)} />}
  </main>;
}
