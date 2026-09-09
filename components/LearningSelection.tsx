import React from 'react';
import { Globe2, MapPin } from 'lucide-react';
import { CLUSTERS, PROVINCES } from '../constants';
import { availableTopics, CONTINENT_IDS, DUTCH_PROVINCES, isDutchArea, Selection, studyLocations, TOPIC_LABELS, TopicId } from '../data/learning';

export default function LearningSelection({ selection, onChange }: { selection: Selection; onChange: (value: Selection) => void }) {
  const { areaId, topicId, clusterId } = selection;
  const dutch = isDutchArea(areaId);
  const clusters = CLUSTERS.filter(c => c.provinceId === areaId && studyLocations({ ...selection, clusterId: c.id }).length);
  return <section className="selection-band" aria-label="Gebied en onderwerp">
    <div className="selection-fields">
      <label className="field"><span><Globe2 size={15} /> Waar?</span>
        <select aria-label="Gebied" value={dutch ? 'all' : areaId} onChange={e => onChange({ areaId: e.target.value, topicId, clusterId: 'all' })}>
          <option value="all">Nederland</option>
          <optgroup label="Werelddelen">{CONTINENT_IDS.map(id => <option key={id} value={id}>{PROVINCES.find(p => p.id === id)?.name}</option>)}</optgroup>
          <optgroup label="Wereld en poolgebieden"><option value="world">Hele wereld</option><option value="arctic">Noordpoolgebied</option></optgroup>
        </select>
      </label>
      {dutch && <label className="field"><span><MapPin size={15} /> Provincie</span>
        <select aria-label="Provincie" value={areaId} onChange={e => onChange({ areaId: e.target.value, topicId, clusterId: 'all' })}>
          <option value="all">Heel Nederland</option>{DUTCH_PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>}
      <label className="field"><span>Wat?</span>
        <select aria-label="Onderwerp" value={topicId} onChange={e => onChange({ ...selection, topicId: e.target.value as TopicId, clusterId: 'all' })}>
          {availableTopics(areaId).map(id => <option value={id} key={id}>{TOPIC_LABELS[id]}</option>)}
        </select>
      </label>
    </div>
    {clusters.length > 1 && <details className="area-detail"><summary>Kleiner deelgebied{clusterId !== 'all' ? `: ${CLUSTERS.find(c => c.id === clusterId)?.name}` : ''}</summary>
      <label className="field"><span>Deelgebied</span><select aria-label="Deelgebied" value={clusterId} onChange={e => onChange({ ...selection, clusterId: e.target.value })}>
        <option value="all">Alles binnen dit onderwerp</option>{clusters.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
      </select></label>
    </details>}
  </section>;
}
