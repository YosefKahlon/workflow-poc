import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    street: { type: 'string' },
  },
} satisfies NodeSchema;

export type PotholeReportSchema = typeof schema;
const scope = getScope<PotholeReportSchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Mock Report Payload',
      elements: [
        {
          type: 'Text',
          scope: scope('properties.street'),
          label: 'Street',
          placeholder: 'e.g. Main St',
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<PotholeReportSchema>> = {
  label: 'Pothole Reported',
  description: "Entry point: a resident reports a pothole. Mirrors PotholeWorkflow.RunAsync's street parameter.",
  status: statusOptions.active.value,
  street: 'Main St',
};

export const potholeReportNode: PaletteItem<PotholeReportSchema> = {
  type: 'potholeReport',
  label: 'Pothole Reported',
  description: 'Entry point matching PotholeWorkflow — a resident reports a pothole.',
  icon: 'Warning',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      street: { type: 'string', label: 'Street', description: 'Reported street' },
    },
  },
};
