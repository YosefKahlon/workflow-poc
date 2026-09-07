import { create } from 'zustand';

export type RunState = {
  lastWorkflowId: string | null;
  setLastWorkflowId: (id: string) => void;
  currentPhase: string | null;
  setCurrentPhase: (phase: string | null) => void;
  // Human-readable status ("Running" / "Waiting for approval" / "Completed" /
  // "Failed") computed server-side from Temporal's own execution status plus
  // the domain's phase query — see /workflows/{id}/status in Program.cs.
  displayStatus: string | null;
  setDisplayStatus: (status: string | null) => void;
};

// A factory, not a singleton — each domain that wants to track "the last
// workflow I started" + "its live phase" calls createRunStore() to get its
// own independent store. Keeps Fire's and Pothole's tracked runs from
// colliding with each other.
export function createRunStore() {
  return create<RunState>((set) => ({
    lastWorkflowId: null,
    setLastWorkflowId: (id) => set({ lastWorkflowId: id, currentPhase: null, displayStatus: null }),
    currentPhase: null,
    setCurrentPhase: (phase) => set({ currentPhase: phase }),
    displayStatus: null,
    setDisplayStatus: (status) => set({ displayStatus: status }),
  }));
}

export type RunStore = ReturnType<typeof createRunStore>;
