import React, { useState } from 'react';
import { Check, Coins, X } from 'lucide-react';

export default function SellAction({ name, amount, disabled = false, onSell }: {
  key?: string; name: string; amount: number; disabled?: boolean; onSell: () => boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  return <div className={`inventory-sell${confirming ? ' is-confirming' : ''}`}>
    <button type="button" className="inventory-sell__action" disabled={disabled}
      aria-label={`${confirming ? 'Bevestig verkoop' : 'Verkoop'} ${name}, voor ${amount} CocoCoins`}
      title={confirming ? 'Verkoop bevestigen' : `Verkopen voor ${amount} CocoCoins`}
      onClick={() => {
        if (!confirming) { setConfirming(true); return; }
        if (!onSell()) { setError('Verkopen lukt even niet. Probeer opnieuw.'); return; }
        setConfirming(false); setError('');
      }}>
      {confirming ? <Check aria-hidden="true" /> : <Coins aria-hidden="true" />}
      <span className="inventory-sell__amount">{amount}</span>
    </button>
    {confirming && <button type="button" className="inventory-sell__cancel" aria-label="Verkoop afbreken" title="Afbreken" onClick={() => { setConfirming(false); setError(''); }}><X aria-hidden="true" /></button>}
    {error && <p className="inventory-sell__error" role="alert">{error}</p>}
  </div>;
}
