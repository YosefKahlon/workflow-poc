import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    note: { type: 'string' },
  },
} satisfies NodeSchema;

export type HumanApprovalSchema = typeof schema;
const scope = getScope<HumanApprovalSchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Human-in-the-Loop',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.note'),
          label: 'Note',
          minRows: 3,
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<HumanApprovalSchema>> = {
  label: 'Dispatcher Approval',
  description: 'Workflow pauses here and waits for a Temporal signal — a human dispatcher must approve or reject.',
  status: statusOptions.active.value,
  note: 'Any action with physical/safety/legal impact requires human approval before execution.',
};

export const humanApprovalNode: PaletteItem<HumanApprovalSchema> = {
  type: 'humanApproval',
  label: 'Dispatcher Approval',
  description: 'Pauses execution until a dispatcher approves or rejects via signal. Never auto-approved.',
  icon: 'UserCheck',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      approved: { type: 'boolean', label: 'Approved', description: 'Dispatcher decision' },
      dispatcherId: { type: 'string', label: 'Dispatcher ID', description: 'Who made the decision, for audit' },
    },
  },
};
