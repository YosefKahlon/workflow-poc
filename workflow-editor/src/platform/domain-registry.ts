import { fireDispatchDomain } from '../domains/fire-dispatch/domain';
import { potholeReportDomain } from '../domains/pothole-report/domain';
import type { WorkflowDomain } from './workflow-domain';

// The one place that knows every domain exists. Onboarding a new workflow
// domain is: create domains/<name>/ with its nodes, plugins, and a domain.ts
// exporting a WorkflowDomain — then add one import + array entry here.
// Nothing else in platform/ ever needs to change.
export const ALL_DOMAINS: WorkflowDomain[] = [fireDispatchDomain, potholeReportDomain];
