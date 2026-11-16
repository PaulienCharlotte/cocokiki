import React from 'react';
import { Button } from '../../design-system';
import { formatDigitalTime, formatDutchTime, normalizeClockTime } from './timeEngine';
import type { ClockTime } from './types';

export function timeLineAnchor(minutes: number): { anchor: number; jump: number } {
  const anchor = Math.round(minutes / 30) * 30;
  return { anchor, jump: minutes - anchor };
}
/** Een uitgerolde klok: de getallenlijn en de wijzers volgen dezelfde tijd. */
export default function ClockTimeLine({ time, step, onChange }: { time: ClockTime; step: number; onChange: (time: ClockTime) => void }) {
  const { anchor, jump } = timeLineAnchor(time.minutes);
  const at = (minutes: number) => formatDigitalTime(normalizeClockTime({ hours: time.hours, minutes }));
  const x = (minute: number) => 24 + minute / 60 * 312;
  const moves = [...new Set([-60, -step, step, 60])];
  return <section className="clock-timeline" aria-label="Tijdlijn met sprongen">
    <p>Je klok staat op <strong>{formatDutchTime(time)}</strong>.</p>
    <svg viewBox="0 0 360 110" role="img" aria-label={`Vanaf ${at(anchor)}, ${Math.abs(jump)} minuten ${jump < 0 ? 'terug' : 'vooruit'} naar ${at(time.minutes)}`}>
      <line x1="24" y1="64" x2="336" y2="64" stroke="currentColor" strokeWidth="3" />
      {[0, 15, 30, 45, 60].map(minute => <g key={minute}><line x1={x(minute)} x2={x(minute)} y1="58" y2="72" stroke="currentColor" strokeWidth="2" /><text x={x(minute)} y="96" textAnchor="middle">{at(minute)}</text></g>)}
      {jump !== 0 && <><path d={`M${x(anchor)} 57 Q${(x(anchor) + x(time.minutes)) / 2} 0 ${x(time.minutes)} 57`} fill="none" stroke="var(--ck-wereld)" strokeWidth="3" /><text x={(x(anchor) + x(time.minutes)) / 2} y="22" textAnchor="middle">{jump > 0 ? '+' : '−'}{Math.abs(jump)} min</text></>}
      <circle cx={x(time.minutes)} cy="64" r="7" fill="var(--ck-wereld)" />
    </svg>
    <p>{jump === 0 ? `${at(anchor)} is een handig startpunt: een heel of half uur.` : `Vanaf ${at(anchor)} ga je ${Math.abs(jump)} minuten ${jump < 0 ? 'terug' : 'vooruit'}. Dan kom je op ${at(time.minutes)}.`}</p>
    <div className="clock-timeline__jumps" aria-label="Spring met de klok">{moves.map(move => <Button key={move} variant="quiet" size="small" onClick={() => onChange(normalizeClockTime({ ...time, minutes: time.minutes + move }))}>{move < 0 ? '−' : '+'}{Math.abs(move)} min</Button>)}</div>
  </section>;
}
