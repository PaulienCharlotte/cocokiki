import type { OvenConfig, OvenResult, OvenState } from './preparation';

export const emptyOven = (): OvenState => ({ temperature: 0, actualTemperature: 20, powered: false, preheated: false, doorOpen: false, trayPlaced: false, chosenMinutes: 0, elapsedMinutes: 0, status: 'idle', result: null, coolingElapsed: 0, heatExposure: 0 });
const number = (value: unknown, fallback: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback;
export function restoreOven(value: unknown): OvenState {
  const base = emptyOven();
  if (!value || typeof value !== 'object') return base;
  const v = value as Partial<OvenState>;
  return { ...base, temperature: number(v.temperature, 0, 260), actualTemperature: number(v.actualTemperature, 20, 260),
    powered: v.powered === true, preheated: v.preheated === true, doorOpen: v.doorOpen === true, trayPlaced: v.trayPlaced === true,
    chosenMinutes: number(v.chosenMinutes, 0, 90), elapsedMinutes: number(v.elapsedMinutes, 0, 90), heatExposure: number(v.heatExposure, 0, 30000),
    coolingElapsed: number(v.coolingElapsed, 0, 300), result: ['underdone', 'good', 'dark'].includes(v.result ?? '') ? v.result! : null,
    status: ['idle', 'preheating', 'ready', 'baking', 'finished', 'cooling', 'served'].includes(v.status ?? '') ? v.status! : 'idle' };
}
export function ovenResult(state: OvenState, config: OvenConfig): OvenResult {
  const average = state.elapsedMinutes > 0 ? state.heatExposure / state.elapsedMinutes : 0;
  if (average > config.targetTemperature + config.temperatureTolerance || state.elapsedMinutes > config.maximumMinutes + 2) return 'dark';
  if (average < config.targetTemperature - config.temperatureTolerance || state.elapsedMinutes < config.minimumMinutes) return 'underdone';
  return 'good';
}
export function ovenCanStart(state: OvenState, config: OvenConfig): boolean {
  return state.powered && state.preheated && state.actualTemperature >= state.temperature - 2 && state.trayPlaced && !state.doorOpen && state.chosenMinutes > state.elapsedMinutes && config.gameSecondsPerMinute > 0;
}
// Only foreground ticks advance time. No wall-clock deadline is restored after leaving.
export function tickOven(state: OvenState, config: OvenConfig, seconds: number): OvenState {
  const dt = Math.max(0, Math.min(1, seconds));
  if (!dt) return state;
  const next = { ...state };
  const target = state.powered ? (state.doorOpen ? 20 : state.temperature) : 20;
  const direction = Math.sign(target - state.actualTemperature);
  next.actualTemperature = state.actualTemperature + direction * Math.min(Math.abs(target - state.actualTemperature), config.preheatDegreesPerSecond * dt);
  next.preheated = state.powered && !state.doorOpen && next.actualTemperature >= state.temperature - 2;
  if (state.status === 'preheating' && next.preheated) next.status = 'ready';
  if (state.status === 'baking' && state.powered && !state.doorOpen && state.trayPlaced) {
    const minutes = Math.min(dt / config.gameSecondsPerMinute, Math.max(0, state.chosenMinutes - state.elapsedMinutes));
    next.elapsedMinutes += minutes;
    next.heatExposure += (state.actualTemperature + next.actualTemperature) / 2 * minutes;
    if (next.elapsedMinutes >= state.chosenMinutes - .00001) { next.elapsedMinutes = state.chosenMinutes; next.status = 'finished'; next.result = ovenResult(next, config); }
  }
  if (state.status === 'cooling') {
    next.coolingElapsed += dt;
    if (next.coolingElapsed >= config.coolingSeconds) next.status = 'served';
  }
  return next;
}
