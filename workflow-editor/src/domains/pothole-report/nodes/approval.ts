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

export type ApprovalSchema = typeof schema;
const scope = getScope<ApprovalSchema>;

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

const defaultPropertiesData: Required<NodeDataProperties<ApprovalSchema>> = {
  label: 'Manager Approval',
  description:
    "Workflow pauses here and waits for an ApproveStep signal — same generic Wait mechanism as Repair Crew Confirmation. Added purely as a diagram node; PotholeWorkflow.cs doesn't know this step exists.",
  status: statusOptions.active.value,
  note: 'Waits indefinitely until a manager approves this step.',
};

export const approvalNode: PaletteItem<ApprovalSchema> = {
  type: 'approval',
  label: 'Manager Approval',
  description: 'Pauses execution until an approval signal is received for this step. Never auto-approved.',
  icon: 'ShieldCheck',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      approved: { type: 'boolean', label: 'Approved', description: 'Whether the step was approved' },
    },
  },
};
