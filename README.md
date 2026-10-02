# CIVIL-Senawave — Senawave Civil Tracker

Internal web tool for the fiber-optic civil design work done for **Senawave** (VAIX, Inc. dba Senawave
Communications, Salt Lake City) in northern Utah: projects and plan sets, prints with their redlines and AI review
notes, the running log of decisions and actions, the Plan Production Guide as searchable reference, and the next
small step on every project. Shared by Brandon (admin) and Jesse.

**Stack:** Vite 7 · React 19 · TypeScript · React Router 7. No backend of its own. Local-first: the browser
always holds a full working copy; it is shared through claude.ai, a Google Drive file, or not at all.

## Three ways to run it

| | Shared on claude.ai (main) | Google Drive file (your own site) | This browser only |
|---|---|---|---|
| Who gets in | Whoever the owner shares the published tracker with in claude.ai's Share menu | The owner plus the people list in Settings | Whoever has the browser |
| Sign-in | claude.ai | Google (needs a one-time Google Cloud OAuth client) | none |
| Where the data lives | The tracker's own store on claude.ai, plus a working copy in each browser | One JSON file in the owner's Drive, plus each browser | This browser |
| Live updates | Yes: usually seconds, at most about 30 s | When someone presses Sync | — |
| Google Drive, Gmail, Calendar | Each person's own claude.ai connectors | The Google sign-in's read-only scopes | — |
| AI analysis of a print | **Analyze with Claude** button | Copy prompt → Claude chat → paste the answer | Same as Google |

`brandonlbarkey@gmail.com` is an **admin in every mode** (`PERMANENT_ADMINS` in `src/lib/roles.ts`): it cannot be
removed or demoted from inside the app, whatever the people list or the owner field says.

## What is in the tool

