import React from 'react';
import { resalePrice, sellInventoryItem } from '../../services/inventorySales';
import SellAction from './SellAction';

export default function InventorySellButton({ kind, productId, name, price, quantityLabel = '1 stuk', onSold }: {
  kind: 'decor' | 'groceries'; productId: string; name: string; price: number; quantityLabel?: string; onSold?: () => void;
}) {
  return <SellAction name={`${name}, ${quantityLabel}`} amount={resalePrice(price)} onSell={() => {
    if (!sellInventoryItem(kind, productId, crypto.randomUUID())) return false;
    onSold?.();
    return true;
  }} />;
}
