import { useState } from 'react';

import { API_BASE_URL } from '../../../config';
import { usePotholeRunStore } from './pothole-run-store';

// Generic on purpose: this signals whichever step the workflow is currently
// paused on (Repair Crew Confirmation, Manager Approval, or any future
// Wait-kind node) — the Api resolves "which step" via GetStatus, so this
// button never needs to know which node type it's approving.
export function ApproveCurrentStepButton() {
  const lastWorkflowId = usePotholeRunStore((s) => s.lastWorkflowId);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleClick = async () => {
    if (!lastWorkflowId) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/${lastWorkflowId}/approve-current`, { method: 'POST' });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `API returned ${response.status}`);
      }
      setStatus(`Approved current step for ${lastWorkflowId}`);
      setIsError(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
      setIsError(true);
    } finally {
      setBusy(false);
    }
  };

  const shortId = lastWorkflowId ? lastWorkflowId.slice(-8) : null;
  const title = [lastWorkflowId, status].filter(Boolean).join(' — ') || undefined;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !lastWorkflowId}
        title={title}
        style={{ cursor: busy || !lastWorkflowId ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Signaling…' : shortId ? `Approve Current Step (…${shortId})` : 'Approve Current Step (no run yet)'}
      </button>
      {status && (
        <span
          title={status}
          style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', backgroundColor: isError ? '#dc2626' : '#16a34a' }}
        />
      )}
    </div>
  );
}
