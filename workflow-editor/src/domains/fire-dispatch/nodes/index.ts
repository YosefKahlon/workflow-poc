import type { DiagramModel, PaletteItemOrGroup, TemplateModel, WorkflowBuilderEdge, WorkflowBuilderNode } from '@workflowbuilder/sdk';

import { breCheckNode } from './bre-check';
import { call102Node } from './call-102';
import { fireTriggerNode } from './fire-trigger';
import { humanApprovalNode } from './human-approval';
import { notifyResidentsNode } from './notify-residents';

export const fireDispatchPaletteItems: PaletteItemOrGroup[] = [
  fireTriggerNode,
  breCheckNode,
  humanApprovalNode,
  call102Node,
  notifyResidentsNode,
];

const nodes: WorkflowBuilderNode[] = [
  {
    id: 'fire-trigger-1',
    type: 'node',
    position: { x: 0, y: 120 },
    data: {
      segments: [],
      type: fireTriggerNode.type,
      icon: fireTriggerNode.icon,
      properties: fireTriggerNode.defaultPropertiesData,
    },
  },
  {
    id: 'bre-check-1',
    type: 'node',
    position: { x: 340, y: 120 },
    data: {
      segments: [],
      type: breCheckNode.type,
      icon: breCheckNode.icon,
      properties: breCheckNode.defaultPropertiesData,
    },
  },
  {
    id: 'human-approval-1',
    type: 'node',
    position: { x: 680, y: 120 },
    data: {
      segments: [],
      type: humanApprovalNode.type,
      icon: humanApprovalNode.icon,
      properties: humanApprovalNode.defaultPropertiesData,
    },
  },
  {
    id: 'call-102-1',
    type: 'node',
    position: { x: 1020, y: 0 },
    data: {
      segments: [],
      type: call102Node.type,
      icon: call102Node.icon,
      properties: call102Node.defaultPropertiesData,
    },
  },
  {
    id: 'notify-residents-1',
    type: 'node',
    position: { x: 1020, y: 240 },
    data: {
      segments: [],
      type: notifyResidentsNode.type,
      icon: notifyResidentsNode.icon,
      properties: notifyResidentsNode.defaultPropertiesData,
    },
  },
];

const edges: WorkflowBuilderEdge[] = [
  {
    id: 'edge-trigger-bre',
    source: 'fire-trigger-1',
    sourceHandle: 'source',
    target: 'bre-check-1',
    targetHandle: 'target',
    type: 'labelEdge',
  },
  {
    id: 'edge-bre-approval',
    source: 'bre-check-1',
    sourceHandle: 'source',
    target: 'human-approval-1',
    targetHandle: 'target',
    type: 'labelEdge',
  },
  {
    id: 'edge-approval-call102',
    source: 'human-approval-1',
    sourceHandle: 'source',
    target: 'call-102-1',
    targetHandle: 'target',
    type: 'labelEdge',
    data: { label: 'Approved' },
  },
  {
    id: 'edge-approval-notify',
    source: 'human-approval-1',
    sourceHandle: 'source',
    target: 'notify-residents-1',
    targetHandle: 'target',
    type: 'labelEdge',
    data: { label: 'Approved' },
  },
];

export const fireDispatchInitialNodes = nodes;
export const fireDispatchInitialEdges = edges;

const fireDispatchDiagram: DiagramModel = {
  name: 'Fire Detected → Call 102',
  layoutDirection: 'RIGHT',
  diagram: { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } },
};

export const fireDispatchTemplates: TemplateModel[] = [
  {
    id: 1,
    name: 'Fire Detected → Call 102',
    icon: 'Fire',
    value: fireDispatchDiagram,
  },
];
