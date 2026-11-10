import React from 'react';
import { PROVINCES } from '../constants';
import { availableTopics, CONTINENT_IDS, DUTCH_PROVINCES, isDutchArea, learningGroups, Selection, studyLocations, TOPIC_LABELS, TopicId } from '../data/learning';
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
    {groups.length > 1 && <label className="field"><span>Set</span>
      <select aria-label="Set" value={clusterId} onChange={event => onChange({ ...selection, clusterId: event.target.value })}>
        <option value="all">Alles ({totalCount})</option>
        {groups.map(group => <option key={group.id} value={group.id}>{group.name} ({group.count})</option>)}
      </select>
    </label>}
  </div>;
}
