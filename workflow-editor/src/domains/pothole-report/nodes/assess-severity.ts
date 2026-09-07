import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    rule: { type: 'string' },
  },
} satisfies NodeSchema;

export type AssessSeveritySchema = typeof schema;
const scope = getScope<AssessSeveritySchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Severity Rule',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.rule'),
          label: 'Hardcoded Rule (POC)',
          minRows: 3,
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<AssessSeveritySchema>> = {
  label: 'Assess Severity',
  description: "Deterministic check — dispatched via PotholeActivities.ExecuteStepAsync(\"assessSeverity\", ...).",
  status: statusOptions.active.value,
  rule: 'street.Length > 10 -> Major, else Minor',
};

export const assessSeverityNode: PaletteItem<AssessSeveritySchema> = {
  type: 'assessSeverity',
  label: 'Assess Severity',
  description: 'Automated severity check before the repair crew is looped in.',
  icon: 'Gauge',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      severity: { type: 'string', label: 'Severity', description: 'Minor or Major' },
    },
  },
};
