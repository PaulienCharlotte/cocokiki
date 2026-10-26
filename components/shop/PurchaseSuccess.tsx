import React from 'react';
import { ArrowLeft, Check, ShoppingBasket } from 'lucide-react';
import { Button, Dialog } from '../../design-system';

interface PurchaseSuccessProps {
  title: string;
  description: string;
  onContinue: () => void;
  onOverview: () => void;
  overviewLabel?: string;
  primaryAction?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PurchaseSuccess({ title, description, onContinue, onOverview, overviewLabel = 'Terug naar winkeloverzicht', primaryAction, children }: PurchaseSuccessProps) {
  const overview = <Button variant={primaryAction ? 'quiet' : 'primary'} startIcon={<ArrowLeft size={18} />} onClick={onOverview}>{overviewLabel}</Button>;
  return <Dialog open className="shop-purchase-success" title={title} description={description}
    illustration={<span className="shop-purchase-success__check"><Check size={28} /></span>}
    onClose={onContinue} closeLabel="Sluiten en verder winkelen"
    primaryAction={primaryAction ?? overview}
    secondaryAction={<>
      <Button variant="secondary" startIcon={<ShoppingBasket size={18} />} onClick={onContinue}>Verder winkelen</Button>
      {primaryAction && overview}
    </>}>
    {children}
  </Dialog>;
}
