import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    rulesSummary: { type: 'string' },
  },
} satisfies NodeSchema;

export type BreCheckSchema = typeof schema;
const scope = getScope<BreCheckSchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Business Rule Engine',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.rulesSummary'),
          label: 'Hardcoded Rules (POC)',
          minRows: 4,
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<BreCheckSchema>> = {
  label: 'BRE: Severity Check',
  description: 'Deterministic rule check — decides severity/urgency from confidence, time of day, and zone.',
  status: statusOptions.active.value,
  rulesSummary:
    'confidence >= 0.85 -> Critical\nconfidence >= 0.6 -> High\nnight hours (22:00-06:00) escalate one level\nresidential/industrial zone escalates one level',
};

export const breCheckNode: PaletteItem<BreCheckSchema> = {
  type: 'breCheck',
  label: 'BRE: Severity Check',
  description: 'Business Rule Engine guardrail — evaluates severity before any dispatch action is allowed.',
  icon: 'ArrowsSplit',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      severity: { type: 'string', label: 'Severity', description: 'Low, Medium, High, or Critical' },
      reasoning: { type: 'string', label: 'Reasoning', description: 'Human-readable rule evaluation, for audit' },
    },
  },
};
