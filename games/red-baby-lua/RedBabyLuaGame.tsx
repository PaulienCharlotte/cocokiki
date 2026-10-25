import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Home, Pause, Play, RotateCcw, Settings2, Star, Volume2, VolumeX } from 'lucide-react';
import Phaser from 'phaser';
import CocoCoin from '../../components/platform/CocoCoin';
import { awardCurrencyOnce, CURRENCY_CHANGE_EVENT, loadCurrency } from '../../services/currency';
import { createLuaGame } from './game/config';
import PlayScene from './game/scenes/PlayScene';
import { createQuestion, nextDifficulty, nextQuestionType } from './game/systems/questions';
import { currencyReward, EMPTY_STATS, recordSuccess, recordTimeout, roundDuration, starsFor } from './game/systems/progression';
import { loadBest, loadCoins, loadPreferences, saveBest, savePreferences } from './game/systems/storage';
import { LuaAudio } from './game/systems/audio';
import { GamePhase, LuaGameMode, Preferences, Question, SessionStats, TableChoice } from './game/types';
import type { MathLevel, MathResult } from '../math/types';
import { luaMathResult, luaTableForLevel } from '../math/luaBridge';

interface Props {
  onHome: () => void;
  onCoinsChange?: (coins: number) => void;
  mathAdventure?: { level: MathLevel; onComplete: (result: MathResult) => void; sound: boolean };
}
const FEEDBACK = ['Goed gered!', 'Knap gedaan!', 'Super snel!', 'Lua is veilig!'];
const MODE_INFO: Array<{ id: LuaGameMode; label: string; detail: string }> = [
  { id: 'calm', label: 'Rustig', detail: 'Zonder tijdsdruk' },
  { id: 'adventure', label: 'Avontuur', detail: 'Tot je levens op zijn' },
  { id: 'challenge', label: 'Uitdaging', detail: 'Sneller en gemixt' },
];

