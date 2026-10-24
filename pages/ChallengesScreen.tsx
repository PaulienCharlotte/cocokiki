import React from 'react';
import { GAMES_BY_ID } from '../platform/gameRegistry';

interface ChallengesScreenProps {
  onNavigate: (path: string) => void;
}

export default function ChallengesScreen({ onNavigate }: ChallengesScreenProps) {
  const topo = GAMES_BY_ID.topo;
  const tables = GAMES_BY_ID['red-baby-lua'];

  return <main className="school-room" aria-labelledby="school-title">
    <h1 className="school-room__title" id="school-title">School</h1>
    <img
      className="school-room__background"
      src="/games/school/school-interior.jpg"
      alt="Een lichte, gezellige school met klaslokalen, boeken en planten"
    />
    <nav className="school-room__activities" aria-label="Kies wat je wilt oefenen">
      <button className="school-room__activity school-room__activity--topo" type="button" aria-label="Topo openen" onClick={() => onNavigate(topo.path)}>
        <img src="/games/school/topo-cta.png" alt="Topo" draggable={false} />
      </button>
      <button className="school-room__activity school-room__activity--clock" type="button" aria-label="Klokkijken openen" onClick={() => onNavigate('/school/clock')}>
        <span className="school-clock-card">
          <img src="/games/school/clock/clock-navigation.png" alt="" draggable={false} />
          <strong>Klokkijken</strong>
        </span>
      </button>
      <button className="school-room__activity school-room__activity--tables" type="button" aria-label="Tafels oefenen openen" onClick={() => onNavigate(tables.path)}>
        <img src="/games/school/tables-cta.png" alt="Tafels oefenen" draggable={false} />
      </button>
    </nav>
  </main>;
}
