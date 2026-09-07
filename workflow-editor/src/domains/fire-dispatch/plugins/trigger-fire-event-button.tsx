import { useState } from 'react';

import { API_BASE_URL } from '../../../config';
import { PlayButton } from '../../../platform/PlayButton';
import { useFireRunStore } from './fire-run-store';

const MOCK_FIRE_EVENT = {
  location: 'Caesarea Marina, Pier 3',
  confidence: 0.92,
  zone: 'Residential',
};

export function TriggerFireEventButton() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/events/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_FIRE_EVENT),
      });
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = (await response.json()) as { workflowId: string };
      useFireRunStore.getState().setLastWorkflowId(data.workflowId);
      setStatus(`Started ${data.workflowId} — approve with POST /workflows/${data.workflowId}/approve`);
    } catch (error) {
      setStatus(`Could not reach API at ${API_BASE_URL}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const isError = status?.startsWith('Could not reach');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <PlayButton label="Trigger Fire Event" onClick={handleClick} busy={busy} title={status ?? undefined} />
      {status && (
        <span
          title={status}
          style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', backgroundColor: isError ? '#dc2626' : '#16a34a' }}
        />
      )}
    </div>
  );
}
