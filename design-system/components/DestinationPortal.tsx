import React from 'react';
import { LockKeyhole } from 'lucide-react';
import { cx } from '../utils';

interface DestinationPortalProps {
  key?: string;
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  icon?: React.ReactNode;
  badge?: string;
  tone?: 'sage' | 'sky' | 'peach' | 'lilac' | 'honey';
  locked?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function DestinationPortal({ title, description, imageSrc, imageAlt = '', icon, badge, tone = 'sage', locked = false, className, disabled, type = 'button', ...props }: DestinationPortalProps) {
  return <button
    type={type}
    className={cx('ck-destination-portal', `ck-destination-portal--${tone}`, className)}
    disabled={disabled || locked}
    aria-label={`${title}${locked ? ', vergrendeld' : ''}`}
    {...props}
  >
    <span className={cx('ck-destination-portal__visual', !imageSrc && 'ck-destination-portal__visual--icon')}>
      {imageSrc ? <img src={imageSrc} alt={imageAlt} draggable={false} /> : icon}
    </span>
    <span className="ck-destination-portal__copy">
      {badge && <small>{badge}</small>}
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </span>
    {locked && <span className="ck-destination-portal__lock" aria-hidden="true"><LockKeyhole size={18} /></span>}
  </button>;
}
