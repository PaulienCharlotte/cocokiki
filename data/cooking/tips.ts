import type { CookingSession } from './preparation';
export interface CookingTip { id: string; title: string; text: string; character: 'coco'; triggerStepId?: string; displayMode?: 'contextual' | 'completion' }
export function eligibleCookingTip(tips: CookingTip[], session: CookingSession): CookingTip | undefined {
  if (session.steps[session.stepId]?.phase === 'wait') return undefined;
  return tips.find(tip => !session.seenTipIds?.includes(tip.id) && !session.dismissedTipIds?.includes(tip.id)
    && (tip.displayMode === 'completion' ? session.completed : !!tip.triggerStepId && session.completedStepIds.includes(tip.triggerStepId)));
}
export function presentCookingTip(session: CookingSession, tip: CookingTip): CookingSession {
  return { ...session, seenTipIds: [...new Set([...(session.seenTipIds ?? []), tip.id])] };
}
export function dismissCookingTip(session: CookingSession, tip: CookingTip): CookingSession {
  return { ...session, dismissedTipIds: [...new Set([...(session.dismissedTipIds ?? []), tip.id])] };
}
