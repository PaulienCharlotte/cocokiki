import React, { useId, useRef, useState } from 'react';
import { clockAngles, continueMinuteDrag, formatDigitalTime, formatDutchTime, minuteStepForLevel, normalizeClockTime } from './timeEngine';
import type { ClockLevel, ClockTime } from './types';

type ClockColor = 'blue' | 'coral' | 'green' | 'wood';

interface AnalogClockProps {
  time: ClockTime;
  color?: ClockColor;
  className?: string;
  alarm?: boolean;
  interactive?: boolean;
  level?: ClockLevel;
  onChange?: (time: ClockTime) => void;
}

const COLORS: Record<ClockColor, { frame: string; edge: string; minute: string; hour: string }> = {
  blue: { frame: '#69aec7', edge: '#39788e', minute: '#397f99', hour: '#5f7854' },
  coral: { frame: '#dc7778', edge: '#a24f57', minute: '#b65d63', hour: '#527d72' },
  green: { frame: '#7fa66b', edge: '#547448', minute: '#4d846f', hour: '#b45f55' },
  wood: { frame: '#c88b4e', edge: '#8e5e35', minute: '#3e7d96', hour: '#648253' },
};

interface DragState {
  hand: 'hour' | 'minute';
  pointerId: number;
  angle: number;
  totalMinutes: number;
}

function pointerAngle(event: Pick<PointerEvent, 'clientX' | 'clientY'>, svg: SVGSVGElement): number {
  const matrix = svg.getScreenCTM();
  if (!matrix) return 0;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(matrix.inverse());
  return (Math.atan2(local.y - 120, local.x - 120) * 180 / Math.PI + 90 + 360) % 360;
}

export default function AnalogClock({ time, color = 'wood', className = '', alarm = false, interactive = false, level = 5, onChange }: AnalogClockProps) {
  const [dragging, setDragging] = useState<'hour' | 'minute' | null>(null);
  const drag = useRef<DragState | null>(null);
  const filterId = `clock-shadow-${useId().replace(/:/g, '')}`;
  const normalized = normalizeClockTime(time);
  const angles = clockAngles(normalized);
  const palette = COLORS[color];

  const updateFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId || !onChange) return;
    event.preventDefault();
    const angle = pointerAngle(event.nativeEvent, event.currentTarget);
    if (active.hand === 'minute') {
      const step = minuteStepForLevel(level);
      const next = continueMinuteDrag(active.totalMinutes, active.angle, angle, step);
      drag.current = { ...active, angle: next.angle, totalMinutes: next.totalMinutes };
      onChange(normalizeClockTime({ hours: 0, minutes: next.snappedTotalMinutes }));
    } else {
      const twelveHour = Math.round((angle - normalized.minutes * 0.5) / 30 + 12) % 12;
      const candidates = [twelveHour, twelveHour + 12, twelveHour + 24];
      const hours = candidates.reduce((closest, candidate) => Math.abs(candidate - normalized.hours) < Math.abs(closest - normalized.hours) ? candidate : closest);
      onChange(normalizeClockTime({ ...normalized, hours }));
    }
  };

  const beginDrag = (hand: 'hour' | 'minute') => (event: React.PointerEvent<SVGLineElement>) => {
    if (!interactive) return;
    event.preventDefault();
    event.stopPropagation();
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const angle = pointerAngle(event.nativeEvent, svg);
    drag.current = { hand, pointerId: event.pointerId, angle, totalMinutes: normalized.hours * 60 + normalized.minutes };
    setDragging(hand);
    svg.setPointerCapture(event.pointerId);
  };

  const endDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setDragging(null);
  };

  return <svg
    className={`analog-clock analog-clock--${color}${interactive ? ' is-interactive' : ''}${dragging ? ' is-dragging' : ''} ${className}`.trim()}
    viewBox="0 0 240 240"
    role="img"
    aria-label={`${formatDutchTime(normalized)}, ${formatDigitalTime(normalized)}`}
    onPointerMove={updateFromPointer}
    onPointerUp={endDrag}
    onPointerCancel={endDrag}
  >
    <defs>
      <filter id={filterId} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#563b2b" floodOpacity=".24" />
      </filter>
    </defs>
    {alarm && <g className="analog-clock__alarm" filter={`url(#${filterId})`}>
      <path d="M50 49 28 32Q18 23 29 15t18 2l19 22Z" fill="#eebd50" stroke="#a97028" strokeWidth="5" />
      <path d="m190 49 22-17q10-9-1-17t-18 2l-19 22Z" fill="#eebd50" stroke="#a97028" strokeWidth="5" />
      <path d="M70 208 54 228M170 208l16 20" stroke="#a97028" strokeWidth="11" strokeLinecap="round" />
    </g>}
    <circle cx="120" cy="120" r="101" fill={palette.frame} stroke={palette.edge} strokeWidth="6" filter={`url(#${filterId})`} />
    <circle cx="120" cy="120" r="88" fill="#fff4dc" stroke="#f0d7b5" strokeWidth="3" />
    {Array.from({ length: 60 }, (_, index) => {
      const angle = index * 6 * Math.PI / 180;
      const inner = index % 5 === 0 ? 80 : 83;
      return <line key={index} x1={120 + Math.sin(angle) * inner} y1={120 - Math.cos(angle) * inner} x2={120 + Math.sin(angle) * 85} y2={120 - Math.cos(angle) * 85} stroke={index % 5 === 0 ? '#70503c' : '#c9a987'} strokeWidth={index % 5 === 0 ? 2.3 : 1.2} strokeLinecap="round" />;
    })}
    {Array.from({ length: 12 }, (_, index) => {
      const number = index + 1;
      const angle = number * 30 * Math.PI / 180;
      return <text key={number} x={120 + Math.sin(angle) * 67} y={125 - Math.cos(angle) * 67} textAnchor="middle" fill="#5a3d2f" fontSize="15" fontWeight="800">{number}</text>;
    })}
    <g transform={`rotate(${angles.hour} 120 120)`}>
      <line x1="120" y1="129" x2="120" y2="77" stroke={palette.hour} strokeWidth="10" strokeLinecap="round" />
      {interactive && <line data-clock-hand="hour" className="analog-clock__drag-target" x1="120" y1="135" x2="120" y2="67" stroke="transparent" strokeWidth="32" onPointerDown={beginDrag('hour')} />}
    </g>
    <g transform={`rotate(${angles.minute} 120 120)`}>
      <line x1="120" y1="132" x2="120" y2="52" stroke={palette.minute} strokeWidth="7" strokeLinecap="round" />
      {interactive && <line data-clock-hand="minute" className="analog-clock__drag-target" x1="120" y1="138" x2="120" y2="43" stroke="transparent" strokeWidth="30" onPointerDown={beginDrag('minute')} />}
    </g>
    <circle cx="120" cy="120" r="10" fill="#ef9e3f" stroke="#b96d2d" strokeWidth="3" />
  </svg>;
}
