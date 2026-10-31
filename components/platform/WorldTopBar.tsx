import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ShoppingBag, Map, BookOpen, ChevronDown, UserRound, Menu, ChefHat } from 'lucide-react';
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!navigationOpen) return;
    const close = (event: PointerEvent) => { if (!navigationRef.current?.contains(event.target as Node)) setNavigationOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setNavigationOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [navigationOpen]);
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
          <img src="/images/cocokiki-logo.webp" alt="CocoKiki" />
        </button>
      </div>
      <div className="world-hud__tools">
        {(worldShortcut || onNavigate) && <IconButton className="world-desktop-tool world-map-shortcut" label="Dreamworld-kaart" size="small" icon={<Map size={20} />} onClick={onHome} />}
        {onNavigate && <IconButton className="world-desktop-tool" label="Winkels openen" size="small" icon={<ShoppingBag size={20} />} onClick={() => onNavigate('/shop')} />}
        {onNavigate && <IconButton className="world-desktop-tool" label="Encyclopedie openen" size="small" icon={<BookOpen size={20} />} onClick={() => onNavigate(ENCYCLOPEDIA_PATH)} />}
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
            {onNavigate && <button
              type="button"
              role="menuitem"
              className={activePath === ENCYCLOPEDIA_PATH ? 'is-active' : undefined}
              aria-current={activePath === ENCYCLOPEDIA_PATH ? 'page' : undefined}
              onClick={() => { setProfileOpen(false); onNavigate(ENCYCLOPEDIA_PATH); }}
            ><BookOpen size={21} />Mijn Encyclopedie</button>}
          </div>}
        </div>
        <div className="world-hud__mobile-menu" ref={navigationRef}>
          <IconButton label="Navigatiemenu openen" icon={<Menu size={20} />} aria-expanded={navigationOpen} onClick={() => { setNavigationOpen(open => !open); setProfileOpen(false); }} />
          {navigationOpen && <nav className="world-hud__navigation" aria-label="Hoofdnavigatie">
            <button type="button" onClick={() => { setNavigationOpen(false); onHome(); }}><Map />Wereldkaart</button>
            {onNavigate && <>
              <button type="button" onClick={() => { setNavigationOpen(false); onNavigate('/shop'); }}><ShoppingBag />Winkels</button>
              <button type="button" onClick={() => { setNavigationOpen(false); onNavigate('/treehouse/cookbook'); }}><ChefHat />Kookboek</button>
              <button type="button" onClick={() => { setNavigationOpen(false); onNavigate(ENCYCLOPEDIA_PATH); }}><BookOpen />Encyclopedie</button>
            </>}
          </nav>}
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
