import React from 'react';
import { cx } from '../utils';
import type { ButtonVariant } from './Button';

export interface IconButtonProps {
  label: string;
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  'aria-current'?: React.AriaAttributes['aria-current'];
  'aria-expanded'?: boolean;
}

export default function IconButton({ label, icon, variant = 'quiet', size = 'medium', className, title, type = 'button', ...props }: IconButtonProps) {
  return <button
    type={type}
    className={cx('ck-icon-button', `ck-icon-button--${variant}`, `ck-icon-button--${size}`, className)}
    aria-label={label}
    title={title ?? label}
    {...props}
  >
    <span aria-hidden="true">{icon}</span>
  </button>;
}
