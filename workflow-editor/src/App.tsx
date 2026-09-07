import { WorkflowBuilder } from '@workflowbuilder/sdk';

import { API_BASE_URL } from './config';
import type { CanvasDef } from './platform/canvas-store';
import { ALL_DOMAINS } from './platform/domain-registry';
import { CanvasSwitcher } from './platform/CanvasSwitcher';
import { useCanvasStore } from './platform/canvas-store';
import { resolvePaletteItems } from './platform/node-registry';

// One default canvas per registered domain. This lives here, not in
// canvas-store.ts, deliberately: canvas-store has to stay domain-agnostic
// (domain code reads activeCanvasId from it — see trigger-fire-event-button's
// comment — so canvas-store importing domain-registry back would be a
// circular import). App.tsx sits above both platform and domain code, so
// it's the one safe place to bridge them. Runs once, synchronously, before
// the first render — CanvasSwitcher's later API load (if anything was
// persisted) overwrites this.
const DEFAULT_CANVASES: CanvasDef[] = ALL_DOMAINS.map((domain) => ({
  id: domain.id,
  name: domain.name,
  nodeTypeKeys: domain.paletteItems.map((item) => (item as { type: string }).type),
}));
useCanvasStore.getState().seedDefaults(DEFAULT_CANVASES);

// Fully generic shell: it only ever talks to the WorkflowDomain contract
// (platform/workflow-domain.ts) and the active canvas's own fields — it has
// no idea "fire-dispatch" or "pothole-report" exist. A canvas whose id
// matches a registered domain picks up that domain's bespoke plugins,
// pre-built diagram, and controls panel automatically; any other canvas
// (including ones a user creates) just gets a blank, generic canvas.
function App() {
  const canvases = useCanvasStore((s) => s.canvases);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const activeCanvas = canvases.find((c) => c.id === activeCanvasId) ?? canvases[0];
  const domain = ALL_DOMAINS.find((d) => d.id === activeCanvas.id);
  const ControlsPanel = domain?.ControlsPanel;

  return (
    <>
      {/*
        The SDK's own "Nodes Library" and "Properties" panels each span the
        full left/right edge of the screen, top to bottom — not just a corner.
        A fixed element anchored to either edge collides with them regardless
        of vertical position (this bit us twice: once in the app bar, once
        here). Centering at the bottom, clear of both edges, avoids the whole
        class of collision instead of chasing one more coordinate.
      */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 10,
          background: 'white',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '90vw',
          fontSize: 12,
        }}
      >
        <CanvasSwitcher />
        {ControlsPanel && (
          <>
            <div style={{ width: 1, alignSelf: 'stretch', background: '#e5e7eb' }} />
            <ControlsPanel />
          </>
        )}
      </div>
      {/*
        `key={activeCanvas.id}` forces a full unmount/remount when switching
        canvases. The SDK's internal store is a shared singleton reset on each
        Root mount (see its useStore doc comment) — it's built for exactly one
        Root mounted at a time, not several simultaneously. Remounting, rather
        than somehow keeping multiple Roots alive, is what avoids one canvas's
        state bleeding into another's.
      */}
      <WorkflowBuilder.Root
        key={activeCanvas.id}
        name={activeCanvas.name}
        nodeTypes={resolvePaletteItems(activeCanvas.nodeTypeKeys)}
        diagramTemplates={domain?.templates ?? []}
        initialNodes={domain?.initialNodes ?? []}
        initialEdges={domain?.initialEdges ?? []}
        layoutDirection="RIGHT"
        integration={{
          strategy: 'api',
          endpoints: {
            load: `${API_BASE_URL}/api/workflow-diagrams/${activeCanvas.id}`,
            save: `${API_BASE_URL}/api/workflow-diagrams/${activeCanvas.id}`,
          },
        }}
        plugins={domain?.plugins ?? []}
      />
    </>
  );
}

export default App;
