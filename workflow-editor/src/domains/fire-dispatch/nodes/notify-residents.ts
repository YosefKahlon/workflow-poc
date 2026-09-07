import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    messageTemplate: { type: 'string' },
  },
} satisfies NodeSchema;

export type NotifyResidentsSchema = typeof schema;
const scope = getScope<NotifyResidentsSchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Copilot Draft (Mocked Send)',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.messageTemplate'),
          label: 'Fallback Message Template',
          minRows: 3,
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<NotifyResidentsSchema>> = {
  label: 'Notify Residents',
  description: 'Drafts a short resident notification (Copilot-style, optionally via Claude API). Sending is mocked.',
  status: statusOptions.active.value,
  messageTemplate: 'Fire reported near {{location}}. Emergency services have been dispatched. Please avoid the area.',
};

export const notifyResidentsNode: PaletteItem<NotifyResidentsSchema> = {
  type: 'notifyResidents',
  label: 'Notify Residents',
  description: 'Drafts a resident notification message and simulates sending it.',
  icon: 'Megaphone',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      sent: { type: 'boolean', label: 'Sent', description: 'Whether the mock send succeeded' },
      messageText: { type: 'string', label: 'Message Text', description: 'The drafted notification text' },
      source: { type: 'string', label: 'Source', description: '"template" or "claude-api"' },
    },
  },
};
