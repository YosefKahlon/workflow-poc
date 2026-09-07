import { StatusBadge } from '../../../platform/StatusBadge';
import { FireStatusPoller } from './fire-status-poller';
import { useFireRunStore } from './fire-run-store';
import { TriggerFireEventButton } from './trigger-fire-event-button';

// Renders as plain content inside the shared floating bar in App.tsx,
// alongside the canvas switcher — same pattern as Pothole's controls panel.
// This used to live in the app bar via registerComponentDecorator, but that
// API has no way to unregister a decorator, so it stayed visible even after
// switching to a different canvas (see trigger-fire-event-button's git
// history / this app's earlier iteration). Rendering it here instead, gated
// by App.tsx's normal "does the active canvas match this domain" check,
// sidesteps that gotcha entirely — no global registration involved.
export function FireControlsPanel() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <TriggerFireEventButton />
      <StatusBadge useRunStore={useFireRunStore} />
      <FireStatusPoller />
    </div>
  );
}