| Page | What it does |
|---|---|
| **Dashboard** | **Next baby steps**: one ordered list across everything (the next setup step, today's meeting, overdue actions, then per project: open redlines, AI notes to decide, actions due this week, permits, the next plan-production step), each with a link straight to where it is done and whose it is ("yours", "Jesse"). Setup checklist for the mode you are in, projects with progress, due soon, recent notes. |
| **Projects** | One project = one plan set. Tabs: **Overview** (record, next steps on this project, archive file), **Sheet index**, **Workflow** (guide 1.4), **QC checklist** (guide 11), **Prints & reviews**, **Permits**, **Notes**, **Time**. |
| **Prints & reviews** | Each print (PDF, Drive link), the reviewer's marked-up PDF and every redline as one line (sheet, fix or check, status, what was done). The AI analysis lists what changed since the last print and notes the redlines do not cover; each note can be ticked, dismissed or turned into a redline. In claude.ai, **Analyze with Claude** reads the PDFs' text from your Drive and runs the analysis on your claude.ai account; elsewhere, copy the prompt into a Claude chat and paste the answer back. |
| **Daily brief & log** | Morning: setup, today's items, the next baby steps, your calendar (claude.ai), open items, prints and redlines, Drive changes. Evening: what you did today as text to save or email. |
| **Notes & log**, **Time log** | The running log (actions with due dates, decisions, meetings, agency comments) and hours per project. |
| **Files (Drive)** | The shared Design folder (Templates + Projects): project folder by type, changes since the last read, "these files say step X is done". Reads through your Google Drive connector in claude.ai, or the Google sign-in elsewhere; ships with a 1 Oct snapshot. |
| **Senawave inbox** | @senawave.com threads, read-only. File a message as a meeting note, decision or action. |
| **Plan Production Guide**, **Tools** | Rev 5 as tables and calculators; setup checklists and links. |
| **Team & company** | Work details for the people on the project, public company facts that matter for permitting (BEAD award, franchises), the PE posting. Everyone on the tracker sees this page. |
| **Connections** | How this copy is connected; the shared tracker's status (saved, saving, view only); your connectors with Allow and Test buttons; **Back up to my Drive**; **Share with Jesse** (owner); the one-time Google setup for your own site as ticked steps with exact values; offline archives. |
| **Settings** | Account, people and access, your rate, theme and evening hour (private to you), Drive sync (Google mode), archive and update, local backups. |

## Shared on claude.ai

The tracker is published as a claude.ai artifact that declares five runtime capabilities: `db` (the shared store),
`user` (who is viewing and their display name; claude.ai does not give this page email addresses, so the owner is recognised by `isOwner()`), `mcp` (the viewer's Google Drive, Gmail and Google Calendar connectors,
limited to the tools listed in `MCP_MANIFEST` in `src/lib/connectors.ts`), `sample` (the in-app analysis, on the
viewer's own account) and `downloads` (saving backup and archive files).

- **Roles.** The owner and the permanent admins are admins. Anyone claude.ai lets write is an editor; Viewers,
  Commenters, and anyone whose save claude.ai refuses, are viewers (the app goes read-only and says so).
- **What is shared.** Projects, notes, permits, prints, redlines, the team list and the shared settings. Each
  person's **time log, rate, theme and evening hour** live in their own private part of the store
  (`data/users/<id>/…`), which nobody else can read, the owner included. The demo project is never shared.
- **Connectors.** Each person allows their own; nobody sees another person's mail or Drive. The tracker only reads
  with them, except **Back up to my Drive**, which creates a dated JSON file in a "Senawave Tracker" folder in your
  own My Drive (never overwriting).

### Sharing with Jesse

1. Open the tracker in claude.ai and press **Share**.
2. Invite **jessem@senawave.com** as **Editor**. Viewer and Commenter can only read.
3. Leave the **public link off**: claude.ai lets people from outside your organization save changes only while there
   is no public link.
4. Jesse signs in to claude.ai as jessem@senawave.com and opens the link. Connections → *Share with Jesse* has the
   same steps and a message to send him; it shows "1 other person" once he has made a change.

## Run it yourself

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build into dist/
npm test             # vitest: merge, shared-store sync, next steps, roles, prints, archives…
```

Node 20+. Outside claude.ai the app starts on the sign-in page: **Continue offline**, or sign in with Google once a
client id is set. The artifact build uses hash routing and relative paths:
`VITE_HASH_ROUTER=1 VITE_BASE_PATH=./ npx vite build`.

### Google sign-in on your own site (one-time)

Connections → *Google sign-in on your own site* walks through it with links and copy buttons:

1. Create a Google Cloud project.
2. Turn on the Drive API and the Gmail API.
3. Consent screen (Google Auth Platform): External, Testing; scopes `openid email profile`,
   `…/auth/drive.file`, `…/auth/drive.readonly`, `…/auth/gmail.readonly` (add `…/auth/drive` only to open a team file
   someone else owns); test users brandonlbarkey@gmail.com and jessem@senawave.com.
4. OAuth client ID → Web application; Authorized JavaScript origin = the address you open the tracker at. No redirect URI.
5. Paste the client ID in the app (saved on that device), or build with `VITE_GOOGLE_CLIENT_ID` in `.env.local`.
6. Sign in → Settings → **Sync now** creates the data file → Settings → People shares it with Jesse (or copy the
   invite link, which points his device at your file).

Roles in this mode come from the people list in the data file; the Drive file's sharing is what Google enforces
(viewers get view-only access to the file).

### Offline, archive and update

Works in every mode, with no network:

- **Backup file:** Settings → Archive and update → Save backup file (everything, your rate and time log included).
- **Project archive:** a project's Overview → Save archive file. Never includes anyone's rate or the people list.
- **Update:** import a backup or archive. Merge keeps both sides and the newest edit wins per row; Replace (admin, not in
  the shared tracker) swaps everything after backing up.
- **Local backups:** one a day and before every risky step; three kept in the browser.

## Repository layout

```
src/
  app/          routes + layout (sidebar, top bar with the sync / shared-tracker status)
  pages/        Dashboard, Daily, Projects, ProjectDetail, Notes, TimeLog, Files, Inbox, Reference, Team, Tools,
                Connections, Settings, SignIn
  components/   UI primitives, BabySteps, PrintsTab, PeopleCard, CalendarCard, NoteList, TimeTable, SyncButton, Toast
  store/        store.ts (local-first store, CRUD, import/export, migrations) · seed.ts (built-in rows)
  lib/
    claude/runtime.ts   typed access to claude.ai's window.claude capabilities
    cloud.ts            shared-store sync engine (claude.ai mode)
    connectors.ts       Drive / Gmail / Calendar through the viewer's claude.ai connectors
    aiAnalysis.ts       Analyze with Claude
    nextSteps.ts        the next-baby-steps list · guidance.ts (setup checklist, plan-production step)
    roles.ts · auth.tsx · google.ts · drive.ts · sync.ts · merge.ts · archive.ts · prints.ts · …
  data/         guide.ts (Plan Production Guide Rev 5) · fluencePrints.ts · fluenceDrive.ts · company.ts · revision.ts
docs/           architecture.md · plan-production-guide.md · research-senawave.md · source/
```

## Keeping it current

- Built-in rows (Fluence, the team, the welcome note) carry `SEED_REVISION` (`src/data/revision.ts`). Bump it when you
  change them: on load, rows nobody has edited take the new version once; anything a person changed is left alone.
- New guide revision: update `src/data/guide.ts` and `docs/`.
- Data model changes: bump `DATA_VERSION` in `src/lib/types.ts` and extend `migrate()` in `store.ts`.

## Privacy

The tracker talks only to claude.ai (in the shared mode) or Google (when you sign in), and only when you use them. No
analytics. Everyone a tracker is shared with receives the same page, built-in data included, so keep the seed to work
details. Licence keys and passwords do not belong in notes.
