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

export type RepairWaitSchema = typeof schema;
const scope = getScope<RepairWaitSchema>;

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

const defaultPropertiesData: Required<NodeDataProperties<RepairWaitSchema>> = {
  label: 'Repair Crew Confirmation',
  description:
    "Workflow pauses here and waits for an ApproveStep signal — same generic Wait mechanism as Manager Approval.",
  status: statusOptions.active.value,
  note: 'Waits indefinitely until a repair crew confirms the pothole is fixed.',
};

export const repairWaitNode: PaletteItem<RepairWaitSchema> = {
  type: 'repairWait',
  label: 'Repair Crew Confirmation',
  description: 'Pauses execution until this step is approved via /approve-current. Never auto-confirmed.',
  icon: 'Wrench',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      repaired: { type: 'boolean', label: 'Repaired', description: 'Whether the crew confirmed the repair' },
    },
  },
};
