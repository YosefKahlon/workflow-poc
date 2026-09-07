import { useState } from 'react';
import { useStore } from '@workflowbuilder/sdk';

import { API_BASE_URL } from '../../../config';
import { PlayButton } from '../../../platform/PlayButton';
import { usePotholeRunStore } from './pothole-run-store';

export function TriggerPotholeEventButton() {
  const nodes = useStore((s) => s.nodes);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleClick = async () => {
    const reportNode = nodes.find((n) => n.data.type === 'potholeReport');
    if (!reportNode) {
      setStatus('Add a "Pothole Reported" node to the canvas first.');
      return;
    }
    const street = (reportNode.data.properties as { street?: string }).street ?? 'Unknown street';

    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/events/pothole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street }),
      });
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = (await response.json()) as { workflowId: string };
      usePotholeRunStore.getState().setLastWorkflowId(data.workflowId);
      setStatus(`Started ${data.workflowId} (street: "${street}") — use "Confirm Repair" to signal it done`);
    } catch (error) {
      setStatus(`Could not reach API at ${API_BASE_URL}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const isError = status?.startsWith('Could not reach') || status?.startsWith('Add a');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <PlayButton label="Trigger Pothole Report" onClick={handleClick} busy={busy} title={status ?? undefined} />
      {status && (
        <span
          title={status}
          style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', backgroundColor: isError ? '#dc2626' : '#16a34a' }}
        />
      )}
    </div>
  );
}
