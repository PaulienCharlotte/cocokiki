import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Backpack as BackpackIcon, ShoppingBag, Map, BookOpen, ChevronDown, UserRound } from 'lucide-react';
import Backpack from '../dreamworld/Backpack';
import { Button, Dialog, IconButton } from '../../design-system';
import { loadProfileAvatar, PROFILE_AVATARS, saveProfileAvatar } from '../../services/profile';
import type { ProfileAvatarId } from '../../services/profile';

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
  const [backpackOpen, setBackpackOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
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
    <header className={`world-hud${embedded ? ' world-hud--shell' : ''}`}>
      <div className="world-hud__leading">
        {onBack && <IconButton className="world-hud__back" size="small" label={backLabel} icon={<ArrowLeft size={19} />} onClick={onBack} />}
        <button className="world-hud__brand" type="button" onClick={onHome} aria-label="Naar de wereld">
          <img src="/images/cocokiki-logo.png" alt="CocoKiki" />
        </button>
      </div>
      <div className="world-hud__tools">
        {worldShortcut && <IconButton className="world-map-shortcut" label="Dreamworld-kaart" size="small" icon={<Map size={20} />} onClick={onHome} />}
        {onNavigate && <IconButton label="Winkels openen" size="small" icon={<ShoppingBag size={20} />} onClick={() => onNavigate('/shop')} />}
        {onNavigate && <IconButton label="Encyclopedie openen" size="small" icon={<BookOpen size={20} />} onClick={() => onNavigate(ENCYCLOPEDIA_PATH)} />}
        {onNavigate && <IconButton className="world-backpack-shortcut" label="Mijn rugzak" size="small" icon={<BackpackIcon size={20} />} onClick={() => setBackpackOpen(true)} />}
        <span className="world-hud__balance" aria-label={`${coins} CocoCoins`}>
          <span className="world-hud__coin" aria-hidden="true">★</span>
          <strong>{coins}</strong>
        </span>
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
              <div><strong>Hoi!</strong><span>CocoFan123</span></div>
            </div>
            <button type="button" role="menuitem" onClick={() => {
              setProfileOpen(false);
              setAvatarDialogOpen(true);
            }}><UserRound size={21} />Mijn profiel</button>
            {onNavigate && <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); setBackpackOpen(true); }}><BackpackIcon size={21} />Mijn rugzak</button>}
            {onNavigate && <button
              type="button"
              role="menuitem"
              className={activePath === ENCYCLOPEDIA_PATH ? 'is-active' : undefined}
              aria-current={activePath === ENCYCLOPEDIA_PATH ? 'page' : undefined}
              onClick={() => { setProfileOpen(false); onNavigate(ENCYCLOPEDIA_PATH); }}
            ><BookOpen size={21} />Mijn Encyclopedie</button>}
          </div>}
        </div>
      </div>
    </header>
    {backpackOpen && onNavigate && <Backpack onClose={() => setBackpackOpen(false)} onNavigate={onNavigate} />}

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
