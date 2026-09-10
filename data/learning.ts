import { CLUSTERS, LOCATIONS, PROVINCES } from '../constants';
import { Location } from '../types';
import { COUNTRY_FLAGS } from './flags';
import { LOCATION_FACTS } from './locationFacts';

export type TopicId = 'provinces' | 'capitals' | 'cities' | 'waters' | 'regions' | 'countries' | 'flags' | 'facts' | 'all';
export type PlayMode = 'find' | 'spell' | 'memory' | 'quiz' | 'master' | 'test';
export interface Selection { areaId: string; topicId: TopicId; clusterId: string }
export interface MemoryPair { id: string; left: string; right: string; kind: 'flag' | 'capital' | 'fact' }
export interface LearningGroup { id: string; name: string; icon: string; count: number; locations: string[] }
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
const MAX_GROUP_SIZE = 6;
const TARGET_GROUP_SIZE = 5;

export function areaLocations(areaId: string): Location[] {
  if (areaId === 'all') return uniqueLocations(LOCATIONS.filter(l => isDutchArea(l.provinceId) || l.provinceId === 'water-nl'));
  if (areaId === 'world') return uniqueLocations(LOCATIONS.filter(l => l.provinceId === 'world' || l.provinceId === 'europe'));
  return LOCATIONS.filter(l => l.provinceId === areaId);
}

