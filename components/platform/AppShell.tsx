import React from 'react';
import WorldTopBar from './WorldTopBar';

interface AppShellProps {
  children: React.ReactNode;
  coins: number;
  onHome: () => void;
  onBack?: () => void;
  backLabel?: string;
  onNavigate?: (path: string) => void;
  activePath?: string;
}

export default function AppShell({ children, coins, onHome, onBack, backLabel = 'Terug naar de wereld', onNavigate, activePath }: AppShellProps) {
  return <div className="world-shell">
    <div className="world-shell__header">
      <WorldTopBar coins={coins} onHome={onHome} onBack={onBack} backLabel={backLabel} onNavigate={onNavigate} activePath={activePath} embedded />
    </div>
    {children}
  </div>;
}
