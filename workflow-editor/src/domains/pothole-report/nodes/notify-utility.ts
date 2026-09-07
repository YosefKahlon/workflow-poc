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

export type NotifyUtilitySchema = typeof schema;
const scope = getScope<NotifyUtilitySchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Retry Demo',
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

const defaultPropertiesData: Required<NodeDataProperties<NotifyUtilitySchema>> = {
  label: 'Notify Utility Company',
  description:
    'Retry-policy demo — dispatched via PotholeActivities.ExecuteStepAsync("notifyUtility", ...). Deliberately fails the first two attempts and succeeds on the third; Temporal retries it automatically per the RetryPolicy on this activity call.',
  status: statusOptions.active.value,
  note: 'Simulated call to the utility company\'s API — fails twice, then succeeds (Temporal retry demo).',
};

export const notifyUtilityNode: PaletteItem<NotifyUtilitySchema> = {
  type: 'notifyUtility',
  label: 'Notify Utility Company',
  description: 'Deliberately flaky step — fails twice, succeeds on the 3rd attempt, to demonstrate Temporal retries.',
  icon: 'ArrowsClockwise',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      message: { type: 'string', label: 'Message', description: 'Confirmation message once it eventually succeeds' },
    },
  },
};
