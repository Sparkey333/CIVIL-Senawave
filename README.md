# CIVIL-Senawave — Senawave Civil Tracker

Internal web tool for the fiber-optic civil design work I do for **Senawave** (VAIX, Inc. dba Senawave
Communications, Salt Lake City) in northern Utah: project and plan-set tracking, notes and redlines, the
Plan Production Guide as searchable reference, and the verified background on the company and the people
I work with. It is a prototype meant for me first, and to be shared with David and Jesse later.

**Stack:** Vite 7 · React 19 · TypeScript · React Router 7. No backend. Data is local-first
(browser storage) with optional Google sign-in and a Google Drive JSON sync file. No UI framework, no
tracking, one 450 KB bundle.

## What is in the tool

| Page | What it does |
|---|---|
| **Dashboard** | Active projects with workflow / QC progress, due-soon list (plan sets, permits, actions), recent notes, pipeline strip. |
| **Projects** | One project = one drawing = one plan set. Titleblock fields (the ones SENATITLE writes), CRS, route length, funding (BEAD…), Drive/ArcGIS links. Tabs: **Sheet index** tracker (PageNumber, Angle, CellFt, ClipX0/X1, MatchL/R/T/B, per-sheet align → clip → side panel → titleblock → QC, with index checks that mirror guide 4.6/6.4), **Workflow** (guide 1.4, tickable), **QC checklist** (guide 11), **Permits** (municipal / county / UDOT / railroad / Blue Stakes rounds), **Notes**, **Time**. |
| **Notes & log** | Running log: notes, action items, PE redlines, agency comments, meetings, decisions, issues. Tags, due dates, tied to a project and a sheet. |
| **Time log** | Hours per project, billable / invoiced flags, CSV export for the Gusto contractor invoice. |
| **Plan Production Guide** | Rev 5 as tables: the numbers, whole-job checklist, ArcGIS scripts and options, BricsCAD import, per-sheet recipe, side panel / vicinity / basemaps, titleblocks, QC, troubleshooting, all 34 SENA commands, layer standard with colour swatches, symbol library (with the symbol sheet image), old-layer migration map, maintenance rules, and a calculator (sheets per run, clip rectangle, text heights, symbol scale). |
| **Team & company** | People cards with verified / partly verified / unverified badges and sources (David Bradshaw verified; Jesse Montgomery not found publicly — to confirm), Senawave facts with sources, BEAD award, franchise agreements by city, service area, and the original Indeed PE / Engineer-of-Record posting with what it implies for the design seat. |
| **Tools & integrations** | Quick links (Drive, Gusto, BricsCAD, ArcGIS, UDOT, Blue Stakes, UBC, DOPL), Google Drive layout, Gusto invoicing notes, BricsCAD and ArcGIS Pro setup checklists from the guide, agencies and permit types. |
| **Daily brief & log** | Morning: setup checklist, today's meetings and due items, one next step per project (from the guide order), open actions, Drive changes in the last 24 h. Evening: everything you ticked, added and logged today, hours, next steps and open items as text to save as a note or paste into an email. |
| **Files (Drive)** | The shared Senawave *Design* folder (Templates + Projects, owned by Jesse) read-only: project folder grouped into drawing / xrefs / imagery / GIS / docs / scripts, changes since your last check, and "these files say step X is done" suggestions for the workflow. Ships with a snapshot taken 1 Oct 2026 so it works before Google sign-in. |
| **Prints & reviews** | A tab on every project. Log each print (PDF name, Drive link), the reviewer's marked-up PDF, and every redline as one line (sheet, fix or check, status, what was done). Each print also holds an AI analysis: what changed since the last print and notes with recommendations, each one tick-able or turnable into a redline. Fluence ships with its first two prints, the 13 redlines from the 2 Oct review and an analysis. The app does not call an AI itself: "Copy prompt" builds the request and "Paste an analysis" reads the JSON answer back. |
| **Senawave inbox** | Read-only Gmail limited to @senawave.com threads. File any message as a meeting note, decision or action; likely tasks are pulled out of the text as one-click actions. |
| **Settings** | Google sign-in, connections (read-only Drive for the Design folder, read-only Gmail), Google client id (paste it in, no rebuild), **People and access** (admin / editor / viewer, share the Drive file with Jesse from the list, copy an invite), hourly rate, theme, Drive sync (folder, scope, shared file id, auto-sync, whether the time log goes in the file), **Archive and update** (backup file, import merge or replace, per-project archive, local backups with restore), delete sample data, reset. Rate, theme and this device's sync settings never leave the browser. |

