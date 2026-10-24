import React from 'react';
import { cx } from '../utils';

interface ProgressIndicatorProps {
  value: number;
  max: number;
  label: string;
  showValue?: boolean;
  tone?: 'primary' | 'success' | 'reward';
  compact?: boolean;
  className?: string;
}

export default function ProgressIndicator({ value, max, label, showValue = true, tone = 'primary', compact = false, className }: ProgressIndicatorProps) {
  const safeMax = Math.max(1, max);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  return <div className={cx('ck-progress', `ck-progress--${tone}`, compact && 'ck-progress--compact', className)}>
    <div className="ck-progress__meta"><span>{label}</span>{showValue && <strong>{safeValue}/{safeMax}</strong>}</div>
    <progress className="ck-progress__track" value={safeValue} max={safeMax} aria-label={label} />
  </div>;
}
