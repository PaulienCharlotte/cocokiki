import React, { useState } from 'react';
import { resalePrice, sellInventoryItem } from '../../services/inventorySales';

export default function InventorySellButton({ kind, productId, name, price, quantityLabel = '1 stuk', onSold }: {
  kind: 'decor' | 'groceries'; productId: string; name: string; price: number; quantityLabel?: string; onSold?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  return <div>
    <button type="button" className="inventory-sell" aria-label={`${confirming ? 'Bevestig verkoop' : 'Verkoop'} ${name}, ${quantityLabel}, voor ${resalePrice(price)} CocoCoins`} onClick={() => {
      if (!confirming) { setConfirming(true); return; }
      if (!sellInventoryItem(kind, productId, crypto.randomUUID())) { setError('Verkopen lukte niet. Controleer je voorraad.'); return; }
      setConfirming(false); setError(''); onSold?.();
    }}>{confirming ? 'Bevestig verkoop' : `Verkoop ${quantityLabel}`} · {resalePrice(price)} CocoCoins</button>
    {confirming && <button type="button" className="inventory-sell" onClick={() => setConfirming(false)}>Annuleren</button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
