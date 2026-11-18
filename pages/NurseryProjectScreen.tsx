import React, { useEffect, useRef, useState } from 'react';
import { Lightbulb, Volume2, VolumeX } from 'lucide-react';
import InfoKnop from '../components/ui/InfoKnop';
import NurseryRoom from '../components/projects/NurseryRoom';
import { CHARACTERS } from '../data/characters';
import { NURSERY_ITEMS, NURSERY_QUESTIONS, PROJECT_BUDGET, type NurseryItemId, type NurseryQuestionId } from '../data/projects/nursery';
import { answerNursery, beginNursery, checkoutNursery, finishNursery, loadNursery, nurseryChoices, nurseryEarned, nurseryLayoutReady, nurseryQuestion, nurseryTotal, NURSERY_KEY, revealNursery, toggleNurseryItem, type NurseryState } from '../services/nurseryProject';
import { subscribeLocalState } from '../services/localState';
import { TASK_REWARDS } from '../services/taskRewards';
import { useMathSound } from '../games/math/useMathSound';
import './nursery-project.css';

/**
 * Een interieuropdracht in de huisstijl van de rekenspellen: de vaste zones,
 * maten en prijzen als hangkaartjes áán de dingen in de kamer, en antwoorden
 * als bellen rechtsonder. Lua praat; er staat geen los tekstvak in beeld.
 *
 * Wat per kamer verschilt (de maten, waar de kaartjes hangen, de meubels)
 * staat in KAARTJES en in data/projects. Een nieuwe opdracht is zo vooral data.
 */
type Kaartje = { tekst: string; x: number; y: number; kleur?: 'zon' | 'wit' };
const KAMER = '/assets/library/treehouse/rooms/blush-front-v1.webp';
const item = (id: NurseryItemId) => NURSERY_ITEMS.find(i => i.id === id)!;
/** Welke meubels er in de kamer staan bij een rekenstap, en waar. */
const MEUBELS: Partial<Record<NurseryQuestionId, Array<{ id: NurseryItemId; x: number }>>> = {
  space: [{ id: 'crib', x: 28 }, { id: 'dresser', x: 70 }],
  rug: [{ id: 'crib', x: 50 }],
};
function kaartjes(stage: NurseryQuestionId, state: NurseryState): Kaartje[] {
  if (stage === 'height') return [{ tekst: 'plafond ↕ 260 cm', x: 72, y: 38 }];
  if (stage === 'space') return [{ tekst: 'muur 320 cm', x: 50, y: 22, kleur: 'wit' }, { tekst: '120 cm', x: 28, y: 60 }, { tekst: '80 cm', x: 70, y: 62 }];
  if (stage === 'rug') return [{ tekst: '120 cm', x: 50, y: 58 }];
  if (stage === 'change') return [{ tekst: `budget ${PROJECT_BUDGET}`, x: 30, y: 30, kleur: 'wit' }, { tekst: `kost ${nurseryTotal(state)}`, x: 62, y: 30 }];
  return [];
}
const getal = (n: number) => n.toLocaleString('nl-NL');

