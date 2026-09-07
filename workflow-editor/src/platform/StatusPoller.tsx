import { useEffect } from 'react';

import { API_BASE_URL } from '../config';
import type { RunStore } from './run-store';

// Renders nothing — polls the real Temporal workflow's GetStatus query every
// 500ms for whichever domain's run-store instance it's given, and pushes the
// phase in, so that domain's live-highlight badge (see LiveHighlightBadge)
// can highlight whichever canvas node matches actual execution state.
export function StatusPoller({ useRunStore }: { useRunStore: RunStore }) {
  const lastWorkflowId = useRunStore((s) => s.lastWorkflowId);
  const setCurrentPhase = useRunStore((s) => s.setCurrentPhase);
  const setDisplayStatus = useRunStore((s) => s.setDisplayStatus);

  useEffect(() => {
    if (!lastWorkflowId) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/workflows/${lastWorkflowId}/status`);
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { phase: string; displayStatus: string };
        if (!cancelled) {
          setCurrentPhase(data.phase);
          setDisplayStatus(data.displayStatus);
        }
      } catch {
        // Not queryable yet (e.g. workflow just started) — retry next tick.
      }
    };

    poll();
    const interval = setInterval(poll, 500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lastWorkflowId, setCurrentPhase, setDisplayStatus]);

  return null;
}
