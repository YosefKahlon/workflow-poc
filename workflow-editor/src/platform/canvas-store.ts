import { create } from 'zustand';

import { API_BASE_URL } from '../config';

export type CanvasDef = {
  id: string;
  name: string;
  nodeTypeKeys: string[];
};

type CanvasStoreState = {
  canvases: CanvasDef[];
  activeCanvasId: string;
  loaded: boolean;
  setActiveCanvas: (id: string) => void;
  addCanvas: (def: CanvasDef) => void;
  seedDefaults: (defaults: CanvasDef[]) => void;
  load: () => Promise<void>;
};

async function persistCanvases(canvases: CanvasDef[]) {
  try {
    await fetch(`${API_BASE_URL}/api/canvases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(canvases),
    });
  } catch {
    // POC-only persistence — a failed save just means new canvases won't
    // survive a reload. Not fatal.
  }
}

// Deliberately has zero knowledge of any domain — no import of
// domain-registry here. Domain code (e.g. trigger-fire-event-button.tsx)
// needs to read activeCanvasId, and domain-registry needs to be assembled
// before this store has anything to show, so this store importing
// domain-registry back would be a circular import. App.tsx sits above both
// platform and domain code, so it's the one place safe to compute per-domain
// defaults and hand them to seedDefaults().
export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  canvases: [],
  activeCanvasId: '',
  loaded: false,
  setActiveCanvas: (id) => set({ activeCanvasId: id }),
  addCanvas: (def) => {
    const canvases = [...get().canvases, def];
    set({ canvases, activeCanvasId: def.id });
    void persistCanvases(canvases);
  },
  seedDefaults: (defaults) => {
    if (get().canvases.length === 0 && defaults.length > 0) {
      set({ canvases: defaults, activeCanvasId: defaults[0].id });
    }
  },
  load: async () => {
    if (get().loaded) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/canvases`);
      if (response.ok) {
        const canvases = (await response.json()) as CanvasDef[];
        if (canvases.length > 0) {
          const currentId = get().activeCanvasId;
          const stillValid = canvases.some((c) => c.id === currentId);
          set({ canvases, activeCanvasId: stillValid ? currentId : canvases[0].id });
        }
      }
    } catch {
      // Fall back to whatever seedDefaults already put in place — POC-only persistence.
    } finally {
      set({ loaded: true });
    }
  },
}));
