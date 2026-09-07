import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    location: { type: 'string' },
    confidence: { type: 'number' },
  },
} satisfies NodeSchema;

export type FireTriggerSchema = typeof schema;
const scope = getScope<FireTriggerSchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Mock Sensor Payload',
      elements: [
        {
          type: 'Text',
          scope: scope('properties.location'),
          label: 'Location / Zone',
          placeholder: 'e.g. Caesarea Marina, Pier 3',
        },
        {
          type: 'Text',
          scope: scope('properties.confidence'),
          label: 'Confidence Score (0-1)',
          placeholder: '0.92',
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<FireTriggerSchema>> = {
  label: 'Fire Detected',
  description: 'Mock fire-detection sensor event. POC only — not a real IoT feed.',
  status: statusOptions.active.value,
  location: 'Caesarea Marina, Pier 3',
  confidence: 0.92,
};

export const fireTriggerNode: PaletteItem<FireTriggerSchema> = {
  type: 'fireTrigger',
  label: 'Fire Detected',
  description: 'Entry point: a mock sensor reports a possible fire.',
  icon: 'Fire',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      location: { type: 'string', label: 'Location', description: 'Zone where the event was reported' },
      confidence: { type: 'number', label: 'Confidence Score', description: 'Sensor confidence, 0-1' },
    },
  },
};
