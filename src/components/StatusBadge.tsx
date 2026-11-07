import { PROJECT_STATUSES, type ProjectStatus } from '@/lib/types';
import { Badge } from './ui';

const KIND: Record<ProjectStatus, '' | 'ok' | 'warn' | 'bad' | 'info' | 'accent'> = {
  intake: '',
  gis: 'info',
  cad: 'accent',
  qc: 'warn',
  review: 'warn',
  permitting: 'info',
  sealed: 'ok',
  construction: 'ok',
  closed: '',
  'on-hold': 'bad',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = PROJECT_STATUSES.find((x) => x.id === status);
  return (
    <Badge kind={KIND[status]} title={s?.hint}>
      {s?.label || status}
    </Badge>
  );
}
