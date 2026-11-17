import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from '../../design-system';

export default function WorldLightSwitch({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  return <div className="world-light-switch"><IconButton label={night ? 'Daglicht tonen' : 'Nachtlucht tonen'} icon={night ? <Sun /> : <Moon />} onClick={onToggle} /></div>;
}
