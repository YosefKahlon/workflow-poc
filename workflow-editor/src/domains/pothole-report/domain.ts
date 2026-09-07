import type { WorkflowDomain } from '../../platform/workflow-domain';
import { potholePaletteItems } from './nodes';
import { PotholeControlsPanel } from './plugins/pothole-controls-panel';
import { potholeLiveHighlightPlugin } from './plugins/pothole-live-highlight-plugin';

export const potholeReportDomain: WorkflowDomain = {
  id: 'pothole-report',
  name: 'Pothole Report',
  paletteItems: potholePaletteItems,
  plugins: [potholeLiveHighlightPlugin],
  ControlsPanel: PotholeControlsPanel,
};
