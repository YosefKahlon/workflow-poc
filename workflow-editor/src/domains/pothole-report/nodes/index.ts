import type { PaletteItemOrGroup } from '@workflowbuilder/sdk';

import { approvalNode } from './approval';
import { assessSeverityNode } from './assess-severity';
import { closeTicketNode } from './close-ticket';
import { notifyUtilityNode } from './notify-utility';
import { potholeReportNode } from './pothole-report';
import { repairWaitNode } from './repair-wait';

export const potholePaletteItems: PaletteItemOrGroup[] = [
  potholeReportNode,
  assessSeverityNode,
  notifyUtilityNode,
  approvalNode,
  repairWaitNode,
  closeTicketNode,
];
