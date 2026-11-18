import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CHARACTERS } from '../../data/characters';
import { PROFILE_AVATARS } from '../../services/profile';
import { loadVillageInvitations } from '../../services/villageInvitation';
import { subscribeLocalState } from '../../services/localState';

/** Een klein aanbod uit verschillende werelden; het kind kiest zelf. */
export default function VillageGuide({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [invitations, setInvitations] = useState(loadVillageInvitations);
  useEffect(() => subscribeLocalState(() => setInvitations(loadVillageInvitations())), []);
  if (!invitations.length) return null;
  return <aside className="village-guide" aria-label="Kies een To Do-avontuur">
    <ul className="village-guide__choices" aria-label="Open opdrachten">
      {invitations.map(invitation => <li key={invitation.id} data-task={invitation.id} data-wereld={invitation.world}>
        <button className="village-guide__note ck-paper-surface" type="button" aria-label={`${invitation.continuing ? 'Ga verder' : 'Bekijk opdracht'}: ${invitation.text}`} onClick={() => onNavigate(invitation.path)}>
          <span className="village-guide__art"><img src={invitation.image} alt="" draggable={false} /><img className="village-guide__avatar" src={PROFILE_AVATARS.find(avatar => avatar.id === (invitation.character === 'seb' ? 'stokstaartje' : invitation.character))?.image ?? CHARACTERS[invitation.character].beeld} alt="" /></span>
          <span className="village-guide__copy"><strong className="village-guide__name">{CHARACTERS[invitation.character].naam}</strong><span className="village-guide__text">{invitation.text}</span><span className="village-guide__action">{invitation.continuing ? 'Ga verder' : 'Bekijk opdracht'}<ArrowRight aria-hidden="true" /></span></span>
        </button>
      </li>)}
      <li className="village-guide__more" data-wereld="boomhut">
        <button type="button" className="village-guide__note ck-paper-surface" onClick={() => onNavigate('/opdrachten')}>
          <span className="village-guide__art"><img src="/assets/library/ui/daily-quest.webp" alt="" /></span>
          <span className="village-guide__copy"><strong className="village-guide__name">To Do</strong><span className="village-guide__text">Ontdek meer avonturen.</span><span className="village-guide__action">Alle To Do’s<ArrowRight aria-hidden="true" /></span></span>
        </button>
      </li>
    </ul>
  </aside>;
}