export default function RedBabyLuaGame({ onHome, onCoinsChange, mathAdventure }: Props) {
  const ROUND_COUNT = mathAdventure ? 10 : 8;
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<PlayScene | null>(null);
  const audioRef = useRef(new LuaAudio());
  const phaseRef = useRef<GamePhase>('menu');
  const timeoutRef = useRef<() => void>(() => undefined);
  const questionRef = useRef<Question | null>(null);
  const transitionRef = useRef<number | null>(null);
  const missedRef = useRef<Array<{ question: Question; availableRound: number }>>([]);
  const difficultyRef = useRef(1);
  const [preferences, setPreferences] = useState<Preferences>(() => mathAdventure ? { ...loadPreferences(), mode: 'adventure', tutorialSeen: true, sound: mathAdventure.sound } : loadPreferences());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [question, setQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [paused, setPaused] = useState(false);
  const [best, setBest] = useState(loadBest);
  const [coins, setCoins] = useState(loadCoins);
  const coinSessionId = useRef(crypto.randomUUID());
  const [sessionCoins, setSessionCoins] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const reducedMotion = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  const setGamePhase = (value: GamePhase) => { phaseRef.current = value; setPhase(value); };
  const clearTransition = () => { if (transitionRef.current) window.clearTimeout(transitionRef.current); transitionRef.current = null; };
  const calm = preferences.mode === 'calm';

  const finish = useCallback((finalStats: SessionStats, playedRounds: number) => {
    clearTransition();
    const stars = starsFor(finalStats, playedRounds);
    const nextBest = { score: Math.max(best.score, finalStats.score), stars: Math.max(best.stars, stars) };
    setBest(nextBest); saveBest(nextBest); setGamePhase('results'); audioRef.current.play('results');
    mathAdventure?.onComplete(luaMathResult(finalStats));
  }, [best, mathAdventure]);

  const beginRound = useCallback((nextRound: number, sourceStats: SessionStats, previousId = '') => {
    clearTransition();
    const retryIndex = missedRef.current.findIndex(item => item.availableRound <= nextRound);
    const type = nextQuestionType(nextRound, preferences.mode === 'challenge' ? 3 : difficultyRef.current);
    const selectedTable = mathAdventure ? luaTableForLevel(mathAdventure.level) : preferences.table;
    const nextQuestion = retryIndex >= 0
      ? missedRef.current.splice(retryIndex, 1)[0].question
      : createQuestion(preferences.mode === 'challenge' ? 'mix' : selectedTable, previousId, Math.random, difficultyRef.current, type);
    questionRef.current = nextQuestion;
    setQuestion(nextQuestion); setRound(nextRound); setWrongChoices([]); setFeedback(''); setRemaining(1); setPaused(false);
    setGamePhase('active');
    const duration = roundDuration(preferences.mode === 'challenge' ? 4200 : 5000, sourceStats);
    sceneRef.current?.beginRound(duration, preferences.mode === 'calm');
  }, [preferences.mode, preferences.table, mathAdventure?.level]);

  const timeout = useCallback(() => {
    if (phaseRef.current !== 'active' || calm) return;
    setGamePhase('resolving'); sceneRef.current?.resolveTimeout(); audioRef.current.play('impact');
    const nextStats = recordTimeout(stats); const nextHearts = hearts - 1;
    difficultyRef.current = nextDifficulty(difficultyRef.current, 0, true);
    if (questionRef.current) missedRef.current.push({ question: questionRef.current, availableRound: round + 2 });
    setStats(nextStats); setHearts(nextHearts); setFeedback(`Oeps! ${questionRef.current?.explanation}`);
    transitionRef.current = window.setTimeout(() => nextHearts <= 0 || mathAdventure && round >= ROUND_COUNT ? finish(nextStats, round) : beginRound(round + 1, nextStats, questionRef.current?.id), 2200);
  }, [beginRound, calm, finish, hearts, round, stats, mathAdventure]);

  useEffect(() => {
    if (!mountRef.current || gameRef.current) return;
    const game = createLuaGame(mountRef.current, { onReady: scene => { sceneRef.current = scene; setSceneReady(true); }, onTick: setRemaining, onTimeout: () => timeoutRef.current() }, reducedMotion);
    gameRef.current = game;
    return () => { clearTransition(); setSceneReady(false); game.destroy(true); gameRef.current = null; sceneRef.current = null; audioRef.current.destroy(); };
  }, [reducedMotion]);
  useEffect(() => { timeoutRef.current = timeout; }, [timeout]);
  useEffect(() => { if (!mathAdventure) savePreferences(preferences); audioRef.current.enabled = mathAdventure ? mathAdventure.sound : preferences.sound; }, [preferences, mathAdventure?.sound]);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { onCoinsChange?.(coins); }, [coins, onCoinsChange]);
  useEffect(() => {
    const sync = () => setCoins(loadCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(CURRENCY_CHANGE_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => { const handler = () => setPaused(document.hidden); document.addEventListener('visibilitychange', handler); return () => document.removeEventListener('visibilitychange', handler); }, []);
  useEffect(() => { if (gameRef.current) paused ? gameRef.current.loop.sleep() : gameRef.current.loop.wake(); }, [paused]);

  const startSession = () => {
    if (!sceneReady) return;
    coinSessionId.current = crypto.randomUUID();
    audioRef.current.unlock(); missedRef.current = []; difficultyRef.current = preferences.mode === 'challenge' ? 3 : 1;
    setStats(EMPTY_STATS); setHearts(3); setRound(0); setSessionCoins(0);
    if (!preferences.tutorialSeen) setGamePhase('tutorial'); else beginRound(1, EMPTY_STATS);
  };

  const answer = useCallback((choice: number) => {
    const activeQuestion = questionRef.current;
    if (phaseRef.current !== 'active' || !activeQuestion || wrongChoices.includes(choice)) return;
    audioRef.current.unlock(); audioRef.current.play('tap');
    if (choice !== activeQuestion.answer) {
      audioRef.current.play('wrong'); setWrongChoices(previous => [...previous, choice]); setFeedback('Bijna. Kijk nog eens goed!');
      difficultyRef.current = nextDifficulty(difficultyRef.current, 0, true);
      return;
    }
    setGamePhase('resolving'); sceneRef.current?.resolveSuccess(); audioRef.current.play('success');
    const firstTry = wrongChoices.length === 0;
    const nextStats = recordSuccess(stats, firstTry);
    difficultyRef.current = nextDifficulty(difficultyRef.current, nextStats.streak, !firstTry);
    const comboBonus = firstTry && nextStats.streak >= 5 ? 2 : firstTry && nextStats.streak >= 3 ? 1 : 0;
    const earned = currencyReward(preferences.mode === 'challenge' ? 'mix' : preferences.table, firstTry) + comboBonus;
    if (!mathAdventure) { setCoins(awardCurrencyOnce(`lua:${coinSessionId.current}:${round}:${activeQuestion.id}`, earned).balance); setSessionCoins(previous => previous + earned); }
    setStats(nextStats);
    setFeedback(`${FEEDBACK[round % FEEDBACK.length]} ${activeQuestion.explanation}${comboBonus ? ` · Combo +${comboBonus}` : ''}`);
    const calmFinished = (mathAdventure || preferences.mode === 'calm') && round >= ROUND_COUNT;
    transitionRef.current = window.setTimeout(() => calmFinished ? finish(nextStats, round) : beginRound(round + 1, nextStats, activeQuestion.id), mathAdventure ? 750 : 1350);
  }, [beginRound, finish, preferences.mode, preferences.table, round, stats, wrongChoices, mathAdventure]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (phaseRef.current === 'active' && ['1', '2', '3'].includes(event.key) && questionRef.current) answer(questionRef.current.choices[Number(event.key) - 1]);
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [answer]);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPreferences(previous => ({ ...previous, [key]: value }));
  const stars = starsFor(stats, Math.max(1, round));
  const accuracy = round ? Math.round((stats.firstTry / round) * 100) : 0;
  const stage = ['Rotsenpad', 'Hangbrug', 'Watervallen', 'Veilige boomhut'][Math.min(3, Math.floor((round - 1) / 2))];

  return <div className="lua-game-shell">
    <div className="lua-canvas" ref={mountRef} aria-hidden="true" />
    <div className="lua-overlay">
      {phase === 'menu' && <section className="lua-menu" aria-labelledby="lua-title">
        <p className="lua-kicker">Jungle-avontuur</p><h1 id="lua-title">Red Baby Lua!</h1>
        <p>Oefen keer- en deelsommen, ontwijk de rotsen en help Lua veilig door de jungle.</p>
        {!mathAdventure && <><fieldset className="lua-modes"><legend>Kies je avontuur</legend><div>{MODE_INFO.map(mode => <button key={mode.id} type="button" aria-pressed={preferences.mode === mode.id} onClick={() => updatePreference('mode', mode.id)}><strong>{mode.label}</strong><small>{mode.detail}</small></button>)}</div></fieldset>
        <fieldset className="lua-tables"><legend>Kies je tafel</legend><div>{[1,2,3,4,5,6,7,8,9,10,'mix'].map(value => <button key={value} type="button" aria-pressed={preferences.table === value} onClick={() => updatePreference('table', value as TableChoice)}>{value === 'mix' ? 'Mix' : value}</button>)}</div></fieldset></>}
        <div className="lua-menu-balance"><CocoCoin size={20} /><strong>{coins}</strong><span>CocoCoins</span></div>
        <div className="lua-menu-actions"><button className="lua-play" disabled={!sceneReady} onClick={startSession}><Play size={21} />{sceneReady ? 'Start avontuur' : 'Even laden...'}</button>{!mathAdventure && <button className="lua-icon-button" aria-label={preferences.sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} onClick={() => updatePreference('sound', !preferences.sound)}>{preferences.sound ? <Volume2 /> : <VolumeX />}</button>}</div>
      </section>}
      {phase === 'tutorial' && <section className="lua-dialog"><h2>Help Lua!</h2><p>Kies het goede antwoord. Je krijgt verschillende soorten tafelvragen en mag na een fout nog eens proberen.</p><button className="lua-play" onClick={() => { updatePreference('tutorialSeen', true); beginRound(1, EMPTY_STATS); }}>Op avontuur</button></section>}
      {(phase === 'active' || phase === 'resolving') && question && <>
        <div className="lua-hud">{!calm && <span className="lua-hearts">{Array.from({ length: 3 }, (_, index) => <Heart key={index} size={21} fill={index < hearts ? 'currentColor' : 'none'} />)}</span>}<strong>{calm ? `${round}/${ROUND_COUNT}` : `Som ${round}`}</strong><span className="lua-stage">{stage}</span>{stats.streak >= 2 && <span className="lua-combo">Combo {stats.streak}×</span>}<span className="lua-coins" aria-label={`${coins} CocoCoins`}><CocoCoin size={18} />{coins}</span>{!calm && <button aria-label={paused ? 'Doorgaan' : 'Pauzeren'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}</div>
        {!calm && <div className="lua-timer" aria-label={`${Math.ceil(remaining * 100)} procent tijd over`}><span style={{ width: `${remaining * 100}%` }} /></div>}
        <section className="lua-question" aria-live="polite"><span className="lua-question-kind">{question.type === 'classic' || question.type === 'division' ? 'Reken uit' : question.type === 'missing' ? 'Vul aan' : question.type === 'check' ? 'Klopt het?' : question.type === 'bigger' ? 'Vergelijk' : 'Vind de som'}</span><h2>{question.prompt}</h2><div className={`lua-answers ${question.choices.length === 2 ? 'two' : ''}`}>{question.choices.map((choice, index) => <button key={`${question.id}-${choice}`} disabled={phase !== 'active' || wrongChoices.includes(choice)} className={wrongChoices.includes(choice) ? 'wrong' : ''} onClick={() => answer(choice)}>{question.choiceLabels[index] ?? choice}</button>)}</div><p>{feedback}</p></section>
      </>}
      {paused && phase !== 'menu' && <section className="lua-dialog"><Pause size={30} /><h2>Even pauze</h2><button className="lua-play" onClick={() => setPaused(false)}><Play size={18} />Doorgaan</button></section>}
      {phase === 'results' && <section className="lua-results"><p className="lua-kicker">Avontuur voltooid</p><h1>Lua is veilig!</h1><div className="lua-stars" aria-label={`${stars} sterren`}>{[0,1,2].map(index => <Star key={index} size={40} fill={index < stars ? 'currentColor' : 'none'} />)}</div><div className="lua-result-metrics"><span><strong>{accuracy}%</strong> meteen goed</span><span><strong>{stats.bestStreak}×</strong> beste combo</span></div><p className="lua-earned"><CocoCoin size={20} />+{sessionCoins} CocoCoins · totaal {coins}</p><div><button className="lua-play" onClick={startSession}><RotateCcw size={19} />Nog een avontuur</button><button onClick={onHome}><Home size={19} />Naar de wereld</button><button className="lua-settings-link" onClick={() => setGamePhase('menu')}><Settings2 size={17} />Instellingen</button></div></section>}
    </div>
  </div>;
}
