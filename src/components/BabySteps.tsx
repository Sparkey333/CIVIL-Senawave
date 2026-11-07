import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STEP_TAG_LABEL, whoLabel, type BabyStep, type StepTag } from '@/lib/nextSteps';
import { useAuth } from '@/lib/auth';
import { Badge } from './ui';

const TAG_KIND: Record<StepTag, '' | 'ok' | 'warn' | 'bad' | 'info' | 'accent'> = {
  setup: 'accent',
  overdue: 'bad',
  today: 'warn',
  redlines: 'warn',
  decide: 'bad',
  review: 'info',
  print: 'info',
  action: '',
  permit: 'info',
  analysis: '',
  production: 'ok',
};

/** A numbered list of next steps: one action per line, with a link, who does it and why now. */
export function BabySteps({ steps, limit = 6, showProject = true, projectNames = {} }: { steps: BabyStep[]; limit?: number; showProject?: boolean; projectNames?: Record<string, string> }) {
  const { user } = useAuth();
  const [all, setAll] = useState(false);
  if (steps.length === 0) return <p className="muted" style={{ margin: 0 }}>Nothing waiting. Log the next print, or add an action with a due date.</p>;
  const shown = all ? steps : steps.slice(0, limit);
  return (
    <>
      <ol className="baby-steps">
        {shown.map((s, i) => {
          const who = whoLabel(s.who, user?.name);
          return (
            <li key={s.id} className={i === 0 ? 'first' : ''}>
              <span className="baby-n" aria-hidden>{i + 1}</span>
              <div className="baby-body">
                <div className="row" style={{ gap: 6, alignItems: 'baseline' }}>
                  <Badge kind={TAG_KIND[s.tag]}>{STEP_TAG_LABEL[s.tag]}</Badge>
                  <Link to={s.to} className="baby-title">{s.title}</Link>
                </div>
                <div className="baby-detail">
                  {showProject && s.projectId && projectNames[s.projectId] && <span className="mono faint">{projectNames[s.projectId]} · </span>}
                  {s.detail}
                  {who && <span className={`baby-who ${who === 'you' ? 'me' : ''}`}>{who === 'you' ? 'yours' : who}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {steps.length > limit && (
        <button className="btn sm ghost" onClick={() => setAll((v) => !v)} style={{ marginTop: 6 }}>
          {all ? 'Show fewer' : `Show all ${steps.length}`}
        </button>
      )}
    </>
  );
}
