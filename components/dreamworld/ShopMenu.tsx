import React from 'react';
import { Armchair, ShoppingBasket, Sprout } from 'lucide-react';
import { Button, Dialog } from '../../design-system';
import { WORLD_SHOPS } from '../../platform/dreamworld';

const icons = { groceries: ShoppingBasket, furniture: Armchair, plants: Sprout };

export default function ShopMenu({ onClose, onNavigate }: { onClose: () => void; onNavigate: (path: string) => void }) {
  return <Dialog open title="Winkels" onClose={onClose} primaryAction={null}>
    <nav className="dream-shop-menu" aria-label="Kies een winkel">
      {WORLD_SHOPS.map(shop => { const Icon = icons[shop.id]; return <Button key={shop.id} variant="secondary" fullWidth startIcon={<Icon size={22} />} onClick={() => { onClose(); onNavigate(shop.path); }}>{shop.label}</Button>; })}
    </nav>
  </Dialog>;
}
