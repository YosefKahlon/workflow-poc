import { StatusBadge } from '../../../platform/StatusBadge';
import { ApproveCurrentStepButton } from './approve-current-step-button';
import { usePotholeRunStore } from './pothole-run-store';
import { PotholeStatusPoller } from './pothole-status-poller';
import { TriggerPotholeEventButton } from './trigger-pothole-event-button';

// No positioning here — this renders as plain content inside the shared
// floating bar in App.tsx, alongside the canvas switcher.
export function PotholeControlsPanel() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <TriggerPotholeEventButton />
      <ApproveCurrentStepButton />
      <StatusBadge useRunStore={usePotholeRunStore} />
      <PotholeStatusPoller />
    </div>
  );
}
