import React from 'react';
import { GAMES_BY_ID } from '../platform/gameRegistry';
import { Check, Pencil, RotateCcw } from 'lucide-react';
import useSchoolLayout from './useSchoolLayout';
import './schoolMathNavigation.css';

interface ChallengesScreenProps {
  onNavigate: (path: string) => void;
}

export default function ChallengesScreen({ onNavigate }: ChallengesScreenProps) {
  const topo = GAMES_BY_ID.topo;
  const tables = GAMES_BY_ID['red-baby-lua'];
  const layout = useSchoolLayout();
  const icons = [
    { id: 'topo' as const, label: 'Topo', path: topo.path, image: '/games/school/topo-cta.png', alt: 'Topo' },
    { id: 'clock' as const, label: 'Klokkijken', path: '/school/clock', image: '/games/school/clock/clock-school-navigation-v2.png', alt: '' },
    { id: 'tables' as const, label: 'Tafels oefenen', path: tables.path, image: '/games/school/tables-cta.png', alt: 'Tafels oefenen' },
    { id: 'math' as const, label: 'Rekenen', path: '/school/math', image: '/games/school/math/add-subtract.png', alt: '' },
  ];

  return <main className="school-room" aria-labelledby="school-title">
    <h1 className="school-room__title" id="school-title">School</h1>
    <img
      className="school-room__background"
      src="/games/school/school-interior.jpg"
      alt="Een lichte, gezellige school met klaslokalen, boeken en planten"
    />
    <div className="school-layout-tools">
      {layout.editing && <button type="button" title="Standaardindeling herstellen" aria-label="Standaardindeling herstellen" onClick={layout.reset}><RotateCcw size={20} /></button>}
      <button type="button" title={layout.editing ? 'Indeling bewaren' : 'Indeling aanpassen'} aria-label={layout.editing ? 'Klaar met verplaatsen' : 'Indeling aanpassen'} aria-pressed={layout.editing} onClick={layout.toggle}>{layout.editing ? <><Check size={20} /><span>Klaar</span></> : <Pencil size={20} />}</button>
    </div>
    <nav ref={layout.area} className={`school-room__activities${layout.editing ? ' is-editing' : ''}`} aria-label="Kies wat je wilt oefenen">
      {icons.map(icon => <button key={icon.id} className={`school-room__activity school-room__activity--${icon.id}${layout.moving === icon.id ? ' is-moving' : ''}`} type="button" aria-label={`${icon.label} ${layout.editing ? 'verplaatsen' : 'openen'}`} {...layout.iconProps(icon.id, () => onNavigate(icon.path))}>
        <img src={icon.image} alt={icon.alt} draggable={false} />
      </button>)}
    </nav>
    {layout.error && <p className="school-layout-error" role="alert">{layout.error}</p>}
  </main>;
}
