import React, { useState } from 'react';
import { Check, Coins, X } from 'lucide-react';
import { resalePrice, sellInventoryItem } from '../../services/inventorySales';

/**
 * Verkopen gaat via één klein icoon. De tweede tik bevestigt, zodat een kind
 * niet per ongeluk iets kwijtraakt; wat het oplevert staat ernaast.
 */
export default function InventorySellButton({ kind, productId, name, price, quantityLabel = '1 stuk', onSold }: {
  kind: 'decor' | 'groceries'; productId: string; name: string; price: number; quantityLabel?: string; onSold?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const opbrengst = resalePrice(price);

  return <div className={`inventory-sell${confirming ? ' is-confirming' : ''}`}>
    <button
      type="button"
      className="inventory-sell__action"
      aria-label={confirming
        ? `Bevestig: verkoop ${name}, ${quantityLabel}, voor ${opbrengst} CocoCoins`
        : `Verkoop ${name}, ${quantityLabel}, voor ${opbrengst} CocoCoins`}
      title={confirming ? 'Tik nog een keer om te verkopen' : `Verkopen voor ${opbrengst}`}
      onClick={() => {
        if (!confirming) { setConfirming(true); return; }
        if (!sellInventoryItem(kind, productId, crypto.randomUUID())) {
          setError('Verkopen lukte niet. Controleer je voorraad.');
          return;
        }
        setConfirming(false);
        setError('');
        onSold?.();
      }}
    >
      {confirming ? <Check aria-hidden="true" /> : <Coins aria-hidden="true" />}
      <span className="inventory-sell__amount">{opbrengst}</span>
    </button>
    {confirming && <button type="button" className="inventory-sell__cancel" aria-label="Verkoop afbreken" title="Afbreken" onClick={() => { setConfirming(false); setError(''); }}>
      <X aria-hidden="true" />
    </button>}
    {error && <p className="inventory-sell__error" role="alert">{error}</p>}
  </div>;
}
