import { useEffect, useState } from 'react';
import { commitLocalState, readDocument, subscribeLocalState } from './localState';

export const WORLD_LIGHT_KEY = 'cocokiki:world-light:v1';
export function loadWorldNight(): boolean {
  try {
    const saved = readDocument(WORLD_LIGHT_KEY);
    if (saved === 'night' || saved === 'day') return saved === 'night';
  } catch { /* Zonder opslag volgt de wereld de klok. */ }
  const hour = new Date().getHours();
  return hour < 7 || hour >= 19;
}
/** Eiland en boomhut delen dezelfde keuze, ook na terugnavigeren. */
export function useWorldLight() {
  const [night, setNight] = useState(loadWorldNight);
  useEffect(() => subscribeLocalState(() => setNight(loadWorldNight()), WORLD_LIGHT_KEY), []);
  const toggleNight = () => {
    const next = !night;
    setNight(next);
    commitLocalState({ [WORLD_LIGHT_KEY]: next ? 'night' : 'day' });
  };
  return { night, toggleNight };
}
