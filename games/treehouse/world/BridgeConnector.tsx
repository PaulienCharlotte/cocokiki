import React from 'react';
import type { WorldPoint } from './layout';

interface BridgeConnectorProps { key?: string; from: WorldPoint; to: WorldPoint; }

export default function BridgeConnector({ from, to }: BridgeConnectorProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return <div className="adventure-bridge" aria-hidden="true" style={{
    left: from.x,
    top: from.y,
    width: distance,
    transform: `translateY(-50%) rotate(${angle}deg)`,
  }}><img src="/games/treehouse/world-v2/bridge-cutout.png" alt="" /></div>;
}
