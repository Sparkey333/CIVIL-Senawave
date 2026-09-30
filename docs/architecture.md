# Architecture

## Goals

- Usable today by one person with nothing but a browser: no server, no database, no accounts to create.
- Tied to a Google account so it follows the CAD/Templates Drive the work already lives in.
- Shareable with two more people (David, Jesse) without a rewrite.
- The Plan Production Guide and the company background as *data*, not prose, so the app can link a
  workflow step to its commands, a layer to its colour, a QC item to a project.

## Data model (`src/lib/types.ts`)

```
AppData
├─ projects[]   Project { number, name, status, funding, crs, routeLengthFt, pm, engineer, designer,
│               designDate, fieldDate, dueDate, driveFolderUrl, arcgisProjectUrl, drawingPath,
│               workflow{stepId: bool}, qc{itemId: bool}, sheets[] Sheet, sample? }
│   └─ Sheet   { pageNumber, angle, cellFt, clipX0, clipX1, matchL/R/T/B, aligned, clipped, sidePanel,
│               titleblock, qcDone, notes }            ← mirrors SENAWAVE-SheetIndex.py fields + 6.2 steps
├─ notes[]      Note { projectId?, sheetNo?, type, title, body, tags[], done, dueOn, author }
├─ permits[]    Permit { projectId, agency, agencyName, type, status, permitNo, submittedOn, dueOn, notes }
├─ timeEntries[] TimeEntry { projectId?, date, hours, description, billable, invoiced }
├─ team[]       TeamMember { name, role, org, email, phone, responsibilities, notes, links[], verified }
├─ settings     Settings { ownerName, ownerEmail, allowedEmails[], hourlyRate, driveFileId,
│                          driveFolderName, driveScope, autoSync, theme, quickLinks[] }
├─ scratch{}    free-text / checkbox state keyed by name (gusto, agencies, setup:bc-*, …)
└─ version, updatedAt
```

Every record carries `id` and `updatedAt`; that is what the merge relies on.

## Store (`src/store/store.ts`)

A tiny external store (`useSyncExternalStore`) holding one `AppData` object, persisted to
`localStorage` on every change. All mutations go through named functions (`addProject`, `updateNote`, …)
that stamp `updatedAt`. `migrate()` fills new fields from the seed so old saved data keeps working after
an upgrade; bump `DATA_VERSION` when the shape changes.

## Auth (`src/lib/auth.tsx`, `src/lib/google.ts`)

Google Identity Services token client, loaded on demand from `accounts.google.com/gsi/client`. One
token covers identity (`openid email profile`) and Drive (`drive.file` or `drive`). Profile comes from
the userinfo endpoint. Access is gated client-side by the owner email + allowed list in settings — this
is a convenience gate for an internal tool, not a security boundary (the data is in each user's own
Drive/browser anyway). Without a client id the app runs in offline mode with a local user.

## Sync (`src/lib/drive.ts`, `src/lib/sync.ts`, `src/lib/merge.ts`)

- One file `senawave-tracker.json` in a folder in My Drive (auto-created), or an explicit file id.
- `syncWithDrive`: read remote → `mergeData(local, remote)` → write merged back. Merge is per record,
  newest `updatedAt` wins; settings follow the newer `AppData.updatedAt`; scratch keys merge individually.
- Auto-sync (optional) pushes 20 s after the last edit. Conflicts inside one record are last-writer-wins.
- `drive.file` scope only sees files this app created — enough for one person on several devices.
  A team file shared by Drive needs the `drive` scope on the other users' side (the app cannot see a
  shared file under `drive.file` unless it was picked through the Google Picker, which is not wired in).

## Reference data (`src/data/`)

- `guide.ts` — the Plan Production Guide Rev 5 transcribed into typed arrays (numbers, workflow steps
  with ids, QC items with ids, commands, layers, symbols, migration map, troubleshooting, text heights,
  sysvars, script options and fields) plus the arithmetic helpers (`sheetsForRun`, `evenCellFt`,
  `clipExtents`, `modelTextHeightFt`). Workflow and QC ids are what projects store, so keep ids stable.
- `company.ts` — verified facts with source URLs and a verification level; `OTHER_ENTITIES` for names in
  the working folder that are not Senawave.
- `jobPosting.ts` — the Indeed posting and its implications for the design seat.

## Roadmap (when the JSON file is not enough)

1. **Firestore** (or Supabase): replace `store.ts` persistence + `sync.ts` with a collection per record
   type; keep the same `AppData` shapes; Google sign-in stays the same identity. Real-time updates, real
   access rules by email.
2. **Attachments**: link PDFs / redline markups per note using Drive file ids (already have the token).
3. **Sheet index import**: paste or upload the ArcGIS `SheetIndex` table export (CSV) to fill the sheet
   tracker instead of typing it.
4. **Google Picker** for choosing the shared team file under `drive.file`.
5. **PWA / offline**: service worker for the static shell so it opens with no network in the field.
