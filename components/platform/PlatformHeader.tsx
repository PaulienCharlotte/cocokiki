import React from 'react';

interface PlatformHeaderProps {
  gameTitle?: string;
  onHome?: () => void;
  actions?: React.ReactNode;
}

export default function PlatformHeader({ gameTitle, onHome, actions }: PlatformHeaderProps) {
  const brand = <>
    <img src="/images/logo-compas-geel.svg" width="40" height="40" alt="" />
    <span>CocoKiki</span>
  </>;

  return <header className="app-header platform-header">
    <div className="header-inner">
      {onHome
        ? <button className="brand platform-brand" type="button" onClick={onHome} aria-label="Naar home">{brand}</button>
        : <div className="brand">{brand}</div>}
      {gameTitle && <span className="platform-game-title">{gameTitle}</span>}
      <div className="platform-header-actions">
        {actions}
      </div>
    </div>
  </header>;
}
