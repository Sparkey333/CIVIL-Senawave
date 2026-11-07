import { useState } from 'react';
import { COMPANY } from '@/data/company';
import { DESIGN_TEAM_IMPLICATIONS, JOB_POSTING } from '@/data/jobPosting';
import { addTeamMember, deleteTeamMember, newTeamMember, restoreEntity, updateTeamMember, useAppData } from '@/store/store';
import { toast } from '@/components/Toast';
import type { TeamMember } from '@/lib/types';
import { Badge, Callout, Card, ConfirmButton, ExtLink, Field, KV, Tabs, VerifiedBadge, useLocalTab } from '@/components/ui';

type Tab = 'people' | 'company' | 'posting';

export default function Team() {
  const [tab, setTab] = useLocalTab<Tab>('team', 'people');
  return (
    <>
      <Tabs<Tab> active={tab} onChange={setTab} tabs={[{ id: 'people', label: 'People' }, { id: 'company', label: 'Senawave — background' }, { id: 'posting', label: 'Job posting (PE / EOR)' }]} />
      {tab === 'people' && <People />}
      {tab === 'company' && <Company />}
      {tab === 'posting' && <Posting />}
    </>
  );
}

function People() {
  const data = useAppData();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(() => newTeamMember());
  return (
    <>
      <Callout kind="info">Everyone on the tracker sees this list. Keep it to work details: role, what they own, how to reach them.</Callout>
      <div className="grid cols-2">
        {data.team.map((m) => <Member key={m.id} m={m} />)}
      </div>
      <Card title="Add a person" actions={<button className="btn sm" onClick={() => setAdding((v) => !v)}>{adding ? 'Close' : '+ Add'}</button>}>
        {adding ? (
          <>
            <MemberForm value={draft} onChange={(p) => setDraft({ ...draft, ...p })} />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" disabled={!draft.name.trim()} onClick={() => { addTeamMember(draft); setDraft(newTeamMember()); setAdding(false); }}>Save</button>
            </div>
          </>
        ) : (
          <p className="muted">PE / Engineer of Record, Senawave construction leads, agency contacts (UDOT Region 1 permits, city engineers), Blue Stakes.</p>
        )}
      </Card>
      <Card title="Other Senawave people (public sources)" subtitle="Not on the team list; for knowing who is who.">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <tbody>{COMPANY.otherPeople.map((p) => <tr key={p.name}><td className="nowrap"><strong>{p.name}</strong></td><td>{p.role}</td><td><ExtLink href={p.source}>source ↗</ExtLink></td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Member({ m }: { m: TeamMember }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m);
  if (editing)
    return (
      <Card title={`Edit — ${m.name}`}>
        <MemberForm value={draft} onChange={(p) => setDraft({ ...draft, ...p })} />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary sm" onClick={() => { updateTeamMember(m.id, draft); setEditing(false); }}>Save</button>
          <button className="btn sm ghost" onClick={() => { setDraft(m); setEditing(false); }}>Cancel</button>
          <span className="spacer" />
          <ConfirmButton label="Remove" onConfirm={() => { deleteTeamMember(m.id); toast(`Removed ${m.name || 'person'}.`, 'ok', { label: 'Undo', onClick: () => restoreEntity('team', m.id) }); }} />
        </div>
      </Card>
    );
  return (
    <Card
      title={m.name}
      subtitle={m.role}
      actions={
        <button className="btn sm ghost" onClick={() => setEditing(true)}>Edit</button>
      }
    >
      <KV
        rows={[
          ['Organisation', m.org],
          ['Email', m.email ? <a href={`mailto:${m.email}`}>{m.email}</a> : <span className="faint">not known — ask</span>],
          ['Phone', m.phone || <span className="faint">not known</span>],
          ['Responsibilities', m.responsibilities],
        ]}
      />
      {m.notes && <p style={{ marginTop: 10, fontSize: 13 }} className="muted">{m.notes}</p>}
      {m.links.length > 0 && (
        <div className="row" style={{ marginTop: 8 }}>
          {m.links.map((l) => <ExtLink key={l.url} href={l.url}><Badge kind="info">{l.label} ↗</Badge></ExtLink>)}
        </div>
      )}
    </Card>
  );
}

function MemberForm({ value, onChange }: { value: TeamMember; onChange: (p: Partial<TeamMember>) => void }) {
  return (
    <div className="form-grid">
      <Field label="Name" required><input value={value.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
      <Field label="Role / title" className="span-2"><input value={value.role} onChange={(e) => onChange({ role: e.target.value })} /></Field>
      <Field label="Organisation"><input value={value.org} onChange={(e) => onChange({ org: e.target.value })} /></Field>
      <Field label="Email"><input type="email" value={value.email} onChange={(e) => onChange({ email: e.target.value })} /></Field>
      <Field label="Phone"><input value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} /></Field>
      <Field label="Responsibilities" className="span-all"><textarea value={value.responsibilities} onChange={(e) => onChange({ responsibilities: e.target.value })} /></Field>
      <Field label="Notes" className="span-all"><textarea value={value.notes} onChange={(e) => onChange({ notes: e.target.value })} /></Field>
      <Field label="Links (one per line: Label | https://…)" className="span-all">
        <textarea
          value={value.links.map((l) => `${l.label} | ${l.url}`).join('\n')}
          onChange={(e) =>
            onChange({
              links: e.target.value
                .split('\n')
                .map((line) => line.split('|').map((s) => s.trim()))
                .filter((p) => p.length >= 2 && p[1])
                .map(([label, url]) => ({ label, url })),
            })
          }
        />
      </Field>
    </div>
  );
}

function Company() {
  return (
    <>
      <Card title={COMPANY.name} subtitle={COMPANY.legalName}>
        <p>{COMPANY.tagline}</p>
        <KV
          rows={[
            ['Also known as', COMPANY.aka.join(' · ')],
            ['HQ', COMPANY.hq],
            ['Phone', COMPANY.phone],
            ['Email', <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>],
            ['Web', <><ExtLink href={COMPANY.website}>{COMPANY.website}</ExtLink> · <ExtLink href={COMPANY.linkedin}>LinkedIn</ExtLink></>],
          ]}
        />
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>{COMPANY.sourceNote}</p>
      </Card>
      <Card title="Facts and sources">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Item</th><th>What we found</th><th>Level</th><th>Source</th></tr></thead>
            <tbody>
              {COMPANY.facts.map((f) => (
                <tr key={f.label}>
                  <td className="nowrap"><strong>{f.label}</strong></td>
                  <td>{f.value}</td>
                  <td><VerifiedBadge level={f.level} /></td>
                  <td>{f.source ? <ExtLink href={f.source}>open ↗</ExtLink> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid cols-2">
        <Card title="Where they build" subtitle="Reported coverage — the corridor you will be drawing runs through the northern list.">
          <ul>{COMPANY.serviceArea.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
        <Card title="Franchise / right-of-way agreements" subtitle="These are the agencies whose ROW you will be permitting in. Franchise ≠ permit: each plan set still needs its excavation / encroachment permit.">
          <div className="tbl-wrap">
            <table className="tbl compact">
              <tbody>
                {COMPANY.franchises.map((f) => (
                  <tr key={f.where}>
                    <td className="nowrap"><strong>{f.where}</strong><br /><span className="faint">{f.when}</span></td>
                    <td>{f.what}</td>
                    <td className="nowrap"><VerifiedBadge level={f.level} /><br /><ExtLink href={f.source}>source ↗</ExtLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function Posting() {
  const J = JOB_POSTING;
  return (
    <>
      <Card title={J.title} subtitle={`${J.company} · ${J.location} · ${J.pay} · ${J.type}`} actions={<Badge kind="warn">{J.status}</Badge>}>
        <div className="group-title">About Senawave</div>
        <p>{J.about}</p>
        <div className="group-title">The role</div>
        {J.role.map((p) => <p key={p}>{p}</p>)}
        <div className="grid cols-2">
          <div>
            <div className="group-title">What you'll do</div>
            <ul>{J.duties.map((d) => <li key={d}>{d}</li>)}</ul>
            <div className="group-title">Details</div>
            <ul>{J.details.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div>
            <div className="group-title">Required qualifications</div>
            <ul>{J.required.map((d) => <li key={d}>{d}</li>)}</ul>
            <div className="group-title">Preferred qualifications</div>
            <ul>{J.preferred.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
        </div>
        <div className="group-title">How to apply</div>
        <p>{J.howToApply}</p>
        <p className="faint" style={{ fontSize: 12 }}>{J.sourceNote}</p>
      </Card>
      <Card title="What the posting implies for the design seat" subtitle="The PE is the reviewer and sealer; the in-house / contract designer produces the set they review. These are the handoffs to plan for.">
        <ul>{DESIGN_TEAM_IMPLICATIONS.map((d) => <li key={d}>{d}</li>)}</ul>
      </Card>
    </>
  );
}
