import type { PaletteItem } from '@workflowbuilder/sdk';

import { createLiveHighlightPlugin } from '../../../platform/live-highlight';
import { potholePaletteItems } from '../nodes';
import { usePotholeRunStore } from './pothole-run-store';

// PotholeWorkflow.GetStatus() now reports the current step's own node type as
// its phase (e.g. "assessSeverity", "approval") — the interpreter workflow
// runs whatever steps the saved diagram contains, so there's no fixed phase
// list to hand-maintain here. This map is just the identity map type -> type,
// generated from the palette so any new node type (like "approval") is
// covered automatically with no edit to this file.
const PHASE_TO_NODE_TYPE: Record<string, string> = Object.fromEntries(
  (potholePaletteItems as PaletteItem[]).map((item) => [item.type, item.type]),
);

export const potholeLiveHighlightPlugin = createLiveHighlightPlugin(
  usePotholeRunStore,
  PHASE_TO_NODE_TYPE,
  'PotholeLiveHighlightPlugin',
);
