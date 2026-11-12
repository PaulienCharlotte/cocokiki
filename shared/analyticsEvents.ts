// Explicit allowlist shared by the browser and the ingestion function.
export const ACTIVITY_IDS = [
  'math:multiply', 'math:divide', 'math:add-subtract', 'math:missing', 'math:balance', 'math:race',
  'clock:memory', 'clock:set-clock', 'clock:race', 'clock:world-times',
  'topo:find', 'topo:spell', 'topo:master', 'topo:memory', 'topo:quiz', 'topo:test',
  'flags-memory', 'red-baby-lua', 'cooking:banana-pancakes', 'cooking:blueberry-muffins',
  'cooking:fruit-yogurt', 'plant-clinic',
] as const;
export type ActivityId = typeof ACTIVITY_IDS[number];
export type AnalyticsEvent = { id: string; event_type: 'session_started' | 'activity_started' | 'activity_completed'; activity_id: ActivityId | null };
export function validAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as AnalyticsEvent;
  return Object.keys(value).sort().join(',') === 'activity_id,event_type,id'
    && typeof event.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(event.id)
    && (event.event_type === 'session_started' ? event.activity_id === null
      : (event.event_type === 'activity_started' || event.event_type === 'activity_completed') && ACTIVITY_IDS.includes(event.activity_id));
}
