import React, { useEffect, useRef, useState } from 'react';
import { REWARD_EVENT } from '../../services/localState';
import './reward-feedback.css';

interface Reward { id: number; amount: number; balance: number; x: number; y: number; dx: number; dy: number }
/** One celebration for each successfully saved reward, on every screen. */
export default function RewardFeedback() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const sequence = useRef(0), pointer = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const point = (event: PointerEvent) => { pointer.current = { x: event.clientX, y: event.clientY }; };
    const earned = (event: Event) => {
      const { amount, balance } = (event as CustomEvent<{ amount: number; balance: number }>).detail;
      if (!(amount > 0)) return;
      const target = document.querySelector('[data-coin-balance], .world-hud__balance')?.getBoundingClientRect();
      const x = Math.max(80, Math.min(window.innerWidth - 80, pointer.current?.x ?? window.innerWidth / 2));
      const y = Math.max(150, Math.min(window.innerHeight - 120, pointer.current?.y ?? window.innerHeight / 2));
      const id = ++sequence.current;
      setRewards(previous => [...previous, { id, amount, balance, x, y, dx: (target ? target.x + target.width / 2 : window.innerWidth / 2) - x, dy: (target ? target.y + target.height / 2 : 40) - y }]);
      const timer = setTimeout(() => { setRewards(previous => previous.filter(item => item.id !== id)); timers.delete(timer); }, 1800);
      timers.add(timer);
    };
    window.addEventListener('pointerdown', point, true);
    window.addEventListener(REWARD_EVENT, earned);
    return () => { window.removeEventListener('pointerdown', point, true); window.removeEventListener(REWARD_EVENT, earned); timers.forEach(clearTimeout); };
  }, []);
  return <div className="reward-feedback" aria-live="polite" aria-atomic="true">
    {rewards.map(reward => <div key={reward.id} className="reward-feedback__burst" style={{ left: reward.x, top: reward.y, '--reward-dx': `${reward.dx}px`, '--reward-dy': `${reward.dy}px` } as React.CSSProperties}>
      <span className="reward-feedback__coin ck-munt" aria-hidden="true" /><strong>+{reward.amount}</strong><span className="sr-only">CocoCoins verdiend. Je saldo is {reward.balance}.</span>
      <span className="reward-feedback__spark" aria-hidden="true">✦</span>
    </div>)}
  </div>;
}
