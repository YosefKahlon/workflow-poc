import type { WorkflowDomain } from '../../platform/workflow-domain';
import { fireDispatchInitialEdges, fireDispatchInitialNodes, fireDispatchPaletteItems, fireDispatchTemplates } from './nodes';
import { FireControlsPanel } from './plugins/fire-controls-panel';
import { fireLiveHighlightPlugin } from './plugins/fire-live-highlight-plugin';

export const fireDispatchDomain: WorkflowDomain = {
  id: 'fire-dispatch',
  name: 'Fire Dispatch',
  paletteItems: fireDispatchPaletteItems,
  initialNodes: fireDispatchInitialNodes,
  initialEdges: fireDispatchInitialEdges,
  templates: fireDispatchTemplates,
  // OptionalNodeContent (unlike the app bar) isn't subject to the collision
  // problem that moved the trigger button out of registerComponentDecorator —
  // and the badge's own type-matching naturally no-ops on non-matching node
  // types, so having it globally registered for the page's lifetime is fine.
  plugins: [fireLiveHighlightPlugin],
  ControlsPanel: FireControlsPanel,
};