The sample project (`26-0001 SAMPLE — Brigham City north corridor`) is seeded so nothing is empty on first
open. Delete it from Settings once real work is in.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build into dist/
npm run preview      # serve dist/ on :4173
npm test             # vitest (merge logic, sheet-index checks, guide arithmetic)
```

Node 20+ required. With no Google client id configured the app runs in **offline mode**: click *Continue
offline* on the sign-in screen and everything is stored in that browser's localStorage. Export JSON from
Settings before clearing browser data.

## Google sign-in and Drive sync (one-time setup)

The tool uses Google Identity Services (OAuth 2.0 token flow) straight from the browser; there is no server
and no secret. The Drive sync keeps one file, `senawave-tracker.json`, in a folder in the signed-in
account's My Drive and merges record-by-record (newest wins) on every sync.

1. Google Cloud Console → create a project (e.g. "Senawave Tracker").
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → External → fill the app name and your email → add scopes
   `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file` (add
   `…/auth/drive` only if you will use a shared team file, see below; `…/auth/drive.readonly` for the Files page;
   `…/auth/gmail.readonly` for the Senawave inbox) → **Test users**: add your Gmail, and
   later David's and Jesse's. Leave the app in *Testing*; with test users nothing needs Google verification.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
   Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:4173`, and the URL you host at
   (for GitHub Pages: `https://<user>.github.io`). No redirect URI is needed for the token flow.
5. Give the client id to the app. Easiest: open the app, and on the sign-in page (or Settings → Account) paste it
   into **Google client id**. It is saved on that device, no rebuild. Or bake it into a build with
   `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
   ```
   then `npm run dev` / `npm run build` (a build-time id wins over a pasted one).
6. Sign in → Settings → **Sync now**. The folder *Senawave Tracker* and the JSON file are created in your
   Drive. Turn on auto-sync if you want edits pushed 20 s after you stop typing.

### Online and offline

| | Offline | Online (Google) |
|---|---|---|
| Who | Whoever has the browser. They are the admin of what is stored on that device. | The owner (admin) and the people on the list in Settings → People and access. |
| Where the data lives | This browser only. | This browser plus one data file in the owner's Google Drive. |
| Archive and update | Save a backup file, import a file (merge or replace), save one project as an archive file, three rolling local backups. | All of the offline tools, plus Sync (pull, merge, push). |

You can switch between them at any time. Offline mode never needs a client id, an account or a network.

### Roles

The owner (the Google account in Settings → Owner) is always an **admin**. Everyone else is added under
**Settings → People and access** with one of three roles:

- **Admin:** everything, including the people list, resetting data and replace-imports. Gets edit access to the Drive file.
- **Editor:** adds and changes projects, prints, redlines, notes and time. Gets edit access to the Drive file.
- **Viewer:** read only. The app refuses every edit on their device and their Sync button only pulls. They get view-only
  access to the Drive file, which **Google** enforces, so they cannot change it even from another tool.

The roles are enforced in the app; the Drive file's own sharing is the real lock. Anyone with edit access to the file can
change the people list inside it, so give edit access only to people you trust.

### Sharing with Jesse (or anyone)

