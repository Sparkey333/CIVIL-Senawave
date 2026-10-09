import { Link } from 'react-router-dom';
import type { Project } from '@/lib/types';
import { nextStepFor } from '@/lib/guidance';
import { updateProject } from '@/store/store';
import { toast } from './Toast';

/** One concrete next action for a project, with the guide section and a "done" shortcut when it is a workflow tick. */
export function NextStep({ project, compact = false }: { project: Project; compact?: boolean }) {
  const step = nextStepFor(project);
  const markDone = () => {
    if (!step.stepId) return;
    updateProject(project.id, (p) => ({ workflow: { ...p.workflow, [step.stepId!]: true } }));
    toast(`Ticked: ${step.title.slice(0, 60)}`);
  };
  return (
    <div className={`next-step ${compact ? 'compact' : ''}`}>
      <div className="next-step-label">Next step</div>
      <div className="next-step-title">{step.title}</div>
      {!compact && <div className="muted" style={{ fontSize: 12.5 }}>{step.detail}</div>}
      <div className="row" style={{ marginTop: 6, gap: 6 }}>
        <Link className="btn sm primary" to={step.to}>Open</Link>
        {step.guideTo && <Link className="btn sm" to={step.guideTo}>Guide</Link>}
        {step.commands?.map((c) => (
          <Link key={c} to={`/reference/commands?q=${c}`} className="tag">{c}</Link>
        ))}
        {step.stepId && <button className="btn sm ghost" onClick={markDone}>Mark done</button>}
      </div>
    </div>
  );
}
