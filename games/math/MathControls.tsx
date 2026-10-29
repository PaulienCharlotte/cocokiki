import React from 'react';
import { ArrowLeft, Star, Volume2, VolumeX } from 'lucide-react';
import { Button, Dialog } from '../../design-system';
import CocoCoin from '../../components/platform/CocoCoin';
import { MATH_GAMES_BY_ID } from './config';
import { levelUnlocked } from './progress';
import { resultStatus } from './engine';
import { MATH_LEVELS, type MathGameId, type MathLevel, type MathProgress, type MathResult } from './types';

export function MathHeader({ game, level, progress, onBack, onHome = onBack, onLevel, coins = 0, sound = false, onSound }: { game: MathGameId | null; level: MathLevel; progress: MathProgress; onBack: () => void; onHome?: () => void; onLevel: (level: MathLevel) => void; coins?: number; sound?: boolean; onSound?: () => void }) {
  const config = game ? MATH_GAMES_BY_ID[game] : null;
  return <header className="math-game-header">
    <button className="math-icon-tool" type="button" aria-label={game ? 'Terug naar rekenen' : 'Terug naar School'} title="Terug" onClick={onBack}><ArrowLeft size={22} /></button>
    <button className="math-header-brand" type="button" onClick={onHome} aria-label="Naar de wereld"><img src="/images/cocokiki-logo.png" alt="CocoKiki" /></button>
    <h1>{config?.title ?? 'Rekenavonturen'}</h1>
    {game && config && <select className="math-level-select" aria-label="Kies een niveau" value={level} onChange={event => onLevel(Number(event.target.value) as MathLevel)}>{MATH_LEVELS.map(option => <option key={option} value={option} disabled={!levelUnlocked(progress, game, option)}>Niveau {option}{progress.games[game].completed.includes(option) ? ' ✓' : ''}</option>)}</select>}
    <span className="math-wallet" aria-label={`${coins} CocoCoins`}><CocoCoin size={24} />{coins}</span>
    {onSound && <button type="button" className="math-icon-tool" aria-label={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} title={sound ? 'Geluid uitzetten' : 'Geluid aanzetten'} onClick={onSound}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>}
  </header>;
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
