import { StatusPoller } from '../../../platform/StatusPoller';
import { useFireRunStore } from './fire-run-store';

export function FireStatusPoller() {
  return <StatusPoller useRunStore={useFireRunStore} />;
}
