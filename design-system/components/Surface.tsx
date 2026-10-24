import React from 'react';
import { cx } from '../utils';

interface SurfaceProps {
  as?: 'div' | 'section' | 'article';
  tone?: 'default' | 'soft' | 'tinted' | 'glass';
  padding?: 'none' | 'small' | 'medium' | 'large';
  elevated?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export default function Surface({ as = 'div', tone = 'default', padding = 'medium', elevated = false, className, ...props }: SurfaceProps) {
  return React.createElement(as, {
    ...props,
    className: cx('ck-surface', `ck-surface--${tone}`, `ck-surface--padding-${padding}`, elevated && 'ck-surface--elevated', className),
  });
}
