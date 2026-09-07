import { generalInformation, getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';
import type { NodeDataProperties, NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    closureNote: { type: 'string' },
  },
} satisfies NodeSchema;

export type CloseTicketSchema = typeof schema;
const scope = getScope<CloseTicketSchema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    generalInformation,
    {
      type: 'Accordion',
      label: 'Closure',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.closureNote'),
          label: 'Closure Note',
          minRows: 3,
        },
      ],
    },
  ],
};

const defaultPropertiesData: Required<NodeDataProperties<CloseTicketSchema>> = {
  label: 'Close Ticket',
  description: "Final step — dispatched via PotholeActivities.ExecuteStepAsync(\"closeTicket\", ...).",
  status: statusOptions.active.value,
  closureNote: 'Repair crew closed the ticket after confirming the fix.',
};

export const closeTicketNode: PaletteItem<CloseTicketSchema> = {
  type: 'closeTicket',
  label: 'Close Ticket',
  description: 'Logs the repair as complete.',
  icon: 'CheckCircle',
  defaultPropertiesData,
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      message: { type: 'string', label: 'Message', description: 'Closure message' },
    },
  },
};
