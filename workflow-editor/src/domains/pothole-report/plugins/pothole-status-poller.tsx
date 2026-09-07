import { StatusPoller } from '../../../platform/StatusPoller';
import { usePotholeRunStore } from './pothole-run-store';

export function PotholeStatusPoller() {
  return <StatusPoller useRunStore={usePotholeRunStore} />;
}
