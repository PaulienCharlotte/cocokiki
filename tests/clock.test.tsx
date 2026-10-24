import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AnalogClock from '../games/clock/AnalogClock';
import ClockHub from '../games/clock/ClockHub';
import ClockRaceGame from '../games/clock/ClockRaceGame';
import SetClockGame from '../games/clock/SetClockGame';
import { clockAngles, continueMinuteDrag, createMemoryDeck, createRaceRound, formatDigitalTime, formatDutchTime, generateTime, minuteStepForLevel, normalizeClockTime, plausibleDistractors, sameClockTime } from '../games/clock/timeEngine';
import { clockLevelReward, completeClockLevel, createEmptyClockProgress, migrateClockProgress } from '../games/clock/clockProgress';
import type { ClockLevel } from '../games/clock/types';

test('analog clock angles are exact for the required verification times', () => {
  assert.deepEqual(clockAngles({ hours: 3, minutes: 0 }), { hour: 90, minute: 0 });
  assert.deepEqual(clockAngles({ hours: 6, minutes: 30 }), { hour: 195, minute: 180 });
  assert.deepEqual(clockAngles({ hours: 7, minutes: 20 }), { hour: 220, minute: 120 });
  assert.deepEqual(clockAngles({ hours: 9, minutes: 45 }), { hour: 292.5, minute: 270 });
  assert.deepEqual(clockAngles({ hours: 12, minutes: 0 }), { hour: 0, minute: 0 });
});

test('Dutch clock language follows common half-hour conventions', () => {
  assert.equal(formatDutchTime({ hours: 6, minutes: 30 }), 'half zeven');
  assert.equal(formatDutchTime({ hours: 7, minutes: 20 }), 'tien voor half acht');
  assert.equal(formatDutchTime({ hours: 7, minutes: 45 }), 'kwart voor acht');
  assert.equal(formatDutchTime({ hours: 15, minutes: 15 }), 'kwart over drie');
  assert.equal(formatDutchTime({ hours: 3, minutes: 1 }), '1 minuut over drie');
  assert.equal(formatDigitalTime({ hours: 7, minutes: 5 }), '07:05');
});

test('every difficulty generates times from its configured interval', () => {
  const samples = [0, .17, .38, .59, .82, .99];
  for (const level of [1, 2, 3, 4, 5] as ClockLevel[]) {
    let index = 0;
    const random = () => samples[index++ % samples.length];
    const times = Array.from({ length: 18 }, () => generateTime(level, random));
    if (level === 1) assert.ok(times.every(time => time.minutes === 0));
    if (level === 2) assert.ok(times.every(time => [0, 30].includes(time.minutes)));
    if (level === 3) assert.ok(times.every(time => time.minutes % 15 === 0));
    if (level === 4) assert.ok(times.every(time => time.minutes % 5 === 0));
    assert.ok(times.every(time => time.hours >= 1 && time.hours <= 12));
  }
});

test('memory decks contain unique analog and digital pairs', () => {
  let seed = 7;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const deck = createMemoryDeck(5, 6, random);
  assert.equal(deck.length, 12);
  const pairs = [...new Set(deck.map(card => card.pairId))];
  assert.equal(pairs.length, 6);
  for (const pair of pairs) assert.deepEqual(deck.filter(card => card.pairId === pair).map(card => card.kind).sort(), ['analog', 'digital']);
});

test('race rounds contain one answer and plausible unique distractors', () => {
  const round = createRaceRound(4, () => .42);
  assert.equal(round.options.length, 3);
  assert.equal(round.options.filter(option => sameClockTime(option, round.target)).length, 1);
  assert.equal(new Set(round.options.map(time => `${time.hours % 12}:${time.minutes}`)).size, 3);
  assert.ok(plausibleDistractors(round.target, 4).every(option => !sameClockTime(option, round.target)));
  assert.ok(plausibleDistractors({ hours: 8, minutes: 0 }, 1).every(option => option.minutes === 0));
});

test('minute dragging snaps per level and crosses twelve in both directions', () => {
  assert.deepEqual(([1, 2, 3, 4, 5] as ClockLevel[]).map(minuteStepForLevel), [60, 30, 15, 5, 1]);
  const forward = continueMinuteDrag(7 * 60 + 55, 330, 0, 5);
  assert.deepEqual(normalizeClockTime({ hours: 0, minutes: forward.snappedTotalMinutes }), { hours: 8, minutes: 0 });
  const backward = continueMinuteDrag(8 * 60, 0, 330, 5);
  assert.deepEqual(normalizeClockTime({ hours: 0, minutes: backward.snappedTotalMinutes }), { hours: 7, minutes: 55 });
  const midnight = continueMinuteDrag(23 * 60 + 55, 330, 0, 5);
  assert.deepEqual(normalizeClockTime({ hours: 0, minutes: midnight.snappedTotalMinutes }), { hours: 0, minutes: 0 });
});

test('clock progress migrates safely and completes each level once', () => {
  const empty = createEmptyClockProgress();
  const first = completeClockLevel(empty, 'memory', 2);
  assert.equal(first.firstCompletion, true);
  assert.deepEqual(first.progress.completed.memory, [2]);
  const duplicate = completeClockLevel(first.progress, 'memory', 2);
  assert.equal(duplicate.firstCompletion, false);
  assert.equal(duplicate.progress, first.progress);
  assert.deepEqual(migrateClockProgress({ completed: { memory: [2, 2, 9], race: [1], 'set-clock': 'broken' } }).completed, { memory: [2], 'set-clock': [], race: [1] });
  assert.deepEqual(([1, 2, 3, 4, 5] as ClockLevel[]).map(clockLevelReward), [5, 7, 9, 11, 13]);
});

test('clock components expose one shared SVG clock and accessible controls', () => {
  const clock = renderToStaticMarkup(<AnalogClock time={{ hours: 7, minutes: 20 }} interactive onChange={() => undefined} />);
  assert.match(clock, /viewBox="0 0 240 240"/);
  assert.match(clock, /rotate\(220 120 120\)/);
  assert.match(clock, /rotate\(120 120 120\)/);
  assert.match(clock, /tien voor half acht, 07:20/);

  const progress = createEmptyClockProgress();
  const hub = renderToStaticMarkup(<ClockHub progress={progress} onPlay={() => undefined} />);
  assert.match(hub, /Klokmemory/);
  assert.match(hub, /Zet de klok/);
  assert.match(hub, /Klokkenrace/);

  const setClock = renderToStaticMarkup(<SetClockGame initialLevel={3} completedLevels={[]} onBack={() => undefined} onComplete={() => 0} />);
  assert.match(setClock, /Controleer/);
  assert.match(setClock, /Hint/);
  assert.match(setClock, /Een uur verder/);
  assert.match(setClock, /15 minuten verder/);
  assert.match(setClock, /Niveaus/);
  assert.match(setClock, /Niveau 3 · Kwartieren/);
  assert.match(setClock, /data-clock-hand="hour"/);
  assert.match(setClock, /data-clock-hand="minute"/);

  const race = renderToStaticMarkup(<ClockRaceGame initialLevel={4} completedLevels={[]} onBack={() => undefined} onComplete={() => 0} />);
  assert.match(race, /Analoog/);
  assert.match(race, /Digitaal/);
  assert.match(race, /Allebei/);
});
