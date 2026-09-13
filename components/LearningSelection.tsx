import React from 'react';
import { ChevronDown, Globe2, MapPin, SlidersHorizontal } from 'lucide-react';
import { PROVINCES } from '../constants';
import { CONTINENT_IDS, DUTCH_PROVINCES, isDutchArea, learningGroups, Selection, studyLocations } from '../data/learning';

export default function LearningSelection({ selection, onChange, mobileActions }: { selection: Selection; onChange: (value: Selection) => void; mobileActions?: React.ReactNode }) {
  const { areaId, clusterId } = selection;
  const dutch = isDutchArea(areaId);
  const groups = learningGroups(selection);
  const totalCount = studyLocations({ ...selection, clusterId: 'all' }).length;
  const areaLabel = areaId === 'all' ? 'Nederland' : PROVINCES.find(area => area.id === areaId)?.name ?? areaId;
  const clusterLabel = clusterId === 'all' ? 'Alles' : groups.find(group => group.id === clusterId)?.name ?? 'Alles';
  const chooseArea = (nextAreaId: string) => onChange({ areaId: nextAreaId, topicId: 'all', clusterId: 'all' });
  return <section className="selection-band" aria-label="Gebied en onderwerp">
    <details className="selection-details">
      <summary>
        <SlidersHorizontal size={17} />
        <span><strong>Kaart instellen</strong><small>{areaLabel} · {clusterLabel}</small></span>
        <ChevronDown className="selection-chevron" size={18} />
      </summary>
      <div className="selection-content">
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
        {mobileActions && <div className="selection-mobile-actions" onClick={event => {
          if ((event.target as HTMLElement).closest('button')) event.currentTarget.closest('details')?.removeAttribute('open');
        }}>{mobileActions}</div>}
      </div>
    </details>
  </section>;
}
