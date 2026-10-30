import React from 'react';
import SpeechBubble from './ui/SpeechBubble';
import './tip-coach.css';

/**
 * Een tip in het reken- en topospel: de spraakwolk, op de breedte van die
 * schermen. De vorm zelf staat in components/ui/SpeechBubble.tsx.
 */
export default function TipCoach({ coach, children }: { coach: 'lua' | 'seb'; children: React.ReactNode }) {
  return <SpeechBubble character={coach} label="tip" className="tip-coach">{children}</SpeechBubble>;
}
