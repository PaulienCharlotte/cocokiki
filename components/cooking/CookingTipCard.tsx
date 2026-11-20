import React, { useEffect, useRef } from 'react';
import type { CookingTip } from '../../data/cooking/tips';
import SpeechBubble from '../ui/SpeechBubble';
import { kortVoorWolk } from './IngredientDiscoveryFlow';

/**
 * Coco's kooktip: geen pop-up meer (briefing 19 nov), maar een korte zin in
 * haar spraakwolk linksonder. Hij verdwijnt vanzelf, of eerder als je erop tikt.
 */
export default function CookingTipCard({ tip, onDismiss }: { tip: CookingTip; onDismiss: () => void }) {
  const sluit = useRef(onDismiss); sluit.current = onDismiss;
  useEffect(() => {
    const timer = window.setTimeout(() => sluit.current(), 7000);
    return () => window.clearTimeout(timer);
  }, [tip]);
  return <div className="cooking-tip-wolk" onClick={() => sluit.current()} role="presentation">
    <SpeechBubble character="coco" label="kooktip" vast>{kortVoorWolk(tip.text || tip.title)}</SpeechBubble>
  </div>;
}
