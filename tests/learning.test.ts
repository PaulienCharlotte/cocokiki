import assert from 'node:assert/strict';
import test from 'node:test';
import { PROVINCES } from '../constants';
import { LOCATION_FACTS } from '../data/locationFacts';
import { areaLocations, availableModes, availableTopics, initialSelection, learningGroups, locationProgressKey, memoryPairs, nextLearningGroup, studyLocations, validateSelection } from '../data/learning';
import { nextBatch, recordAnswer } from '../services/localProgress';
import { GAME_LIBRARY } from '../platform/gameRegistry';
import { resolveRoute } from '../platform/routes';
import { createQuestion, nextDifficulty, nextQuestionType, questionIsValid } from '../games/red-baby-lua/game/systems/questions';
import { QuestionType } from '../games/red-baby-lua/game/types';
import { currencyReward, EMPTY_STATS, recordSuccess, recordTimeout, roundDuration, starsFor } from '../games/red-baby-lua/game/systems/progression';
import { createWorldLayout } from '../games/treehouse/world/layout';

test('platform routes keep games addressable and safely redirect old links', () => {
  assert.deepEqual(resolveRoute('/').route, { page: 'home', path: '/' });
  assert.deepEqual(resolveRoute('/treehouse'), { route: { page: 'home', path: '/' }, redirect: true });
  assert.equal(resolveRoute('/treehouse/').route.path, '/');
  assert.equal(resolveRoute('/games/topo').route.page, 'game');
  assert.equal(resolveRoute('/games/topo/').route.path, '/games/topo');
  assert.deepEqual(resolveRoute('/topo'), { route: { page: 'game', path: '/games/topo', gameId: 'topo' }, redirect: true });
  assert.deepEqual(resolveRoute('/does-not-exist'), { route: { page: 'home', path: '/' }, redirect: true });
});

test('game registry exposes independent lazy-loaded modules', () => {
  assert.deepEqual(GAME_LIBRARY.map(game => game.id), ['topo', 'red-baby-lua']);
  assert.equal(new Set(GAME_LIBRARY.map(game => game.path)).size, GAME_LIBRARY.length);
  assert.equal(GAME_LIBRARY[0].status, 'playable');
  assert.equal(GAME_LIBRARY[1].status, 'playable');
  assert.ok(GAME_LIBRARY.every(game => typeof game.load === 'function'));
  assert.ok(GAME_LIBRARY.every(game => game.enabled && game.category && game.islandAsset));
  assert.equal(new Set(GAME_LIBRARY.map(game => game.islandAsset)).size, GAME_LIBRARY.length);
});

test('adventure world derives stable, separate island positions from the game registry', () => {
  const enabledGames = GAME_LIBRARY.filter(game => game.enabled);
  const firstLayout = createWorldLayout(enabledGames);
  const secondLayout = createWorldLayout(enabledGames);
  assert.deepEqual(firstLayout, secondLayout);
  assert.equal(firstLayout.length, enabledGames.length);
  assert.equal(new Set(firstLayout.map(({ x, y }) => `${x}:${y}`)).size, enabledGames.length);
  assert.deepEqual(firstLayout.map(island => island.game.id), enabledGames.map(game => game.id));
});

test('Baby Lua creates valid, unique multiplication choices for every table', () => {
  for (let table = 1; table <= 10; table++) {
    for (let index = 0; index < 25; index++) {
      const question = createQuestion(table, '', () => (index % 10) / 10);
      assert.ok(questionIsValid(question));
      assert.equal(question.left, table);
    }
  }
  assert.ok(questionIsValid(createQuestion('mix')));
});

