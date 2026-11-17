import { LOCATIONS } from '../constants';
import { locationProgressKey } from '../data/learning';
import { readProgress, type Progress } from './localProgress';

/** A successful answer discovers a place. No duplicate collection or rewards. */
export function discoveredPlaces(progress: Progress = readProgress()) {
  const seen = new Set<string>();
  return LOCATIONS.filter(place => {
    const key = locationProgressKey(place);
    if (seen.has(key) || !(progress[key]?.correct > 0)) return false;
    seen.add(key);
    return true;
  });
}
