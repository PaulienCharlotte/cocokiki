import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import SpeechBubble from '../ui/SpeechBubble';
import { loadVillageInvitations } from '../../services/villageInvitation';
import { subscribeLocalState } from '../../services/localState';

/** Een klein aanbod uit verschillende werelden; het kind kiest zelf. */
export default function VillageGuide({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [invitations, setInvitations] = useState(loadVillageInvitations);
  useEffect(() => subscribeLocalState(() => setInvitations(loadVillageInvitations())), []);
  if (!invitations.length) return null;
  return <aside className="village-guide" aria-label="Kies een To Do-avontuur">
    <h2>Waar heb je zin in?<span>Veeg voor meer</span></h2>
    <ul className="village-guide__choices" aria-label="Open opdrachten">
      {invitations.map(invitation => <li key={invitation.id} data-task={invitation.id} data-wereld={invitation.world}>
        <SpeechBubble className="village-guide__note ck-paper-surface" character={invitation.character} illustration={<img src={invitation.image} alt="" draggable={false} />}>
          {invitation.text}
          <button className="village-guide__action" type="button" aria-label={`${invitation.continuing ? 'Ga verder' : 'Bekijk opdracht'}: ${invitation.text}`} onClick={() => onNavigate(invitation.path)}>{invitation.continuing ? 'Ga verder' : 'Bekijk opdracht'}<ArrowRight aria-hidden="true" /></button>
        </SpeechBubble>
      </li>)}
      <li className="village-guide__more" data-wereld="boomhut">
        <button type="button" className="village-guide__more-link ck-paper-surface" onClick={() => onNavigate('/opdrachten')}>
          <img src="/assets/library/ui/daily-quest.webp" alt="" />
          <span><strong>Meer avonturen</strong><small>Bekijk alle To Do’s</small></span><ArrowRight aria-hidden="true" />
        </button>
      </li>
    </ul>
  </aside>;
}
