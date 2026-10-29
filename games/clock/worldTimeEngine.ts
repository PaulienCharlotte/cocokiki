import type { ClockLevel } from './types';

export const WORLD_CITIES = [
  { id: 'amsterdam', name: 'Amsterdam', country: 'Nederland', zone: 'Europe/Amsterdam' },
  { id: 'london', name: 'Londen', country: 'Verenigd Koninkrijk', zone: 'Europe/London' },
  { id: 'paris', name: 'Parijs', country: 'Frankrijk', zone: 'Europe/Paris' },
  { id: 'new-york', name: 'New York', country: 'Verenigde Staten', zone: 'America/New_York' },
  { id: 'los-angeles', name: 'Los Angeles', country: 'Verenigde Staten', zone: 'America/Los_Angeles' },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazilië', zone: 'America/Sao_Paulo' },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenia', zone: 'Africa/Nairobi' },
  { id: 'tokyo', name: 'Tokio', country: 'Japan', zone: 'Asia/Tokyo' },
  { id: 'delhi', name: 'New Delhi', country: 'India', zone: 'Asia/Kolkata' },
  { id: 'kathmandu', name: 'Kathmandu', country: 'Nepal', zone: 'Asia/Kathmandu' },
  { id: 'sydney', name: 'Sydney', country: 'Australië', zone: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland', country: 'Nieuw-Zeeland', zone: 'Pacific/Auckland' },
  { id: 'honolulu', name: 'Honolulu', country: 'Verenigde Staten', zone: 'Pacific/Honolulu' },
] as const;
export type WorldCity = typeof WORLD_CITIES[number];
export const WORLD_LEVEL_LABELS: Record<ClockLevel, string> = {
  1: 'Dicht bij huis', 2: 'De wereld rond', 3: 'Van stad naar stad', 4: 'Halve tijdzones', 5: 'Kwartiertijdzones',
};

// Intl gebruikt de tijdzoneregels van het apparaat, ook tijdens zomer-/wintertijd.
export function cityTime(instant: number, city: WorldCity) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: city.zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const hours = get('hour'), minutes = get('minute');
  const day = Date.UTC(get('year'), get('month') - 1, get('day')) / 86400000;
  return {
    hours, minutes, day,
    digital: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    date: new Intl.DateTimeFormat('nl-NL', { timeZone: city.zone, weekday: 'long', day: 'numeric', month: 'long' }).format(instant),
    offset: (day * 86400000 + (hours * 60 + minutes) * 60000 - Math.floor(instant / 60000) * 60000) / 60000,
  };
}

export function timeDifferenceText(minutes: number) {
  if (!minutes) return 'dezelfde tijd';
  const value = Math.abs(minutes), hours = Math.floor(value / 60), rest = value % 60;
  return `${[hours ? `${hours} uur` : '', rest ? `${rest} minuten` : ''].filter(Boolean).join(' en ')} ${minutes > 0 ? 'later' : 'eerder'}`;
}
export function relativeDayText(days: number) {
  return days === 0 ? 'Dezelfde dag' : days === 1 ? 'Een dag later' : days === -1 ? 'Een dag eerder' : `${Math.abs(days)} dagen ${days > 0 ? 'later' : 'eerder'}`;
}

export interface WorldTimeQuestion { from: WorldCity; to: WorldCity; instant: number }
export function createWorldTimeQuestion(level: ClockLevel, index: number, now = Date.now(), random = Math.random): WorldTimeQuestion {
  const whole = WORLD_CITIES.filter(city => city.id !== 'delhi' && city.id !== 'kathmandu');
  const targets = level === 1 ? whole.filter(city => ['london', 'nairobi'].includes(city.id))
    : level === 4 ? WORLD_CITIES.filter(city => city.id === 'delhi')
    : level === 5 ? WORLD_CITIES.filter(city => city.id === 'kathmandu')
    : whole.filter(city => !['amsterdam', 'paris'].includes(city.id));
  const to = targets[(index + Math.floor(random() * targets.length)) % targets.length];
  const sources = level === 3 ? whole.filter(city => city.id !== to.id) : [WORLD_CITIES[0]];
  const from = sources[Math.floor(random() * sources.length)];
  const date = new Date(now), step = [60, 30, 15, 5, 1][level - 1];
  const instant = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), Math.floor(random() * 24), Math.floor(random() * (60 / step)) * step);
  return { from, to, instant };
}

export function correctWorldTime(question: WorldTimeQuestion, time: string, day: number): boolean {
  const source = cityTime(question.instant, question.from), target = cityTime(question.instant, question.to);
  return time === target.digital && day === target.day - source.day;
}
export function worldTimeHint(question: WorldTimeQuestion) {
  const source = cityTime(question.instant, question.from), target = cityTime(question.instant, question.to);
  const delta = target.offset - source.offset;
  return `In ${question.to.name} is het ${timeDifferenceText(delta)}. ${delta === 0 ? 'De klokken staan gelijk.' : `${delta > 0 ? 'Tel het tijdverschil op bij' : 'Trek het tijdverschil af van'} ${source.digital}.`} Voorbij 24:00 begint een nieuwe dag; vóór 00:00 ga je een dag terug.`;
}
