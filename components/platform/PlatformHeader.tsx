import { loadCurrency } from '../../services/currency';
import WorldTopBar from './WorldTopBar';

interface PlatformHeaderProps {
  onHome?: () => void;
  coins?: number;
}

export default function PlatformHeader({ onHome, coins = loadCurrency() }: PlatformHeaderProps) {
  if (!onHome) return null;

  return <div className="platform-world-header">
    <WorldTopBar coins={coins} onHome={onHome} />
  </div>;
}
