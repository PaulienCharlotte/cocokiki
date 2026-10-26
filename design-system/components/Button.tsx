import React from 'react';
import { cx } from '../utils';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'reward';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  /** Zodat een lijst knoppen gewoon met key gemaakt kan worden. */
  key?: React.Key;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  id?: string;
  name?: string;
  value?: string | number;
  tabIndex?: number;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  pill = false,
  fullWidth = false,
  startIcon,
  endIcon,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button
    type={type}
    className={cx('ck-button', `ck-button--${variant}`, `ck-button--${size}`, pill && 'ck-button--pill', fullWidth && 'ck-button--full', className)}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {startIcon && <span className="ck-button__icon" aria-hidden="true">{startIcon}</span>}
    <span className="ck-button__label">{loading ? 'Even wachten...' : children}</span>
    {endIcon && <span className="ck-button__icon" aria-hidden="true">{endIcon}</span>}
  </button>;
}