1. Sign in with Google (owner account) and press **Sync now** once. That creates the data file in your Drive.
2. Settings → **People and access**. Jesse (jessem@senawave.com) is already listed as an editor. Press **Share Drive
   file** on his row (or add anyone else with **Add person**, which can share the file in the same step and have Google
   email the invite).
3. Add Jesse's email as a **test user** on the OAuth consent screen (step 3 above) while the app is in Testing.
4. Press **Copy invite message** and send it to him. It holds a link with `?join=<file id>`: when he opens it and signs in
   with Google, his device points at your data file with the full Drive scope (needed to open a file someone else owns),
   and he presses Sync. His email must be on the list or the sign-in is refused.

Edits merge per record, newest wins; two people editing the same field within one sync window is last-writer-wins.
Before sharing, set *Time log in the Drive file* to **Kept private** if you do not want your hours in the shared file; your
hourly rate never goes into the file either way. Deletes sync as hidden markers, so a project removed on one side
disappears on the other instead of coming back.

### Offline sharing, archive and update

No Google needed to hand work to someone or to keep a copy:

- **Project archive:** open a project's Overview → **Save archive file** (or **Copy archive**). The file holds the project
  and its notes, permits, prints and redlines; your time entries only if you tick *with my time*; never your rate,
  settings or the people list.
- **Update:** Settings → Archive and update → choose a file. A project archive or a full backup is **merged**: both
  sides are kept, the newest edit on each row wins, and a message says how many rows were added and updated. *Replace*
  (admin only) swaps everything and backs the old data up first.
- **Local backups:** one a day and before every import-replace, archive import, reset or restore; the three newest are
  kept in the browser and can be restored from Settings.

When this outgrows a JSON file (more than three people, or you want live updates), the storage layer is
isolated in `src/store/store.ts` + `src/lib/sync.ts`; swapping in Firestore or a small API is the intended
next step — see `docs/architecture.md`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main` when
Pages is enabled for the repo (Settings → Pages → Source: GitHub Actions). Set the repository variable
`VITE_BASE_PATH` to `/CIVIL-Senawave/` (the repo name) and the secret / variable `VITE_GOOGLE_CLIENT_ID`
for sign-in; add the Pages origin to the OAuth client. The app uses history routing, so the workflow copies
`index.html` to `404.html` so deep links work on Pages. Any static host works the same way.

## Repository layout

```
src/
  app/          App routes + Layout (sidebar, top bar, sync button)
  pages/        Dashboard, Projects, ProjectDetail, Notes, TimeLog, Reference, Team, Tools, Settings, SignIn
  components/   UI primitives, ProjectForm, NoteList, TimeTable, StatusBadge, SyncButton, Toast
  store/        store.ts (local-first store, CRUD, import/export) · seed.ts (defaults + sample project)
  lib/          types.ts (data model) · auth.tsx · google.ts · drive.ts · sync.ts · merge.ts · sheets.ts · ids.ts
  data/         guide.ts (Plan Production Guide Rev 5 as data) · company.ts (verified research) · jobPosting.ts
docs/
  research-senawave.md         background check with sources and verification levels
  plan-production-guide.md     Markdown transcription of the guide
  architecture.md              data model, sync design, roadmap
  source/                      the original .docx
public/symbol-library.png      the symbol sheet from the guide
```

## Keeping it current

- New guide revision: update `GUIDE_META` and the tables in `src/data/guide.ts`, replace the .docx under
  `docs/source/`, regenerate `docs/plan-production-guide.md`.
- Learned something about the team or company: edit the card in the Team page (stored in your data) or
  the seed in `src/data/company.ts` / `src/store/seed.ts` for everyone.
- Data model changes: bump `DATA_VERSION` in `src/lib/types.ts` and extend `migrate()` in `store.ts`.

## Privacy

Everything stays in your browser and, if you enable it, your own Google Drive. The only external calls are
to Google (sign-in, Drive) when you use them. No analytics. Licence keys and passwords do not belong in the
notes fields.
