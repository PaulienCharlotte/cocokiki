import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dialog } from '../../design-system';
import AmountInput from '../cooking/AmountInput';
import LocationGameView, { AdventureClipboard } from '../dreamworld/LocationAdventureWidgets';
import type { AdventurePreview, LocationActivity, WorldLocation } from '../../platform/worldLocations';
import { PLAYABLE_ADVENTURES, type PlayableAdventure } from '../../data/adventures/catalog';
import type { AdventureRun } from '../../data/adventures/types';
import { AdventureRuntime } from '../../services/adventureRuntime';
import { RECIPES_BY_ID } from '../../data/cooking/catalog';
import { subscribeLocalState } from '../../services/localState';
import type { createIsolatedCookingStorage } from '../../services/isolatedCookingStorage';
import './adventure-runner.css';

const CookingExperience = lazy(() => import('../cooking/CookingExperience'));
const ShopScreen = lazy(() => import('../../pages/ShopScreen'));
const runtime = new AdventureRuntime(PLAYABLE_ADVENTURES);
type Workspace = { type: 'shop'; runId: string; recipeId: string } | { type: 'cook'; runId: string; recipeId: string; storage: ReturnType<typeof createIsolatedCookingStorage> };

export default function AdventureRunner({ location, onOpen }: { location: WorldLocation; onOpen: (activity: LocationActivity) => void }) {
  const configs = PLAYABLE_ADVENTURES.filter(item => item.definition.locationId === location.id);
  const [runs, setRuns] = useState<Record<string, AdventureRun | null>>(() => {
    try { return Object.fromEntries(configs.map(item => [item.definition.id, runtime.latest(item.definition.id)])); } catch { return {}; }
  });
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [panel, setPanel] = useState<{ type: 'math' | 'ingredients'; runId: string } | null>(null);
  const closePanel = useCallback(() => setPanel(null), []);
  const [answer, setAnswer] = useState(0), [feedback, setFeedback] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const working = useRef(false);
  const refresh = () => {
    try { setRuns(Object.fromEntries(configs.map(item => [item.definition.id, runtime.latest(item.definition.id)]))); }
    catch { setError('Je avontuur kan niet veilig worden geladen. Je voortgang blijft bewaard.'); }
  };
  useEffect(() => { void command(() => runtime.resume()); return subscribeLocalState(refresh); }, [location.id]);
  const command = async <T,>(work: () => T | Promise<T>): Promise<T | null> => {
    if (working.current) return null;
    working.current = true; setBusy(true); setError('');
    try { const result = await work(); refresh(); return result; }
    catch { setError('Dat lukte nog niet. Je voortgang blijft bewaard. Probeer opnieuw.'); return null; }
    finally { working.current = false; setBusy(false); }
  };
  const openCooking = async (runId: string) => {
    const attempt = await runtime.prepare(runId), binding = runtime.binding(runtime.run(runId));
    if (binding.type !== 'cooking') throw Error('wrong-activity');
    const storage = runtime.cooking(attempt);
    if (storage.receipt()) { await runtime.acceptCooking(runId); closeWorkspace(); }
    else setWorkspace({ type: 'cook', runId, recipeId: binding.recipeId, storage });
    setPanel(null);
  };
  const act = (config: PlayableAdventure, run: AdventureRun | null) => command(async () => {
    if (!run) { await runtime.start(config.definition.id); return; }
    if (run.status === 'completed') { await runtime.replay(run.id); return; }
    const step = config.definition.steps.find(item => item.id === run.currentStepId)!;
    if (step.type === 'story') { await runtime.continueStory(run.id); return; }
    if (step.type === 'finish') { await runtime.deliver(run.id); return; }
    const binding = runtime.binding(run);
    if (binding.type === 'cooking') await openCooking(run.id);
    else { if (binding.type === 'arithmetic') await runtime.prepare(run.id); setFeedback(''); setAnswer(0); setPanel({ type: binding.type === 'arithmetic' ? 'math' : 'ingredients', runId: run.id }); }
  });
  const closeWorkspace = () => { setWorkspace(null); refresh(); window.scrollTo({ top: 0 }); };
  if (workspace) return <section className="adventure-workspace" aria-label="Avontuuractiviteit">
    {error && <p role="alert" className="adventure-notice">{error}</p>}
    <Suspense fallback={<p role="status">De activiteit wordt klaargezet...</p>}>
      {workspace.type === 'shop' ? <ShopScreen initialStore="groceries" recipeId={workspace.recipeId} ownerReturn={{ scope: workspace.runId, label: 'Terug naar het avontuur', onReturn: closeWorkspace }} onExit={closeWorkspace} />
        : <CookingExperience recipe={RECIPES_BY_ID[workspace.recipeId]} progress={workspace.storage.load()} storageAdapter={workspace.storage} onClose={closeWorkspace}
          onShop={() => setWorkspace({ type: 'shop', runId: workspace.runId, recipeId: workspace.recipeId })}
          onProgressChange={progress => {
            if (progress.preparationSessions[workspace.recipeId]?.completed && runtime.run(workspace.runId).currentStepId === workspace.storage.receipt()?.stepId) {
              void command(async () => { await runtime.acceptCooking(workspace.runId); closeWorkspace(); });
            }
          }} />}
    </Suspense>
  </section>;
  const renderClipboard = (preview: AdventurePreview) => {
    const config = configs.find(item => item.previewId === preview.id);
    if (!config) return <AdventureClipboard adventure={preview} />;
    const run = runs[config.definition.id] ?? null;
    let description = config.definition.introduction, label = 'Start avontuur';
    if (run) {
      if (run.status === 'completed') { description = config.presentation.completed; label = 'Opnieuw spelen'; }
      else {
        const step = config.definition.steps.find(item => item.id === run.currentStepId);
        if (step?.type === 'story') { description = `${runtime.scenario(run).introduction} ${config.definition.description}`; label = 'Ga verder'; }
        if (step?.type === 'finish') { description = step.text; label = config.presentation.deliveryLabel; }
        if (step?.type === 'activity') {
          const binding = runtime.binding(run);
          if (binding.type === 'arithmetic') { description = runtime.scenario(run).question; label = 'Bereken bestelling'; }
          if (binding.type === 'ingredients') { description = config.presentation.ingredients; label = runtime.stock(run).every(item => item.sufficient) ? 'Ga bakken' : 'Verzamel ingrediënten'; }
          if (binding.type === 'cooking') { description = config.presentation.cooking; label = run.pendingAttempt ? 'Ga verder' : 'Ga bakken'; }
        }
      }
    }
    return <AdventureClipboard adventure={{ ...preview, description }} action={{ label, disabled: busy, onClick: () => { void act(config, run); } }}>
      {error && <p role="alert">{error}</p>}
    </AdventureClipboard>;
  };
  const previews = location.adventurePreviews?.map(preview => {
    const config = configs.find(item => item.previewId === preview.id), run = config ? runs[config.definition.id] : null;
    return config ? { ...preview, status: run ? run.status === 'completed' ? 'completed' as const : 'active' as const : 'available' as const,
      ...(run ? { progress: { completed: run.completedStepIds.length, total: config.definition.steps.length } } : {}) } : preview;
  });
  const panelRun = panel ? runtime.run(panel.runId) : null;
  const scenario = panelRun && panel?.type === 'math' ? runtime.scenario(panelRun) : null;
  const stock = panelRun && panel?.type === 'ingredients' ? runtime.stock(panelRun) : [];
  const ready = stock.length > 0 && stock.every(item => item.compatible && item.sufficient);
  return <>
    <LocationGameView location={{ ...location, adventurePreviews: previews }} onOpen={onOpen} renderClipboard={renderClipboard} initialTab={Object.values(runs).some(Boolean) ? 'adventures' : 'activities'} />
    {panel && panelRun && <Dialog open title={scenario ? 'Help met de bestelling' : 'Ingrediënten controleren'} description={scenario?.question} onClose={closePanel}
      primaryAction={<Button disabled={busy} onClick={() => { void command(async () => {
        if (scenario) {
          if (await runtime.answer(panel.runId, answer)) setPanel(null); else setFeedback(scenario.feedback);
        } else if (ready) {
          if (await runtime.collect(panel.runId)) await openCooking(panel.runId); else setFeedback('Er ontbreekt nog iets. Controleer je voorraad opnieuw.');
        } else {
          const binding = runtime.binding(panelRun); if (binding.type === 'arithmetic') return;
          setWorkspace({ type: 'shop', runId: panel.runId, recipeId: binding.recipeId }); setPanel(null);
        }
      }); }}>{scenario ? 'Controleer antwoord' : ready ? 'Ga bakken' : 'Naar de winkel'}</Button>}>
      {scenario ? <div className="adventure-answer"><span>Jouw antwoord</span><AmountInput value={answer} onChange={setAnswer} label={scenario.answerLabel ?? runtime.config(panelRun.adventureId).presentation.answerLabel} maximum={100} /></div>
        : <ul className="adventure-stock">{stock.map(item => <li key={item.ingredientId}><strong>{item.name}</strong><span>Nodig: {item.required} {item.unit === 'piece' ? 'stuks' : item.unit === 'gram' ? 'g' : 'ml'}</span><span>In huis: {item.available} · {item.sufficient ? 'Aanwezig' : 'Nog nodig'}</span></li>)}</ul>}
      {feedback && <p role="status">{feedback}</p>}{error && <p role="alert">{error}</p>}
    </Dialog>}
  </>;
}