test('Baby Lua supports varied question forms and adaptive difficulty', () => {
  const types: QuestionType[] = ['classic', 'missing', 'check', 'bigger', 'factor'];
  for (const type of types) {
    const question = createQuestion(6, '', () => .42, 3, type);
    assert.equal(question.type, type);
    assert.ok(questionIsValid(question));
  }
  assert.equal(nextQuestionType(1, 1), 'classic');
  assert.equal(nextQuestionType(2, 1), 'missing');
  assert.equal(nextQuestionType(5, 3), 'factor');
  assert.equal(nextDifficulty(1, 3, false), 2);
  assert.equal(nextDifficulty(3, 0, true), 2);
  assert.equal(nextDifficulty(1, 0, true), 1);
});

test('Baby Lua scoring separates first tries, retries and timeouts', () => {
  const first = recordSuccess(EMPTY_STATS, true);
  const retry = recordSuccess(first, false);
  const missed = recordTimeout(retry);
  assert.deepEqual({ firstTry: missed.firstTry, eventual: missed.eventual, missed: missed.missed }, { firstTry: 1, eventual: 2, missed: 1 });
  assert.equal(first.score, 100);
  assert.equal(retry.score, 160);
  assert.equal(starsFor({ ...EMPTY_STATS, firstTry: 8, eventual: 9 }, 10), 3);
  assert.equal(roundDuration(5000, { ...EMPTY_STATS, bestStreak: 4 }), 5000);
  assert.equal(roundDuration(5000, { ...EMPTY_STATS, bestStreak: 5 }), 4000);
  assert.equal(roundDuration(5000, { ...EMPTY_STATS, bestStreak: 10 }), 3200);
  assert.equal(roundDuration(4200, { ...EMPTY_STATS, bestStreak: 10 }), 2688);
});

test('Baby Lua rewards harder tables with more CocoKiki currency', () => {
  assert.equal(currencyReward(1, true), 1);
  assert.equal(currencyReward(4, true), 2);
  assert.equal(currencyReward(8, true), 3);
  assert.equal(currencyReward('mix', true), 4);
  assert.ok(currencyReward(8, false) < currencyReward(8, true));
});

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

test('a fresh Topo visit starts neutral instead of restoring the last region', () => {
  assert.deepEqual(initialSelection(), { areaId: 'all', topicId: 'provinces', clusterId: 'all' });
  assert.notDeepEqual(initialSelection(), validateSelection({ areaId: 'midden-nederland', topicId: 'cities', clusterId: 'all' }));
});

test('flags are countries only and never appear for a Dutch province or a polar area', () => {
  for (const areaId of ['all', 'fr', 'arctic', 'antarctica']) assert.ok(!availableTopics(areaId).includes('flags'));
  const selection = { areaId: 'europe', topicId: 'flags' as const, clusterId: 'all' };
  assert.deepEqual(availableModes(selection), ['find', 'spell', 'master', 'test']);
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
  assert.ok(!availableModes({ areaId: 'gr', topicId: 'all', clusterId: 'all' }).includes('memory'));
});

test('Benelux matches the complete school worksheet and every item has a fact', () => {
  const selection = { areaId: 'benelux', topicId: 'all' as const, clusterId: 'all' };
  const locations = studyLocations(selection);
  assert.equal(locations.length, 26);
  assert.deepEqual(
    locations.reduce<Record<string, number>>((counts, location) => ({ ...counts, [location.type]: (counts[location.type] ?? 0) + 1 }), {}),
    { city: 16, region: 3, water: 4, country: 3 },
  );
  assert.ok(locations.every(location => LOCATION_FACTS[location.name]?.fact), 'ieder Benelux-punt heeft een weetje');
  assert.ok(locations.find(location => location.name === 'Rijn')!.lng > 6.5, 'de Rijn staat zichtbaar in Duitsland');
  assert.deepEqual(availableTopics('benelux'), ['cities', 'waters', 'regions', 'countries', 'facts', 'all']);
});

