import React from 'react';
import { Lightbulb } from 'lucide-react';
import SpeechBubble from '../../components/ui/SpeechBubble';

/**
 * De tip van Baby Lua.
 *
 * De som spreekt meestal voor zich, dus standaard staat hier alleen een
 * stille knop. Druk je erop, dan legt Lua het uit in haar spraakwolk — dezelfde
 * wolk als waarin ze de vraag stelt. Zie `.claude/skills/cocokiki-ui`.
 */
export default function MathHelp({ open, onToggle, children }: { open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <div className="math-help">
    <button type="button" className="math-help__button" aria-expanded={open} onClick={onToggle}>
      <Lightbulb size={18} aria-hidden="true" /><span>{open ? 'Tip sluiten' : 'Tip van Baby Lua'}</span>
    </button>
    {open && <SpeechBubble character="lua" label="tip" className="math-tip">{children}</SpeechBubble>}
  </div>;
}
