import React from 'react';
import { PROVINCES } from '../constants';
import { availableTopics, CONTINENT_IDS, DUTCH_PROVINCES, isDutchArea, learningGroups, Selection, SET_SCHEIDING, setIds, studyLocations, TOPIC_LABELS, TopicId } from '../data/learning';
import { TOPOGRAPHY_DATASETS } from '../data/topography/datasets';

export default function LearningSelection({ selection, onChange }: { selection: Selection; onChange: (value: Selection) => void }) {
  const { areaId, topicId, clusterId } = selection;
  const dutch = isDutchArea(areaId);
  const usesDutchRegionSelector = dutch || areaId === 'midden-nederland';
  const groups = learningGroups(selection);
  const totalCount = studyLocations({ ...selection, clusterId: 'all' }).length;
  const chooseArea = (nextAreaId: string) => onChange({ areaId: nextAreaId, topicId: 'all', clusterId: 'all' });
  // Zonder deze keuze kun je alleen het eerste onderwerp oefenen. Bij
  // Nederland is dat de provincies, en bleven de hoofdsteden, steden,
  // wateren en weetjes onbereikbaar terwijl ze er wel zijn.
  const topics = availableTopics(areaId);
  const gekozenSets = clusterId === 'all' ? [] : setIds(clusterId);
  return <div className="selection-fields">
    <label className="field"><span>Gebied</span>
      <select aria-label="Gebied" value={usesDutchRegionSelector ? 'all' : areaId} onChange={e => chooseArea(e.target.value)}>
        <option value="all">Nederland</option>
        <optgroup label="Leergebieden"><option value="benelux">Benelux</option>{TOPOGRAPHY_DATASETS.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.title}</option>)}</optgroup>
        <optgroup label="Werelddelen">{CONTINENT_IDS.map(id => <option key={id} value={id}>{PROVINCES.find(p => p.id === id)?.name}</option>)}</optgroup>
        <optgroup label="Wereld en poolgebieden"><option value="world">Hele wereld</option><option value="arctic">Noordpoolgebied</option></optgroup>
      </select>
    </label>
    {usesDutchRegionSelector && <label className="field"><span>Regio</span>
      <select aria-label="Regio" value={areaId} onChange={e => chooseArea(e.target.value)}>
        <option value="all">Heel Nederland</option>
        <option value="midden-nederland">Midden-Nederland</option>
        {DUTCH_PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>}
    {topics.length > 1 && <label className="field"><span>Wat</span>
      <select aria-label="Onderwerp" value={topicId} onChange={event => onChange({ ...selection, topicId: event.target.value as TopicId, clusterId: 'all' })}>
        {topics.map(id => <option key={id} value={id}>{TOPIC_LABELS[id]}</option>)}
      </select>
    </label>}
    {groups.length > 1 && <div className="field field--sets">
      <span id="set-keuze-label">Sets</span>
      {/* Meer dan één set tegelijk mag: zo kun je bijvoorbeeld de onderste
          drie groepjes samen leren zonder de hele kaart erbij te nemen. */}
      <div className="set-keuze" role="group" aria-labelledby="set-keuze-label">
        <button type="button" className={gekozenSets.length === 0 ? 'is-actief' : ''} aria-pressed={gekozenSets.length === 0}
          onClick={() => onChange({ ...selection, clusterId: 'all' })}>Alles <small>{totalCount}</small></button>
        {groups.map(group => {
          const aan = gekozenSets.includes(group.id);
          return <button key={group.id} type="button" className={aan ? 'is-actief' : ''} aria-pressed={aan}
            title={group.locations.join(', ')}
            onClick={() => {
              const volgende = aan ? gekozenSets.filter(id => id !== group.id) : [...gekozenSets, group.id];
              // Niets aangevinkt betekent de hele kaart, niet een leeg rijtje.
              onChange({ ...selection, clusterId: volgende.length ? volgende.join(SET_SCHEIDING) : 'all' });
            }}>{group.name} <small>{group.count}</small></button>;
        })}
      </div>
      {gekozenSets.length > 1 && <small className="set-keuze__totaal">{gekozenSets.length} sets samen · {studyLocations(selection).length} plekken</small>}
    </div>}
  </div>;
}
