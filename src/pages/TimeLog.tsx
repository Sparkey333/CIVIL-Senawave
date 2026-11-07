import { TimeTable } from '@/components/TimeTable';
import { Card } from '@/components/ui';

export default function TimeLog() {
  return (
    <Card title="Time log" subtitle="Your own record of hours per project. Export a month as CSV for your Gusto contractor invoice, then mark it invoiced.">
      <TimeTable />
    </Card>
  );
}
