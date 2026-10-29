import React from 'react';
import WorldTopBar from '../components/platform/WorldTopBar';
import DreamworldMap from '../components/dreamworld/DreamworldMap';
import '../components/dreamworld/dreamworld.css';

interface WorldHubProps {
  coins: number;
  onNavigate: (path: string) => void;
}

export default function WorldHub({ coins, onNavigate }: WorldHubProps) {
  return <main className="dreamworld" aria-label="CocoKiki Dreamworld">
    <DreamworldMap onNavigate={onNavigate} />
    <WorldTopBar coins={coins} onHome={() => onNavigate('/')} onNavigate={onNavigate} activePath="/" />
  </main>;
}
