import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CookingTip } from '../../data/cooking/tips';
export default function CookingTipCard({ tip, onDismiss }: { tip: CookingTip; onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, []);
  const content = <dialog ref={dialog} className="cooking-tip" aria-label="Tip van Coco" onCancel={event => { event.preventDefault(); onDismiss(); }}>
    <img src="/assets/library/cooking/coco-chef-tip.webp" alt="Coco" />
    <div><small>Coco’s kooktip</small><h2>{tip.title}</h2><p>{tip.text}</p><button className="cooking-tip__continue" type="button" onClick={onDismiss}>Verder koken</button></div>
    <button type="button" title="Tip sluiten" aria-label="Tip sluiten" onClick={onDismiss}><X /></button>
  </dialog>;
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
