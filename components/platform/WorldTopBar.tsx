import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, UserRound } from 'lucide-react';
import { Button, Dialog, IconButton } from '../../design-system';
import { loadProfileAvatar, PROFILE_AVATARS, saveProfileAvatar } from '../../services/profile';
import type { ProfileAvatarId } from '../../services/profile';

interface WorldTopBarProps {
  coins: number;
  onHome: () => void;
  onBack?: () => void;
  backLabel?: string;
  embedded?: boolean;
}

export default function WorldTopBar({ coins, onHome, onBack, backLabel = 'Terug naar de wereld', embedded = false }: WorldTopBarProps) {
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
            <button type="button" role="menuitem" className="is-active" onClick={() => {
              setProfileOpen(false);
              setAvatarDialogOpen(true);
            }}><UserRound size={21} />Mijn profiel</button>
          </div>}
        </div>
      </div>
    </header>

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