function topicLocations(areaId: string, topicId: TopicId): Location[] {
  if (topicId === 'provinces') return DUTCH_PROVINCES.filter(p => areaId === 'all' || p.id === areaId).map(p => ({
    id: p.id, name: p.name, provinceId: p.id, type: 'province', lat: p.center[0], lng: p.center[1],
  }));
  return areaLocations(areaId).filter(l => {
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

function circularMeanLongitude(items: Location[]): number {
  const radians = items.map(item => item.lng * Math.PI / 180);
  const sin = radians.reduce((sum, value) => sum + Math.sin(value), 0);
  const cos = radians.reduce((sum, value) => sum + Math.cos(value), 0);
  return Math.atan2(sin, cos) * 180 / Math.PI;
}

function longitudeDelta(value: number, origin: number): number {
  return ((value - origin + 540) % 360) - 180;
}

function balancedGroupSizes(itemCount: number): number[] {
  if (itemCount <= MAX_GROUP_SIZE) return [itemCount];
  const groupCount = Math.ceil(itemCount / TARGET_GROUP_SIZE);
  const baseSize = Math.floor(itemCount / groupCount);
  const largerGroups = itemCount % groupCount;
  return Array.from({ length: groupCount }, (_, index) => baseSize + Number(index < largerGroups));
}

// Repeatedly split along the longest geographic direction. This keeps every
// learning set local while the balanced sizes prevent tiny remainder sets.
function sortAlongMainDirection(items: Location[]): Location[] {
  const meanLat = items.reduce((sum, item) => sum + item.lat, 0) / items.length;
  const meanLng = circularMeanLongitude(items);
  const lngScale = Math.max(0.1, Math.cos(meanLat * Math.PI / 180));
  const points = items.map(item => ({
    item,
    x: longitudeDelta(item.lng, meanLng) * lngScale,
    y: item.lat - meanLat,
  }));
  const xx = points.reduce((sum, point) => sum + point.x * point.x, 0);
  const yy = points.reduce((sum, point) => sum + point.y * point.y, 0);
  const xy = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const angle = Math.atan2(2 * xy, xx - yy) / 2;
  const axisX = Math.cos(angle);
  const axisY = Math.sin(angle);
  return points
    .sort((left, right) =>
      (left.x * axisX + left.y * axisY) - (right.x * axisX + right.y * axisY) ||
      left.item.name.localeCompare(right.item.name, 'nl')
    )
    .map(point => point.item);
}

function splitSpatially(items: Location[], sizes: number[]): Location[][] {
  if (sizes.length === 1) return [[...items].sort((a, b) => a.name.localeCompare(b.name, 'nl'))];
  const leftGroupCount = Math.floor(sizes.length / 2);
  const leftSizes = sizes.slice(0, leftGroupCount);
  const leftItemCount = leftSizes.reduce((sum, size) => sum + size, 0);
  const ordered = sortAlongMainDirection(items);
  return [
    ...splitSpatially(ordered.slice(0, leftItemCount), leftSizes),
    ...splitSpatially(ordered.slice(leftItemCount), sizes.slice(leftGroupCount)),
  ];
}

function distanceSquared(left: Location, right: Location): number {
  const meanLat = (left.lat + right.lat) / 2;
  const latDistance = left.lat - right.lat;
  const lngDistance = longitudeDelta(left.lng, right.lng) * Math.max(0.1, Math.cos(meanLat * Math.PI / 180));
  return latDistance * latDistance + lngDistance * lngDistance;
}

function swapCost(groups: Location[][], leftGroup: number, leftIndex: number, rightGroup: number, rightIndex: number): number {
  const leftItem = groups[leftGroup][leftIndex];
  const rightItem = groups[rightGroup][rightIndex];
  const leftDifference = groups[leftGroup].reduce((sum, item, index) => index === leftIndex
    ? sum
    : sum + distanceSquared(rightItem, item) - distanceSquared(leftItem, item), 0);
  const rightDifference = groups[rightGroup].reduce((sum, item, index) => index === rightIndex
    ? sum
    : sum + distanceSquared(leftItem, item) - distanceSquared(rightItem, item), 0);
  return leftDifference + rightDifference;
}

function tightenGroups(initialGroups: Location[][]): Location[][] {
  const groups = initialGroups.map(group => [...group]);
  const maxPasses = Math.min(100, groups.reduce((sum, group) => sum + group.length, 0) * 2);
  for (let pass = 0; pass < maxPasses; pass++) {
    let best: { leftGroup: number; leftIndex: number; rightGroup: number; rightIndex: number; cost: number } | null = null;
    for (let leftGroup = 0; leftGroup < groups.length - 1; leftGroup++) {
      for (let rightGroup = leftGroup + 1; rightGroup < groups.length; rightGroup++) {
        for (let leftIndex = 0; leftIndex < groups[leftGroup].length; leftIndex++) {
          for (let rightIndex = 0; rightIndex < groups[rightGroup].length; rightIndex++) {
            const cost = swapCost(groups, leftGroup, leftIndex, rightGroup, rightIndex);
            if (cost < (best?.cost ?? -1e-10)) best = { leftGroup, leftIndex, rightGroup, rightIndex, cost };
          }
        }
      }
    }
    if (!best) break;
    const leftItem = groups[best.leftGroup][best.leftIndex];
    groups[best.leftGroup][best.leftIndex] = groups[best.rightGroup][best.rightIndex];
    groups[best.rightGroup][best.rightIndex] = leftItem;
  }
  return groups.map(group => group.sort((a, b) => a.name.localeCompare(b.name, 'nl')));
}

function spatialLearningSets(items: Location[], tighten: boolean): Location[][] {
  const groups = splitSpatially(items, balancedGroupSizes(items.length));
  return tighten ? tightenGroups(groups) : groups;
}

const learningSetCache = new Map<string, Location[][]>();

function learningSetsFor(areaId: string, topicId: TopicId): Location[][] {
  const key = `${areaId}:${topicId}`;
  const cached = learningSetCache.get(key);
  if (cached) return cached;
  const items = topicLocations(areaId, topicId);
  const isSingleProvince = DUTCH_PROVINCES.some(province => province.id === areaId);
  const groups = spatialLearningSets(items, isSingleProvince);
  learningSetCache.set(key, groups);
  return groups;
}

function groupSourceLocations(areaId: string, topicId: TopicId, clusterId: string): Location[] {
  const items = topicLocations(areaId, topicId);
  if (clusterId === 'all') return items;
  const match = clusterId.match(/^learn-(\d+)$/);
  if (match) return learningSetsFor(areaId, topicId)[Number(match[1])] ?? [];
  return items.filter(l => l.clusterId === clusterId);
}

function groupName(items: Location[], areaId: string): string {
  const meanLat = items.reduce((sum, item) => sum + item.lat, 0) / items.length;
  const meanLng = circularMeanLongitude(items);
  const anchors = items.filter(item => isDutchArea(areaId)
    ? item.type === 'city' || item.type === 'province'
    : item.type === 'country' || item.type === 'city');
  const candidates = anchors.length ? anchors : items;
  const lngScale = Math.max(0.1, Math.cos(meanLat * Math.PI / 180));
  const anchor = [...candidates].sort((left, right) => {
    const leftDistance = (left.lat - meanLat) ** 2 + (longitudeDelta(left.lng, meanLng) * lngScale) ** 2;
    const rightDistance = (right.lat - meanLat) ** 2 + (longitudeDelta(right.lng, meanLng) * lngScale) ** 2;
    return leftDistance - rightDistance || left.name.localeCompare(right.name, 'nl');
  })[0];
  const cleanName = anchor.name.replace(/\s+\((?:[A-Z]|[IVXLCDM]+)\)$/, '');
  return `Rond ${cleanName}`;
}

export function learningGroups(selection: Selection): LearningGroup[] {
  const items = topicLocations(selection.areaId, selection.topicId);
  if (items.length <= MAX_GROUP_SIZE) return [];
  return learningSetsFor(selection.areaId, selection.topicId).map((group, index) => ({
    id: `learn-${index}`,
    name: groupName(group, selection.areaId),
    icon: String(index + 1),
    count: group.length,
    locations: group.map(location => location.name),
  }));
}

export function nextLearningGroup(selection: Selection): Selection {
  const groups = learningGroups(selection);
  const currentIndex = groups.findIndex(group => group.id === selection.clusterId);
  if (currentIndex < 0 || groups.length < 2) return selection;
  return { ...selection, clusterId: groups[(currentIndex + 1) % groups.length].id };
}

export function studyLocations({ areaId, topicId, clusterId }: Selection): Location[] {
  return groupSourceLocations(areaId, topicId, clusterId);
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
  const groupIds = learningGroups({ areaId, topicId, clusterId: 'all' }).map(group => group.id);
  const clusterId = CLUSTERS.some(c => c.provinceId === areaId && c.id === value?.clusterId) || groupIds.includes(value?.clusterId ?? '') ? value!.clusterId! : 'all';
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
