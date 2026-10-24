import React from 'react';
import { cx } from '../utils';

interface GameHUDProps {
  label: string;
  leading?: React.ReactNode;
  title?: string;
  stats?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
  className?: string;
  id?: string;
}

export default function GameHUD({ label, leading, title, stats, actions, compact = false, className, ...props }: GameHUDProps) {
  return <section className={cx('ck-game-hud', compact && 'ck-game-hud--compact', className)} aria-label={label} {...props}>
    {(leading || title) && <div className="ck-game-hud__identity">{leading}{title && <strong>{title}</strong>}</div>}
    {stats && <div className="ck-game-hud__stats">{stats}</div>}
    {actions && <div className="ck-game-hud__actions">{actions}</div>}
  </section>;
}
