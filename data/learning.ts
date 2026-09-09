import { CLUSTERS, LOCATIONS, PROVINCES } from '../constants';
import { Location } from '../types';
import { COUNTRY_FLAGS } from './flags';
import { LOCATION_FACTS } from './locationFacts';

export type TopicId = 'provinces' | 'capitals' | 'cities' | 'waters' | 'regions' | 'countries' | 'flags' | 'facts' | 'all';
export type PlayMode = 'find' | 'spell' | 'memory' | 'quiz' | 'master' | 'test';
export interface Selection { areaId: string; topicId: TopicId; clusterId: string }
export interface MemoryPair { id: string; left: string; right: string; kind: 'flag' | 'capital' | 'fact' }
export const DUTCH_PROVINCES = PROVINCES.filter(p => !p.isStudyArea);
export const CONTINENT_IDS = ['europe', 'africa', 'asia', 'north-america', 'south-america', 'oceania', 'antarctica'];
export const TOPIC_LABELS: Record<TopicId, string> = {
  provinces: 'Provincies', capitals: 'Hoofdsteden', cities: 'Steden', waters: 'Wateren',
  regions: 'Gebieden en eilanden', countries: 'Landen', flags: 'Vlaggen', facts: 'Weetjes', all: 'Alles op de kaart',
};
export const MODE_LABELS: Record<PlayMode, string> = {
  find: 'Alleen aanwijzen', spell: 'Alleen spellen', memory: 'Memory', quiz: 'Vlaggenquiz', master: 'Aanwijzen + spellen', test: 'Kaarttoets',
};
export const isDutchArea = (id: string) => id === 'all' || DUTCH_PROVINCES.some(p => p.id === id);
export const areaName = (id: string) => id === 'all' ? 'Nederland' : PROVINCES.find(p => p.id === id)?.name ?? 'Nederland';
const uniqueLocations = (items: Location[]) => [...new Map(items.map(l => [`${l.type}:${l.name}`, l])).values()];

export function areaLocations(areaId: string): Location[] {
  if (areaId === 'all') return uniqueLocations(LOCATIONS.filter(l => isDutchArea(l.provinceId) || l.provinceId === 'water-nl'));
  if (areaId === 'world') return uniqueLocations(LOCATIONS.filter(l => l.provinceId === 'world' || l.provinceId === 'europe'));
  return LOCATIONS.filter(l => l.provinceId === areaId);
}

export function studyLocations({ areaId, topicId, clusterId }: Selection): Location[] {
  if (topicId === 'provinces') return DUTCH_PROVINCES.filter(p => areaId === 'all' || p.id === areaId).map(p => ({
    id: p.id, name: p.name, provinceId: p.id, type: 'province', lat: p.center[0], lng: p.center[1],
  }));
  return areaLocations(areaId).filter(l => {
    if (clusterId !== 'all' && l.clusterId !== clusterId) return false;
    switch (topicId) {
      case 'capitals': return !!l.isCapital;
      case 'cities': return l.type === 'city';
      case 'waters': return l.type === 'water';
      case 'regions': return l.type === 'region';
      case 'flags': return l.type === 'country' && !!COUNTRY_FLAGS[l.name];
      case 'countries': return l.type === 'country';
      case 'facts': return isDutchArea(areaId) && !!LOCATION_FACTS[l.name];
      default: return true;
    }
  });
}

export function availableTopics(areaId: string): TopicId[] {
  const choices: TopicId[] = isDutchArea(areaId)
    ? ['provinces', 'capitals', 'cities', 'waters', 'regions', 'facts', 'all']
    : ['countries', 'capitals', 'flags', 'regions', 'all'];
  return choices.filter(id => (id !== 'provinces' || areaId === 'all') && studyLocations({ areaId, topicId: id, clusterId: 'all' }).length > 0);
}

export function validateSelection(value?: Partial<Selection> | null): Selection {
  const areaId = value?.areaId === 'all' || PROVINCES.some(p => p.id === value?.areaId && p.id !== 'water-nl') ? value!.areaId! : 'all';
  const topics = availableTopics(areaId);
  const topicId = topics.includes(value?.topicId as TopicId) ? value!.topicId! : topics[0];
  const clusterId = CLUSTERS.some(c => c.provinceId === areaId && c.id === value?.clusterId) ? value!.clusterId! : 'all';
  const result = { areaId, topicId, clusterId };
  return studyLocations(result).length ? result : { ...result, clusterId: 'all' };
}

export function memoryPairs(selection: Selection): MemoryPair[] {
  const { areaId, topicId } = selection;
  const factPairs = () => studyLocations(selection).flatMap(location => {
    const fact = LOCATION_FACTS[location.name]?.fact;
    return fact ? [{ id: `fact:${location.name}`, left: location.name, right: fact, kind: 'fact' as const }] : [];
  });
  const capitalPairs = () => areaLocations(areaId).filter(l => l.type === 'country').flatMap(country => {
    const capital = LOCATIONS.find(l => l.id === `cap-${country.id}`);
    return capital ? [{ id: `country-capital:${country.name}`, left: country.name, right: capital.name, kind: 'capital' as const }] : [];
  });

  if (topicId === 'flags') return studyLocations(selection).map(l => ({ id: `flag:${l.name}`, left: l.name, right: COUNTRY_FLAGS[l.name], kind: 'flag' }));
  if (topicId === 'facts') return factPairs();
  if (topicId === 'provinces' || (topicId === 'capitals' && isDutchArea(areaId))) {
    return DUTCH_PROVINCES.filter(p => areaId === 'all' || p.id === areaId).map(p => ({ id: `province-capital:${p.id}`, left: p.name, right: p.capital, kind: 'capital' }));
  }
  if (topicId === 'countries' || topicId === 'capitals' || (topicId === 'all' && !isDutchArea(areaId))) return capitalPairs();
  if (topicId === 'cities' || topicId === 'waters' || topicId === 'regions' || topicId === 'all') return factPairs();
  return [];
}

export function availableModes(selection: Selection): PlayMode[] {
  const pairs = memoryPairs(selection);
  if (selection.topicId === 'flags') return pairs.length >= 2 ? ['quiz', 'memory'] : [];
  if (selection.topicId === 'facts') return pairs.length >= 2 ? ['memory'] : ['find', 'spell'];
  return ['find', 'spell', ...(pairs.length >= 2 ? ['memory' as const] : []), 'master', 'test'];
}

export const locationProgressKey = (location: Location) => `map:${isDutchArea(location.provinceId) ? 'nl:' : ''}${location.type}:${location.name}`;

export function locationContext(location: Location): string {
  if (location.type === 'province') return `Provincie in Nederland`;
  if (location.isCapital) {
    if (isDutchArea(location.provinceId)) return `Hoofdstad van ${areaName(location.provinceId)}`;
    const country = LOCATIONS.find(l => l.id === location.id.replace(/^cap-/, ''));
    if (country) return `Hoofdstad van ${country.name}`;
  }
  if (location.type === 'country') {
    const capital = LOCATIONS.find(l => l.id === `cap-${location.id}`);
    if (capital) return `Hoofdstad: ${capital.name}`;
  }
  return areaName(location.provinceId);
}
