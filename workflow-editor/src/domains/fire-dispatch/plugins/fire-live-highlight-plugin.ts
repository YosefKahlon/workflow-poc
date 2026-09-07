import { createLiveHighlightPlugin } from '../../../platform/live-highlight';
import { useFireRunStore } from './fire-run-store';

// Maps FireDetectionWorkflow._phase (from FireDetectionWorkflow.GetStatus) to
// the matching canvas node's palette `type` — see FireDetectionWorkflow.cs's
// RunAsync for where each phase is set. "RejectedByDispatcher" and
// "Completed" are terminal states with nothing currently in progress, so
// they're intentionally left unmapped — no node highlights, same as
// Pothole's "Completed".
const PHASE_TO_NODE_TYPE: Record<string, string> = {
  AwaitingBreCheck: 'fireTrigger',
  EvaluatingBre: 'breCheck',
  AwaitingHumanApproval: 'humanApproval',
  Dispatching: 'call102',
  NotifyingResidents: 'notifyResidents',
};

export const fireLiveHighlightPlugin = createLiveHighlightPlugin(
  useFireRunStore,
  PHASE_TO_NODE_TYPE,
  'FireLiveHighlightPlugin',
);
