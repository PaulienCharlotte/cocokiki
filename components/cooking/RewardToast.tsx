import React from 'react';
import { Check, Coins } from 'lucide-react';

interface RewardToastProps {
  message: string;
  coins?: number;
}

export default function RewardToast({ message, coins = 0 }: RewardToastProps) {
  return <div className="reward-toast" role="status" aria-live="polite">
    <span aria-hidden="true"><Check /></span>
    <strong>{message}</strong>
    {coins > 0 && <small><Coins />+{coins}</small>}
  </div>;
}
