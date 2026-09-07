import type { ComponentType } from 'react';
import type {
  PaletteItemOrGroup,
  TemplateModel,
  WorkflowBuilderEdge,
  WorkflowBuilderNode,
  WorkflowBuilderPlugin,
} from '@workflowbuilder/sdk';

// The contract every workflow domain (Fire Dispatch, Pothole Report, and any
// future one) implements once, in its own domains/<name>/domain.ts. This file
// has zero knowledge of any specific domain — that's the point: the platform
// (canvas-store, node-registry, App.tsx) only ever talks to this shape, so
// onboarding a new domain never requires touching platform code.
export type WorkflowDomain = {
  id: string;
  name: string;
  paletteItems: PaletteItemOrGroup[];
  initialNodes?: WorkflowBuilderNode[];
  initialEdges?: WorkflowBuilderEdge[];
  templates?: TemplateModel[];
  // registerComponentDecorator-based plugins (e.g. an app-bar button). Prefer
  // ControlsPanel below for anything wider than a single small icon button —
  // the app bar has very little safe horizontal room before colliding with
  // the SDK's own title element, and registerComponentDecorator has no
  // unregister API, so anything registered here stays visible on every
  // canvas for the rest of the page's life, not just this domain's. Neither
  // Fire nor Pothole uses this anymore for exactly that reason.
  plugins?: WorkflowBuilderPlugin[];
  // Rendered in the shared floating bar in App.tsx, only while this domain's
  // canvas is active — the safe way to add domain-specific controls.
  ControlsPanel?: ComponentType;
};
