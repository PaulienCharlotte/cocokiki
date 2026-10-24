import type { ClockAngles, ClockLevel, ClockTime, MemoryCardData, RaceRound } from './types';

const HOUR_WORDS = ['twaalf', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf'] as const;
const LEVEL_MINUTES: Record<ClockLevel, number[]> = {
  1: [0],
  2: [0, 30],
  3: [0, 15, 30, 45],
  4: Array.from({ length: 12 }, (_, index) => index * 5),
  5: Array.from({ length: 60 }, (_, index) => index),
};

export function normalizeClockTime(time: ClockTime): ClockTime {
  const total = ((Math.round(time.hours) * 60 + Math.round(time.minutes)) % 1440 + 1440) % 1440;
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export function clockTimeKey(time: ClockTime): string {
  const normalized = normalizeClockTime(time);
  return `${normalized.hours % 12}:${normalized.minutes}`;
}

export function clockAngles(time: ClockTime): ClockAngles {
  const normalized = normalizeClockTime(time);
  return {
    minute: normalized.minutes * 6,
    hour: (normalized.hours % 12) * 30 + normalized.minutes * 0.5,
  };
}

export function formatDigitalTime(time: ClockTime): string {
  const normalized = normalizeClockTime(time);
  return `${String(normalized.hours).padStart(2, '0')}:${String(normalized.minutes).padStart(2, '0')}`;
}

function hourWord(hour: number): string {
  return HOUR_WORDS[((hour % 12) + 12) % 12];
}

function minutesLabel(minutes: number): string {
  return `${minutes} ${minutes === 1 ? 'minuut' : 'minuten'}`;
}

export function formatDutchTime(time: ClockTime): string {
  const { hours, minutes } = normalizeClockTime(time);
  const current = hourWord(hours);
  const next = hourWord(hours + 1);
  const fixed: Partial<Record<number, string>> = {
    0: `${current} uur`,
    5: `vijf over ${current}`,
    10: `tien over ${current}`,
    15: `kwart over ${current}`,
    20: `tien voor half ${next}`,
    25: `vijf voor half ${next}`,
    30: `half ${next}`,
    35: `vijf over half ${next}`,
    40: `tien over half ${next}`,
    45: `kwart voor ${next}`,
    50: `tien voor ${next}`,
    55: `vijf voor ${next}`,
  };
  if (fixed[minutes]) return fixed[minutes]!;
  if (minutes < 15) return `${minutesLabel(minutes)} over ${current}`;
  if (minutes < 30) return `${minutesLabel(30 - minutes)} voor half ${next}`;
  if (minutes < 45) return `${minutesLabel(minutes - 30)} over half ${next}`;
  return `${minutesLabel(60 - minutes)} voor ${next}`;
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length) % items.length];
}

export function generateTime(level: ClockLevel, random: () => number = Math.random): ClockTime {
  return { hours: 1 + Math.floor(random() * 12), minutes: pick(LEVEL_MINUTES[level], random) };
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function generateDistinctTimes(count: number, level: ClockLevel, random: () => number = Math.random): ClockTime[] {
  const times: ClockTime[] = [];
  let attempts = 0;
  while (times.length < count && attempts < 500) {
    const candidate = generateTime(level, random);
    if (!times.some(time => clockTimeKey(time) === clockTimeKey(candidate))) times.push(candidate);
    attempts += 1;
  }
  if (times.length < count) throw new Error(`Kon geen ${count} unieke kloktijden maken voor niveau ${level}.`);
  return times;
}

export function createMemoryDeck(level: ClockLevel, pairCount = 6, random: () => number = Math.random): MemoryCardData[] {
  const cards = generateDistinctTimes(pairCount, level, random).flatMap((time, index) => {
    const pairId = `pair-${index}-${clockTimeKey(time)}`;
    return [
      { id: `${pairId}-analog`, pairId, kind: 'analog' as const, time },
      { id: `${pairId}-digital`, pairId, kind: 'digital' as const, time },
    ];
  });
  return shuffle(cards, random);
}

function addMinutes(time: ClockTime, minutes: number): ClockTime {
  return normalizeClockTime({ hours: time.hours, minutes: time.minutes + minutes });
}

export function plausibleDistractors(target: ClockTime, level: ClockLevel): ClockTime[] {
  const normalized = normalizeClockTime(target);
  const offsets = level === 1 ? [60, -60, 120, -120] : level === 2 ? [30, 60, -30, -60] : level === 3 ? [15, -15, 30, 60] : [5, -5, 15, -15, 30, 60];
  const candidates = [
    ...offsets.map(offset => addMinutes(normalized, offset)),
    normalizeClockTime({ hours: normalized.hours + 1, minutes: normalized.minutes }),
    normalizeClockTime({ hours: normalized.hours - 1, minutes: normalized.minutes }),
  ];
  return candidates.filter((candidate, index, all) =>
    clockTimeKey(candidate) !== clockTimeKey(normalized)
    && all.findIndex(other => clockTimeKey(other) === clockTimeKey(candidate)) === index
  );
}

export function createRaceRound(level: ClockLevel, random: () => number = Math.random): RaceRound {
  const target = generateTime(level, random);
  const wrong = shuffle(plausibleDistractors(target, level), random).slice(0, 2);
  return { target, options: shuffle([target, ...wrong], random) };
}

export function sameClockTime(left: ClockTime, right: ClockTime): boolean {
  return clockTimeKey(left) === clockTimeKey(right);
}

export function minuteStepForLevel(level: ClockLevel): number {
  if (level === 1) return 60;
  if (level === 2) return 30;
  if (level === 3) return 15;
  if (level === 4) return 5;
  return 1;
}

export function continueMinuteDrag(totalMinutes: number, previousAngle: number, nextAngle: number, step: number): { totalMinutes: number; snappedTotalMinutes: number; angle: number } {
  let delta = nextAngle - previousAngle;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  const nextTotal = totalMinutes + delta / 6;
  return {
    totalMinutes: nextTotal,
    snappedTotalMinutes: Math.round(nextTotal / step) * step,
    angle: nextAngle,
  };
}
