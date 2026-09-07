import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    disclaimer: { type: 'string' },
  },
} satisfies NodeSchema;

export type Call102Schema = typeof schema;
const scope = getScope<Call102Schema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'POC Safety Notice',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.disclaimer'),
          label: 'Disclaimer',
          minRows: 3,
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<Call102Schema>> = {
  label: 'Call 102 (Mocked)',
  description: 'Simulated fire department dispatch call.',
  status: statusOptions.active.value,
  disclaimer: 'MOCK ONLY. This node never contacts a real emergency service. It logs a simulated call for demo purposes.',
};

export const call102Node: PaletteItem<Call102Schema> = {
  type: 'call102',
  label: 'Call 102 (Mocked)',
  description: 'MOCK ONLY — simulates dispatching the fire department. Never calls a real emergency number.',
  icon: 'Siren',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      success: { type: 'boolean', label: 'Success', description: 'Whether the mock call succeeded' },
      message: { type: 'string', label: 'Message', description: 'Simulated dispatcher acknowledgement' },
    },
  },
};