export default function NurseryProjectScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [state, setState] = useState(loadNursery);
  const [zin, setZin] = useState<string | null>(null);
  const [fout, setFout] = useState<number | null>(null);
  const [misser, setMisser] = useState(false);
  const [goed, setGoed] = useState<number | null>(null);
  const [beloning, setBeloning] = useState<number | null>(null);
  const { sound, toggleSound, play } = useMathSound();
  const timer = useRef<number | null>(null);
  useEffect(() => subscribeLocalState(() => setState(loadNursery()), NURSERY_KEY), []);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const q = nurseryQuestion(state), stage = state.stage;
  const vraagId = q ? stage as NurseryQuestionId : null;
  const geholpen = !!vraagId && state.helped.includes(vraagId);
  const over = PROJECT_BUDGET - nurseryTotal(state);
  const herlaad = (ok: boolean) => { setState(loadNursery()); if (!ok) setZin('Dat ging even mis. Probeer het nog eens.'); return ok; };

  const kies = (waarde: number) => {
    if (!q || goed !== null) return;
    const uitkomst = answerNursery(state.revision, String(waarde));
    if (uitkomst === 'wrong') { play(false); setFout(waarde); setMisser(true); setZin(waarde * 10 === q.answer || waarde / 10 === q.answer ? 'Kijk goed naar de nullen. 100 cm is 1 meter.' : 'Bijna! Kijk nog eens naar de kaartjes.'); return; }
    if (uitkomst !== 'correct') { herlaad(false); return; }
    play(true); setGoed(waarde); setFout(null); setMisser(false);
    setBeloning(geholpen ? 0 : TASK_REWARDS.nurseryStep);
    setZin(geholpen ? 'Goed zo, samen gelukt!' : 'Ja! Precies goed.');
    timer.current = window.setTimeout(() => { setGoed(null); setBeloning(null); setZin(null); setState(loadNursery()); }, 1400);
  };
  const tip = () => { if (!q) return; if (!geholpen) herlaad(revealNursery(state.revision)); setZin(q.hint); };

  const lua = CHARACTERS.lua;
  const standaardZin = stage === 'brief' ? 'Luna wil een knusse babykamer: bed links, kast rechts. Help je meten, kiezen en inrichten?'
    : q ? q.prompt
    : stage === 'shop' ? `Kies een bedje, kast en lamp. Je hebt nog ${over} projectmunten.`
    : stage === 'decorate' ? 'Sleep het bed naar links en de kast naar rechts.'
    : `Wat een fijne kamer! Je verdiende ${nurseryEarned()} CocoCoins.`;
  const opgelost = state.solved.length;

  return <main className="ck-scherm interieur" data-wereld="boomhut" aria-label="Luna’s babykamer">
    {/* 7. Speelveld: de kamer zelf */}
    <div className={`interieur__veld${stage === 'decorate' || stage === 'complete' ? ' is-inrichten' : ''}`} style={{ ['--kamer' as string]: `url(${KAMER})` }}>
      {(stage === 'decorate' || stage === 'complete') && <NurseryRoom state={state} onSave={herlaad} />}
      {vraagId && MEUBELS[vraagId]?.map(m => <img key={m.id} className="interieur__meubel" src={item(m.id).image} alt={item(m.id).name} style={{ left: `${m.x}%`, width: `${item(m.id).width}%` }} />)}
      {stage === 'total' && state.basket.map((id, i) => <span key={id} className="interieur__plek" style={{ left: `${(i + 1) * (100 / (state.basket.length + 1))}%` }}>
        <span className="ck-hangkaartje interieur__kaartje"><span className="ck-hangkaartje__touw" /><span className="ck-hangkaartje__label">{item(id).price}</span></span>
        <img className="interieur__meubel is-los" src={item(id).image} alt={item(id).name} />
      </span>)}
      {vraagId && kaartjes(vraagId, state).map(k => <span key={k.tekst} className={`ck-hangkaartje interieur__kaartje is-${k.kleur ?? 'zon'}`} style={{ left: `${k.x}%`, top: `${k.y}%` }}><span className="ck-hangkaartje__touw" /><span className="ck-hangkaartje__label">{k.tekst}</span></span>)}
      {stage === 'shop' && NURSERY_ITEMS.map((m, i) => {
        const gekozen = state.basket.includes(m.id), past = gekozen || nurseryTotal(state) + m.price <= PROJECT_BUDGET;
        return <button key={m.id} type="button" className={`interieur__plek interieur__koop${gekozen ? ' is-gekozen' : ''}`} style={{ left: `${(i + 1) * (100 / (NURSERY_ITEMS.length + 1))}%` }}
          aria-pressed={gekozen} aria-label={`${m.name}, ${m.price} projectmunten${gekozen ? ', gekozen' : ''}`}
          onClick={() => { if (!past) { play(false); setZin(`Daar is je budget te klein voor. Je hebt nog ${over}.`); return; } play(true); setZin(null); herlaad(toggleNurseryItem(state.revision, m.id)); }}>
          <span className="ck-hangkaartje interieur__kaartje"><span className="ck-hangkaartje__touw" /><span className="ck-hangkaartje__label">{m.price}</span></span>
          <img className={`interieur__meubel is-los${past ? '' : ' is-vaag'}`} src={m.image} alt="" />
        </button>;
      })}
    </div>

    {/* 2. Statuseiland: vijf rekenstappen, en bij het kiezen het budget */}
    <div className={`ck-zone-status ck-glas interieur__status${beloning ? ' is-open' : ''}`}>
      <span className="interieur__stippen" role="img" aria-label={`${opgelost} van ${NURSERY_QUESTIONS.length} rekenstappen`}>
        {NURSERY_QUESTIONS.map((id, i) => <span key={id} className={`ck-stip${state.solved.includes(id) ? ' ck-stip--klaar' : ''}${id === vraagId ? ' ck-stip--nu' : ''}`} data-i={i} />)}
      </span>
      {stage === 'shop' && <><span className="interieur__scheid" /><b className="interieur__budget">{over}</b></>}
      <span className="ck-status-extra" aria-live="polite">{beloning ? <><span className="interieur__scheid" /><span className="ck-munt interieur__munt" aria-hidden="true" /><b>+{beloning}</b></> : null}</span>
    </div>

    {/* 4. Gereedschap: uitleg · tip — geluid */}
    <div className="ck-zone-gereedschap ck-glas interieur__gereedschap" role="toolbar" aria-label="Gereedschap">
      <InfoKnop character="lua">Reken de maten en prijzen in Luna’s kamer uit. Tik op het goede antwoord. Elke stap die je zelf oplost geeft {TASK_REWARDS.nurseryStep} CocoCoins, en bij het afleveren nog {TASK_REWARDS.nurseryFinishStep}. Met het lampje helpt Lua je, maar dan krijg je voor die stap geen munten.</InfoKnop>
      {q && <button type="button" className={`ck-gereedschap${misser || geholpen ? ' is-aan' : ''}`} aria-label="Tip van Baby Lua" onClick={tip}><Lightbulb size={22} aria-hidden="true" /></button>}
      <span className="interieur__lijn" aria-hidden="true" />
      <button type="button" className={`ck-gereedschap${sound ? ' is-aan' : ''}`} aria-label={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} aria-pressed={sound} onClick={toggleSound}>{sound ? <Volume2 size={22} aria-hidden="true" /> : <VolumeX size={22} aria-hidden="true" />}</button>
    </div>

    {/* 5. Lua linksonder */}
    <div className={`ck-zone-personage interieur__personage${goed !== null || stage === 'complete' ? ' is-blij' : ''}`}>
      <img className="ck-ballon__gezicht" src={lua.beeld} alt={lua.naam} />
      <p className="ck-ballon__tekst" role="status" key={zin ?? standaardZin}><span className="ck-ballon__naam">{lua.naam}</span>{zin ?? standaardZin}</p>
    </div>

    {/* 6. Antwoordbellen, of één hoofdknop */}
    <div className="ck-zone-antwoord interieur__antwoord">
      {q ? nurseryChoices(state).map((waarde, i) => <button key={`${vraagId}:${waarde}`} type="button"
          className={`ck-bel ck-bel--${(i % 4) + 1} interieur__bel${fout === waarde ? ' is-fout' : ''}${goed === waarde ? ' is-goed' : ''}${goed !== null && goed !== waarde ? ' is-weg' : ''}`}
          aria-label={`${getal(waarde)} ${q.unit}`} onAnimationEnd={() => fout === waarde && setFout(null)} onClick={() => kies(waarde)}>
          <span className="ck-bel__kern" />{getal(waarde)}
        </button>)
      : stage === 'brief' ? <button type="button" className="ck-knop ck-knop--hoofd" onClick={() => herlaad(beginNursery())}>Begin met meten</button>
      : stage === 'shop' ? <button type="button" className="ck-knop ck-knop--hoofd" disabled={!NURSERY_ITEMS.filter(i => i.required).every(i => state.basket.includes(i.id))} onClick={() => herlaad(checkoutNursery(state.revision))}>Bestellen</button>
      : stage === 'decorate' ? <button type="button" className="ck-knop ck-knop--hoofd" disabled={!nurseryLayoutReady(state)} onClick={() => { if (herlaad(finishNursery(state.revision))) play(true); }}>Klaar voor Luna</button>
      : <button type="button" className="ck-knop ck-knop--hoofd" onClick={() => onNavigate('/opdrachten')}>Naar To Do</button>}
    </div>
  </main>;
}
