import assert from 'node:assert/strict';
import test from 'node:test';
import { PROVINCES } from '../constants';
import { LOCATION_FACTS } from '../data/locationFacts';
import { areaLocations, availableModes, availableTopics, locationProgressKey, memoryPairs, studyLocations, validateSelection } from '../data/learning';
import { nextBatch, recordAnswer } from '../services/localProgress';

test('Nederland contains exactly twelve provinces and twelve provincial capitals', () => {
  const provinces = studyLocations({ areaId: 'all', topicId: 'provinces', clusterId: 'all' });
  const capitals = studyLocations({ areaId: 'all', topicId: 'capitals', clusterId: 'all' });
  assert.equal(provinces.length, 12);
  assert.equal(capitals.length, 12);
  assert.ok(!capitals.some(l => l.name === 'Rome'));
  assert.equal(new Set(provinces.map(l => l.id)).size, 12);
});

test('world scope includes Europe and Russia without duplicate countries', () => {
  const world = studyLocations({ areaId: 'world', topicId: 'countries', clusterId: 'all' });
  assert.ok(world.some(l => l.name === 'Frankrijk'));
  assert.ok(world.some(l => l.name === 'Brazilië'));
  assert.equal(world.filter(l => l.name === 'Rusland').length, 1);
  assert.equal(new Set(world.map(l => l.name)).size, world.length);
});

test('incompatible selections recover to a nonempty topic in the selected area', () => {
  for (const province of PROVINCES.filter(p => p.id !== 'water-nl')) {
    for (const topicId of ['provinces', 'flags', 'waters', 'facts'] as const) {
      const selection = validateSelection({ areaId: province.id, topicId, clusterId: 'invalid' });
      assert.equal(selection.areaId, province.id);
      assert.ok(studyLocations(selection).length > 0);
      assert.ok(availableTopics(province.id).includes(selection.topicId));
    }
  }
  assert.equal(validateSelection(null).areaId, 'all');
  assert.equal(validateSelection({ areaId: 'invalid' }).areaId, 'all');
});

test('flags are countries only and never appear for a Dutch province or a polar area', () => {
  for (const areaId of ['all', 'fr', 'arctic', 'antarctica']) assert.ok(!availableTopics(areaId).includes('flags'));
  const selection = { areaId: 'europe', topicId: 'flags' as const, clusterId: 'all' };
  assert.deepEqual(availableModes(selection), ['quiz', 'memory']);
  assert.ok(memoryPairs(selection).every(p => p.kind === 'flag' && p.right && p.id.startsWith('flag:')));
  assert.ok(!availableTopics('europe').includes('facts'));
});

test('capital memory retains explicit country and province relationships', () => {
  const europe = memoryPairs({ areaId: 'europe', topicId: 'capitals', clusterId: 'all' });
  assert.equal(europe.find(p => p.left === 'Italië')?.right, 'Rome');
  assert.equal(europe.find(p => p.left === 'San Marino')?.right, 'San Marino');
  const nl = memoryPairs({ areaId: 'all', topicId: 'provinces', clusterId: 'all' });
  assert.equal(nl.length, 12);
  assert.equal(nl.find(p => p.left === 'Friesland')?.right, 'Leeuwarden');
});

test('water topic includes the dedicated Netherlands water dataset', () => {
  const waters = studyLocations({ areaId: 'all', topicId: 'waters', clusterId: 'all' });
  assert.ok(waters.some(l => l.name === 'Amsterdam-Rijnkanaal'));
  assert.ok(waters.every(l => l.type === 'water'));
});

test('Groningen matches the complete school worksheet', () => {
  const cities = studyLocations({ areaId: 'gr', topicId: 'cities', clusterId: 'all' });
  const regions = studyLocations({ areaId: 'gr', topicId: 'regions', clusterId: 'all' });
  const waters = studyLocations({ areaId: 'gr', topicId: 'waters', clusterId: 'all' });
  assert.deepEqual(cities.map(l => l.name).sort(), [
    'Appingedam', 'Delfzijl', 'Groningen', 'Haren', 'Hoogezand-Sappemeer', 'Lauwersoog',
    'Stadskanaal', 'Ter Apel', 'Veendam', 'Winschoten', 'Zoutkamp', 'Zuidhorn',
  ].sort());
  assert.deepEqual(regions.map(l => l.name).sort(), ['Hondsrug', 'Lauwersmeergebied'].sort());
  assert.deepEqual(waters.map(l => l.name).sort(), [
    'Dollard', 'Eems', 'Eemskanaal', 'Paterswoldsemeer', 'Waddenzee', 'Zuidlaardermeer',
  ].sort());
  assert.equal(cities.length + regions.length + waters.length, 20);
  assert.ok([...cities, ...regions, ...waters].every(location => LOCATION_FACTS[location.name]?.fact));
  const allMemory = memoryPairs({ areaId: 'gr', topicId: 'all', clusterId: 'all' });
  assert.equal(allMemory.length, 20);
  assert.ok(allMemory.every(pair => pair.kind === 'fact'));
  assert.ok(availableModes({ areaId: 'gr', topicId: 'all', clusterId: 'all' }).includes('memory'));
});

test('repeated short rounds cover every flag before repeating any', () => {
  const pool = memoryPairs({ areaId: 'world', topicId: 'flags', clusterId: 'all' });
  let progress = {};
  const visited = new Set<string>();
  while (visited.size < pool.length) {
    const remaining = pool.length - visited.size;
    const batch = nextBatch(pool, Math.min(8, remaining), progress, p => p.id);
    assert.equal(batch.length, Math.min(8, remaining));
    for (const pair of batch) {
      assert.ok(!visited.has(pair.id));
      visited.add(pair.id);
      progress = recordAnswer(progress, pair.id, true);
    }
  }
  assert.equal(visited.size, pool.length);
});

test('progress separates wrong answers, counts practice and reuses country IDs across areas', () => {
  const europe = areaLocations('europe').find(l => l.name === 'Rusland' && l.type === 'country')!;
  const world = areaLocations('world').find(l => l.name === 'Rusland' && l.type === 'country')!;
  assert.equal(locationProgressKey(europe), locationProgressKey(world));
  const failed = recordAnswer({}, 'flag:Rusland', false);
  const corrected = recordAnswer(failed, 'flag:Rusland', true);
  assert.equal(corrected['flag:Rusland'].seen, 2);
  assert.equal(corrected['flag:Rusland'].correct, 1);
  assert.equal(failed['flag:Rusland'].seen, 1);
});