test('Midden-Nederland matches the complete school worksheet exactly', () => {
  const cities = studyLocations({ areaId: 'midden-nederland', topicId: 'cities', clusterId: 'all' });
  const regions = studyLocations({ areaId: 'midden-nederland', topicId: 'regions', clusterId: 'all' });
  const waters = studyLocations({ areaId: 'midden-nederland', topicId: 'waters', clusterId: 'all' });
  assert.deepEqual(cities.map(location => location.name), [
    'Lelystad', 'Almere', 'Emmeloord', 'Utrecht', 'Amersfoort', 'Zeist', 'Nieuwegein',
    'De Bilt', 'Soest', 'Veenendaal', 'Woerden', 'Dronten', 'Urk', 'Zeewolde',
  ]);
  assert.deepEqual(regions.map(location => location.name), [
    'Noordoostpolder', 'Oostelijk Flevoland', 'Zuidelijk Flevoland', 'Grebbeberg',
  ]);
  assert.deepEqual(waters.map(location => location.name), [
    'IJsselmeer', 'Veluwemeer', 'Markermeer', 'Gooimeer', 'Ketelmeer',
    'Vecht', 'Neder-Rijn', 'Lek', 'Amsterdam-Rijnkanaal',
  ]);
  assert.equal(cities.length + regions.length + waters.length, 27);
  assert.deepEqual(availableTopics('midden-nederland'), ['cities', 'waters', 'regions', 'all']);
});

test('learning groups are balanced and cover every location in every area and topic', () => {
  for (const areaId of ['all', ...PROVINCES.filter(p => p.id !== 'water-nl').map(p => p.id)]) {
    for (const topicId of availableTopics(areaId)) {
      const selection = { areaId, topicId, clusterId: 'all' as const };
      const allLocations = studyLocations(selection);
      const groups = learningGroups(selection);
      if (allLocations.length <= 6) {
        assert.equal(groups.length, 0, `${areaId}/${topicId} hoeft niet te worden gesplitst`);
        continue;
      }
      const groupedLocations = groups.flatMap(group => studyLocations({ ...selection, clusterId: group.id }));
      const sizes = groups.map(group => group.count);
      assert.ok(Math.min(...sizes) >= 3, `${areaId}/${topicId} heeft geen klein restgroepje`);
      assert.ok(Math.max(...sizes) <= 5, `${areaId}/${topicId} blijft behapbaar`);
      assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `${areaId}/${topicId} is gelijk verdeeld`);
      assert.deepEqual(
        groupedLocations.map(location => location.id).sort(),
        allLocations.map(location => location.id).sort(),
        `${areaId}/${topicId} bevat iedere locatie precies eenmaal`,
      );
    }
  }
});

test('Groningen all mixes nearby cities, regions and waters into four sets of five', () => {
  const selection = { areaId: 'gr', topicId: 'all' as const, clusterId: 'all' };
  const groups = learningGroups(selection);
  const locationsByGroup = groups.map(group => studyLocations({ ...selection, clusterId: group.id }));
  assert.deepEqual(groups.map(group => group.count), [5, 5, 5, 5]);
  assert.ok(locationsByGroup.every(group => new Set(group.map(location => location.type)).size >= 2));

  const groupContaining = (name: string) => locationsByGroup.find(group => group.some(location => location.name === name))!;
  assert.ok(groupContaining('Lauwersmeergebied').some(location => ['Lauwersoog', 'Zoutkamp'].includes(location.name)));
  assert.ok(groupContaining('Zuidlaardermeer').some(location => ['Haren', 'Hoogezand-Sappemeer', 'Hondsrug'].includes(location.name)));
  assert.notEqual(groupContaining('Lauwersmeergebied'), groupContaining('Hondsrug'));
});

test('a new route advances to the next learning group and wraps after the last group', () => {
  const base = { areaId: 'gr', topicId: 'all' as const, clusterId: 'learn-0' };
  assert.equal(nextLearningGroup(base).clusterId, 'learn-1');
  assert.equal(nextLearningGroup({ ...base, clusterId: 'learn-3' }).clusterId, 'learn-0');
  assert.equal(nextLearningGroup({ ...base, clusterId: 'all' }).clusterId, 'all');
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
