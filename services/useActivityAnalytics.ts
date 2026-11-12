import { useEffect, useRef } from 'react';
import { analytics } from './analytics';
import type { ActivityId } from '../shared/analyticsEvents';

// A changed attempt means replay; an initial mount can resume the tab's existing run.
export function useActivityAnalytics(activity: ActivityId | null, attempt: unknown = 0, completed = false) {
  const previous = useRef<{ activity: ActivityId; attempt: unknown } | null>(null);
  useEffect(() => {
    if (!activity) return;
    if (completed) { analytics().complete(activity); return; }
    if (previous.current?.activity === activity && previous.current.attempt === attempt) return;
    analytics().start(activity, previous.current?.activity === activity);
    previous.current = { activity, attempt };
  }, [activity, attempt, completed]);
}
