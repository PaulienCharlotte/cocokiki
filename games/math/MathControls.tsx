import React from 'react';
import { ArrowLeft, Star, Volume2, VolumeX } from 'lucide-react';
import { Button, Dialog } from '../../design-system';
import CocoCoin from '../../components/platform/CocoCoin';
import { MATH_GAMES_BY_ID } from './config';
import { resultStatus } from './engine';
import { MATH_LEVELS, type MathGameId, type MathLevel, type MathProgress, type MathResult } from './types';

export function MathHeader({ game, level, progress, onBack, onHome = onBack, onLevel, coins = 0, sound = false, onSound }: { game: MathGameId | null; level: MathLevel; progress: MathProgress; onBack: () => void; onHome?: () => void; onLevel: (level: MathLevel) => void; coins?: number; sound?: boolean; onSound?: () => void }) {
  const config = game ? MATH_GAMES_BY_ID[game] : null;
  return <header className="math-game-header">
    {/* De uitgang staat in elk spel als eerste in de rij, als rond icoon. */}
    <button className="math-icon-tool math-terug" type="button" aria-label={game ? 'Terug naar het rekeneiland' : 'Terug naar School'} title={game ? 'Rekeneiland' : 'School'} onClick={onBack}><ArrowLeft size={20} aria-hidden="true" /></button>
    <button className="math-header-brand" type="button" onClick={onHome} aria-label="Naar de wereld"><img src="/images/cocokiki-logo.webp" alt="CocoKiki" /></button>
    <h1>{config?.title ?? 'Rekenavonturen'}</h1>
    {game && config && <MathLevelSlider game={game} level={level} progress={progress} onLevel={onLevel} />}
    <span className="math-wallet" aria-label={`${coins} CocoCoins`}><CocoCoin size={24} />{coins}</span>
    {onSound && <button type="button" className="math-icon-tool" aria-label={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} title={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} onClick={onSound}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>}
  </header>;
}
/**
 * De moeilijkheid als schuifbalk.
 *
 * Elk niveau staat open, dus je hoeft je niet eerst door niveau 1 te werken.
 * Onder de balk staat wat je op dat niveau oefent, zodat het getal iets zegt.
 */
export function MathLevelSlider({ game, level, progress, onLevel }: { game: MathGameId; level: MathLevel; progress: MathProgress; onLevel: (level: MathLevel) => void }) {
  const config = MATH_GAMES_BY_ID[game];
  const gehaald = progress.games[game].completed;
  return <div className="math-level-select">
    <label className="math-level-select__schaal">
      <span className="sr-only">Hoe moeilijk wil je het?</span>
      <input type="range" min={1} max={MATH_LEVELS.length} step={1} value={level}
        aria-valuetext={`Niveau ${level}: ${config.objectives[level - 1]}`}
        onChange={event => onLevel(Number(event.target.value) as MathLevel)} />
    </label>
    <strong>Niveau {level}{gehaald.includes(level) ? ' ✓' : ''}</strong>
    <small>{config.objectives[level - 1]}</small>
  </div>;
}
export function MathCompletion({ game, level, result, reward, saved, onRetrySave, onReplay, onNext, onBack }: {
  game: MathGameId; level: MathLevel; result: MathResult; reward: number; saved: boolean; onRetrySave: () => void; onReplay: () => void; onNext: () => void; onBack: () => void;
}) {
  const status = resultStatus(game, level, result);
  return <Dialog className="math-completion" open title={status.passed ? 'Goed gerekend!' : 'Elke keer leer je meer!'} onClose={onBack}
    description={game === 'race' ? `Je hebt ${result.correct} klanten geholpen! ${result.score} punten verdiend!` : `${result.correct} van de 10 meteen goed`}
    illustration={<div className="math-stars" aria-label={`${status.stars} sterren`}>{[1, 2, 3].map(star => <Star key={star} size={34} fill={star <= status.stars ? 'currentColor' : 'none'} />)}</div>}
    primaryAction={!saved ? <Button onClick={onRetrySave}>Opnieuw opslaan</Button> : status.passed && level < 5 ? <Button onClick={onNext}>Volgend niveau</Button> : <Button onClick={onReplay}>Opnieuw spelen</Button>}
    secondaryAction={<>{(!saved || status.passed && level < 5) && <Button variant="secondary" onClick={onReplay}>Opnieuw spelen</Button>}<Button variant="quiet" onClick={onBack}>Terug naar rekenen</Button></>}>
    {!saved ? <p role="alert">Opslaan lukte niet. Je resultaat blijft hier staan.</p> : <p className="math-earned"><CocoCoin size={22} /> {reward > 0 ? `+${reward} CocoCoins` : 'Deze ronde is al beloond, of er zijn nog geen opdrachten opgelost.'}</p>}
    {!status.passed && <p>{game === 'race' ? 'Op jouw tempo, zonder puntenaftrek.' : 'Bij 8 van de 10 meteen goed speel je het volgende niveau vrij.'}</p>}
  </Dialog>;
}
