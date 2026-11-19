import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, House, Gamepad2, ShoppingBag, Map, BookOpen, ChevronDown, UserRound, ClipboardList, LogOut, LogIn } from 'lucide-react';
import { Button, Dialog, IconButton } from '../../design-system';
import { loadProfileAvatar, PROFILE_AVATARS, saveProfileAvatar } from '../../services/profile';
import type { ProfileAvatarId } from '../../services/profile';
import { accountsBeschikbaar, leesSessie, logUit, naarInloggen } from '../../services/account';
import './bovenbalk.css';

/** De encyclopedie staat in het topmenu omdat hij over alle spellen heen gaat. */
const ENCYCLOPEDIA_PATH = '/encyclopedie';

interface WorldTopBarProps {
  coins: number;
  onHome: () => void;
  onBack?: () => void;
  backLabel?: string;
  embedded?: boolean;
  /** Zonder deze prop verschijnt de encyclopedieknop niet. */
  onNavigate?: (path: string) => void;
  /** Het pad waar je nu bent, zodat de knop zichzelf niet aanprijst. */
  activePath?: string;
  worldShortcut?: boolean;
}

export default function WorldTopBar({ coins, onHome, onBack, backLabel = 'Terug naar de wereld', embedded = false, onNavigate, activePath, worldShortcut = false }: WorldTopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [uitlogOpen, setUitlogOpen] = useState(false);
  const [uitlogBezig, setUitlogBezig] = useState(false);
  const [uitlogFout, setUitlogFout] = useState('');
  const sessie = leesSessie();
  const bevestigUitloggen = async () => {
    setUitlogBezig(true); setUitlogFout('');
    try { await logUit(); } catch (fout) { setUitlogFout((fout as Error).message); setUitlogBezig(false); }
  };
  const [avatarId, setAvatarId] = useState<ProfileAvatarId>(loadProfileAvatar);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const avatar = PROFILE_AVATARS.find(option => option.id === avatarId) ?? PROFILE_AVATARS[0];

  useEffect(() => {
    if (!profileOpen) return;
    const closeMenu = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  const selectAvatar = (nextAvatar: ProfileAvatarId) => {
    setAvatarId(nextAvatar);
    saveProfileAvatar(nextAvatar);
  };

  return <>
    {/* Geen balk meer over de hele breedte: drie losse glazen zones uit de
        huisstijl. Links terug (of het logo op de wereldkaart), in het midden
        de munten, rechts winkel · To Do · profiel. De klasse world-hud blijft,
        omdat spellen de hoogte van de bovenkant ermee meten. */}
    <header className={`world-hud ck-bovenbalk${onBack ? '' : ' is-thuis'}${embedded ? ' world-hud--shell' : ''}`}>
      <div className="world-hud__leading">
        {onBack ? <IconButton className="world-hud__back ck-glas" size="small" label={backLabel} icon={<ArrowLeft size={22} />} onClick={onBack} />
          : <button className="world-hud__brand" type="button" onClick={onHome} aria-label="Naar de wereld">
            <img src="/images/cocokiki-logo.webp" alt="CocoKiki" />
          </button>}
      </div>
      <button type="button" className="ck-bovenbalk__munten ck-glas" aria-label={`${coins} CocoCoins · Mijn munten openen`} onClick={() => onNavigate?.('/munten')}>
        <span className="ck-munt" aria-hidden="true" />
        <strong>{coins}</strong>
      </button>
      <div className="world-hud__tools ck-glas">
        {/* In een spel met een eigen statuseiland staan de munten hier, in het menu. */}
        <button type="button" className="world-hud__balance ck-bovenbalk__munten-klein" aria-label={`${coins} CocoCoins · Mijn munten openen`} onClick={() => onNavigate?.('/munten')}>
          <span className="ck-munt" />
          <strong>{coins}</strong>
        </button>
        {/* Huisstijl: rechtsboven precies winkel · To Do · profiel, op elk scherm.
            Kaart, boomhut, alle spellen en encyclopedie zitten in het profielmenu. */}
        {onNavigate && <IconButton className="world-hud__menuknop" label="Winkel openen" size="small" icon={<ShoppingBag size={20} />} onClick={() => onNavigate('/shop')} />}
        {onNavigate && <IconButton className="world-hud__menuknop" label="To Do openen" size="small" icon={<ClipboardList size={20} />} onClick={() => onNavigate('/opdrachten')} />}
        <div className="world-profile" ref={profileRef}>
          <button
            className="world-profile__trigger"
            type="button"
            aria-label="Profielmenu openen"
            aria-expanded={profileOpen}
            aria-controls={menuId}
            onClick={() => setProfileOpen(current => !current)}
          >
            <img src={avatar.image} alt="" />
            <ChevronDown size={19} aria-hidden="true" />
          </button>
          {profileOpen && <div className="world-profile__menu" id={menuId} role="menu" aria-label="Profielmenu">
            <div className="world-profile__identity">
              <img src={avatar.image} alt="" />
              <div><strong>Hoi!</strong><span>{sessie?.naam ?? 'Gast'}</span></div>
            </div>
            <button type="button" role="menuitem" onClick={() => {
              setProfileOpen(false);
              setAvatarDialogOpen(true);
            }}><UserRound size={21} />Mijn profiel</button>
            {(worldShortcut || onNavigate) && <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); onHome(); }}><Map size={21} />Wereldkaart</button>}
            {onNavigate && <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); onNavigate('/treehouse'); }}><House size={21} />Mijn boomhut</button>}
            {onNavigate && <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); onNavigate('/mijn-spellen'); }}><Gamepad2 size={21} />Alle spellen</button>}
            {onNavigate && <button
              type="button"
              role="menuitem"
              className={activePath === ENCYCLOPEDIA_PATH ? 'is-active' : undefined}
              aria-current={activePath === ENCYCLOPEDIA_PATH ? 'page' : undefined}
              onClick={() => { setProfileOpen(false); onNavigate(ENCYCLOPEDIA_PATH); }}
            ><BookOpen size={21} />Mijn Encyclopedie</button>}
            {accountsBeschikbaar() && (sessie
              ? <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); setUitlogFout(''); setUitlogOpen(true); }}><LogOut size={21} />Uitloggen</button>
              : <button type="button" role="menuitem" onClick={naarInloggen}><LogIn size={21} />Inloggen</button>)}
          </div>}
        </div>
      </div>
    </header>

    <Dialog
      open={uitlogOpen}
      title="Wil je uitloggen?"
      description={`Je spel wordt eerst bewaard. Log daarna weer in als ${sessie?.naam ?? 'jezelf'} om verder te spelen.`}
      onClose={() => { if (!uitlogBezig) setUitlogOpen(false); }}
      primaryAction={<Button pill onClick={bevestigUitloggen} disabled={uitlogBezig}>{uitlogBezig ? 'Bewaren…' : 'Ja, uitloggen'}</Button>}
      secondaryAction={<Button pill variant="secondary" onClick={() => setUitlogOpen(false)} disabled={uitlogBezig}>Blijven spelen</Button>}
    >
      {uitlogFout && <p className="ck-account__melding" role="alert">{uitlogFout}</p>}
    </Dialog>

    <Dialog
      open={avatarDialogOpen}
      title="Kies je avatar"
      description="Wie wil jij zijn in de wereld van CocoKiki?"
      onClose={() => setAvatarDialogOpen(false)}
      primaryAction={<Button pill onClick={() => setAvatarDialogOpen(false)}>Klaar</Button>}
    >
      <div className="avatar-picker" role="radiogroup" aria-label="Beschikbare avatars">
        {PROFILE_AVATARS.map(option => <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={avatarId === option.id}
          aria-label={`${option.label} kiezen`}
          className={avatarId === option.id ? 'is-selected' : undefined}
          onClick={() => selectAvatar(option.id)}
        >
          <img src={option.image} alt="" />
          <span>{option.label}</span>
        </button>)}
      </div>
    </Dialog>
  </>;
}
