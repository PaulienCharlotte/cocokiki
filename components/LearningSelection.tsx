import React from 'react';
import { Globe2, MapPin } from 'lucide-react';
import { PROVINCES } from '../constants';
import { CONTINENT_IDS, DUTCH_PROVINCES, isDutchArea, learningGroups, Selection, studyLocations } from '../data/learning';

export default function LearningSelection({ selection, onChange }: { selection: Selection; onChange: (value: Selection) => void }) {
  const { areaId, clusterId } = selection;
  const dutch = isDutchArea(areaId);
  const groups = learningGroups(selection);
  const totalCount = studyLocations({ ...selection, clusterId: 'all' }).length;
  const chooseArea = (nextAreaId: string) => onChange({ areaId: nextAreaId, topicId: 'all', clusterId: 'all' });
  return <section className="selection-band" aria-label="Gebied en onderwerp">
    <div className="selection-fields">
      <label className="field"><span><Globe2 size={15} /> Waar?</span>
        <select aria-label="Gebied" value={dutch ? 'all' : areaId} onChange={e => chooseArea(e.target.value)}>
          <option value="all">Nederland</option>
          <optgroup label="Werelddelen">{CONTINENT_IDS.map(id => <option key={id} value={id}>{PROVINCES.find(p => p.id === id)?.name}</option>)}</optgroup>
          <optgroup label="Wereld en poolgebieden"><option value="world">Hele wereld</option><option value="arctic">Noordpoolgebied</option></optgroup>
        </select>
      </label>
      {dutch && <label className="field"><span><MapPin size={15} /> Regio</span>
        <select aria-label="Regio" value={areaId} onChange={e => chooseArea(e.target.value)}>
          <option value="all">Heel Nederland</option>{DUTCH_PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>}
    </div>
    {groups.length > 1 && <div className="cluster-strip" aria-label="Kies een behapbaar groepje">
      <span>Leerset</span>
      <button type="button" aria-current={clusterId === 'all' ? 'true' : undefined} onClick={() => onChange({ ...selection, clusterId: 'all' })}>
        Alles <small>{totalCount}</small>
      </button>
      {groups.map(group => {
        const description = group.locations.join(', ');
        return <button key={group.id} type="button" title={description} aria-label={`${group.name}: ${description}`} aria-current={clusterId === group.id ? 'true' : undefined} onClick={() => onChange({ ...selection, clusterId: group.id })}>
          <span aria-hidden="true">{group.icon}</span>{group.name}<small>{group.count}</small>
        </button>;
      })}
    </div>}
  </section>;
}
