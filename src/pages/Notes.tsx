import { NoteComposer, NoteList } from '@/components/NoteList';
import { Card } from '@/components/ui';

export default function Notes() {
  return (
    <>
      <Card title="New note" subtitle="Running log for the work: redlines from the PE, agency comments, decisions, meetings, lessons learned. Tie a note to a project and a sheet when it belongs to one.">
        <NoteComposer />
      </Card>
      <NoteList showProject />
    </>
  );
}
