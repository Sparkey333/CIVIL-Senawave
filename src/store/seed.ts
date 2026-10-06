import type { AppData, Note, Permit, Project, Settings, Sheet, TeamMember, TimeEntry } from '@/lib/types';
import { DATA_VERSION } from '@/lib/types';
import { COMPANY } from '@/data/company';
import { DESIGN_FOLDER_URL, FLUENCE_FOLDER_URL } from '@/data/fluenceDrive';
import { fluencePrints, fluenceRedlines } from '@/data/fluencePrints';
import { WORKFLOW_STEPS } from '@/data/guide';
import { SEED_REVISION } from '@/data/revision';

export { SEED_REVISION };

const T0 = '2026-09-29T12:00:00.000Z';

export const DEFAULT_QUICK_LINKS: Settings['quickLinks'] = [
  { label: 'Google Drive — CAD/Templates', url: 'https://drive.google.com/' },
  { label: 'Gusto (contractor pay / invoices)', url: 'https://app.gusto.com/' },
  { label: 'BricsCAD (Bricsys account & downloads)', url: 'https://www.bricsys.com/' },
  { label: 'ArcGIS Online / Pro', url: 'https://www.arcgis.com/' },
  { label: 'UDOT Encroachment permits', url: 'https://www.udot.utah.gov/connect/business/permits/' },
  { label: 'Blue Stakes of Utah (811)', url: 'https://www.bluestakes.org/' },
  { label: 'Utah Broadband Center (BEAD)', url: 'https://connecting.utah.gov/' },
  { label: 'Utah DOPL license lookup (PE)', url: 'https://secure.utah.gov/llv/search/index.html' },
  { label: 'Senawave website', url: COMPANY.website },
  { label: 'Senawave Design folder (shared by Jesse)', url: DESIGN_FOLDER_URL },
  { label: 'Fluence project folder', url: FLUENCE_FOLDER_URL },
];

export function defaultSettings(): Settings {
  return {
    ownerName: 'Brandon Barkey',
    ownerEmail: 'brandonlbarkey@gmail.com',
    members: [{ email: 'jessem@senawave.com', name: 'Jesse Montgomery', role: 'editor', addedAt: T0 }],
    hourlyRate: null,
    driveFileId: '',
    driveFolderName: 'Senawave Tracker',
    driveScope: 'drive.file',
    autoSync: false,
    theme: 'system',
    quickLinks: DEFAULT_QUICK_LINKS,
    syncTimeEntries: true,
    designFolderUrl: DESIGN_FOLDER_URL,
    driveFilesEnabled: false,
    gmailEnabled: false,
    eveningHour: 16,
    timecardTo: 'david@senawave.com',
    timecardToName: 'Dave',
    payStatus: 'contract-1099',
    payMethod: 'ACH',
    payChecklist: {},
  };
}

const T2 = SEED_REVISION;

/** The team as everyone on the tracker sees it: work details only. */
export function seedTeam(): TeamMember[] {
  return [
    {
      id: 'tm_owner',
      name: 'Brandon Barkey',
      role: 'Civil Engineer, P.E. — plan review and plan production (contract)',
      org: 'Contractor to Senawave',
      email: 'brandonlbarkey@gmail.com',
      phone: '',
      responsibilities:
        'Reviews plan sets and marks them up (redlines), produces 11×17 sets per the Plan Production Guide when asked (sheet index, utility exports, sheet cutting, side panels, titleblocks, QC, PDF), tracks redlines and agency comments, and keeps this tracker.',
      notes: 'Admin of this tracker.',
      links: [],
      verified: 'verified',
      updatedAt: T2,
    },
    {
      id: 'tm_david',
      name: 'David Bradshaw',
      role: 'Principal / COO ("Dave")',
      org: 'Senawave (VAIX, Inc. dba Senawave Communications)',
      email: 'david@senawave.com',
      phone: '',
      responsibilities: 'Sets priorities (Fluence first, then BEAD), decides franchise, right-of-way and BEAD build-out questions, and approves hours, pay and software licences (BricsCAD, ArcGIS, company email).',
      notes: '',
      links: [],
      verified: 'verified',
      updatedAt: T2,
    },
    {
      id: 'tm_jesse',
      name: 'Jesse Montgomery',
      role: 'Design / GIS lead — day-to-day contact for plan production',
      org: 'Senawave',
      email: 'jessem@senawave.com',
      phone: '',
      responsibilities:
        'Owns the shared Design folder (Templates + Projects), builds the ArcGIS projects and geopackages, exports the xrefs, plots the prints, runs the check-ins and relays priorities from Dave.',
      notes: '',
      links: [{ label: 'Design folder (Drive)', url: DESIGN_FOLDER_URL }],
      verified: 'verified',
      updatedAt: T2,
    },
    {
      id: 'tm_pe',
      name: 'Engineer of Record (PE)',
      role: 'Reviews, seals and signs plan sets for permitting',
      org: 'Contractor to Senawave',
      email: '',
      phone: '',
      responsibilities:
        'Engineering direction and review of plan sets; responsible charge under Utah Admin Code R156-22; seals and signs sets for municipal, county and UDOT permitting; answers agency comments and redline cycles.',
      notes: 'Who seals each set is settled per project. The Fluence cover lists Brandon Barkey as engineer.',
      links: [],
      verified: 'unverified',
      updatedAt: T2,
    },
  ];
}

function sampleSheets(): Sheet[] {
  // A 4,200 ft demo corridor: 7 even cells of 600 ft on a street grid with one 90° turn.
  const rows: Array<Partial<Sheet> & { pageNumber: number }> = [
    { pageNumber: 1, angle: 0, cellFt: 600, matchR: '2', aligned: true, clipped: true, sidePanel: true, titleblock: true, qcDone: true },
    { pageNumber: 2, angle: 0, cellFt: 600, matchL: '1', matchR: '3', aligned: true, clipped: true, sidePanel: true, titleblock: true, qcDone: true },
    { pageNumber: 3, angle: 0, cellFt: 600, matchL: '2', matchT: '4', aligned: true, clipped: true, sidePanel: true, titleblock: false, qcDone: false },
    { pageNumber: 4, angle: 90, cellFt: 600, matchB: '3', matchR: '5', aligned: true, clipped: true, sidePanel: false, titleblock: false, qcDone: false, notes: 'Corner sheet — owns the whole intersection at 400 N.' },
    { pageNumber: 5, angle: 90, cellFt: 600, matchL: '4', matchR: '6', aligned: true, clipped: false, sidePanel: false, titleblock: false, qcDone: false },
    { pageNumber: 6, angle: 90, cellFt: 600, matchL: '5', matchR: '7', aligned: false, clipped: false, sidePanel: false, titleblock: false, qcDone: false },
    { pageNumber: 7, angle: 90, cellFt: 600, matchL: '6', aligned: false, clipped: false, sidePanel: false, titleblock: false, qcDone: false, notes: 'Seam moved 40 ft east to clear the HH at 1250 W.' },
  ];
  return rows.map((r) => ({
    id: `sht_sample_${r.pageNumber}`,
    pageNumber: r.pageNumber,
    angle: r.angle ?? null,
    cellFt: r.cellFt ?? null,
    clipX0: r.cellFt && r.cellFt < 685 ? +(7.35 - (r.cellFt * 0.02) / 2).toFixed(2) : null,
    clipX1: r.cellFt && r.cellFt < 685 ? +(7.35 + (r.cellFt * 0.02) / 2).toFixed(2) : null,
    matchL: r.matchL ?? '',
    matchR: r.matchR ?? '',
    matchT: r.matchT ?? '',
    matchB: r.matchB ?? '',
    aligned: !!r.aligned,
    clipped: !!r.clipped,
    sidePanel: !!r.sidePanel,
    titleblock: !!r.titleblock,
    qcDone: !!r.qcDone,
    notes: r.notes ?? '',
  }));
}

export function sampleProject(): Project {
  return {
    id: 'prj_sample_1',
    number: '26-0001',
    name: 'SAMPLE — Brigham City north corridor (demo data)',
    client: 'Senawave',
    municipality: 'Brigham City',
    county: 'Box Elder',
    status: 'cad',
    funding: 'BEAD',
    crs: 'EPSG:3560',
    routeLengthFt: 4200,
    pm: 'David Bradshaw',
    engineer: 'Engineer of Record (TBD)',
    designer: 'Brandon Barkey',
    designDate: '2026-09-22',
    fieldDate: '2026-09-15',
    dueDate: '2026-10-17',
    driveFolderUrl: '',
    arcgisProjectUrl: '',
    drawingPath: 'G:\\My Drive\\CAD\\Projects\\26-0001\\26-0001.dwg',
    description:
      'Demo project so the tool is not empty on first open. Buried fiber, 4,200 ft along a street grid with one 90° turn: 7 even 600 ft sheets. Delete it from Settings → Sample data once you have real work in here.',
    workflow: {
      'start-new': true,
      'start-units': true,
      'start-lt': true,
      'gis-index': true,
      'gis-qc': true,
      'gis-utilities': true,
      'cad-attach-index': true,
      'cad-grid-noplot': true,
      'cad-utilities': true,
      'cad-points-imagery': true,
      'cad-layouts': true,
      'sheet-ucs': false,
      'sheet-zoom': false,
    },
    qc: { 'setup-units': true },
    sheets: sampleSheets(),
    sample: true,
    createdAt: T0,
    updatedAt: T0,
  };
}

/** The one general note everyone starts with: how the tracker is meant to be used. */
export function welcomeNote(): Note {
  return {
    id: 'note_welcome',
    projectId: null,
    sheetNo: null,
    type: 'note',
    title: 'How this tracker is meant to be used',
    body:
      'Start on the Dashboard. "Next baby steps" lists the next thing to do on each project, in order, with a link straight to it.\n' +
      'A project holds one plan set: Overview, Prints & reviews (each PDF, its redlines and the AI notes), Sheets, Workflow, QC, Permits, Notes and Time.\n' +
      'Every new print: log it with its Drive link, add the redlines from the review one line each, then run the AI analysis. Work the open redlines until the next print.\n' +
      'Notes are the running log: decisions, meetings, agency comments and actions with due dates. Actions with a date show up in the morning brief.\n' +
      'Reference is the Plan Production Guide (Rev 5) as searchable tables.\n' +
      'Connections shows how this copy is connected (the shared tracker on claude.ai, a Google Drive file, or this browser only) and what is left to set up.',
    tags: ['getting-started'],
    done: false,
    dueOn: '',
    author: 'Tracker',
    createdAt: T0,
    updatedAt: SEED_REVISION,
  };
}

function sampleNotes(): Note[] {
  return [
    {
      id: 'note_sample_redline',
      projectId: 'prj_sample_1',
      sheetNo: 4,
      type: 'redline',
      title: 'PE redline: call out bore depth at the 400 N crossing',
      body: 'Add depth-of-cover callout (min 36" under roadway, 48" under UDOT crossing per permit) and show the bore pit symbol on both sides. Re-check separation from the 8" water main.',
      tags: ['sample', 'depth-of-cover', 'crossing'],
      done: false,
      dueOn: '2026-10-03',
      author: 'Engineer of Record (TBD)',
      createdAt: T0,
      updatedAt: T0,
    },
    {
      id: 'note_sample_decision',
      projectId: 'prj_sample_1',
      sheetNo: null,
      type: 'decision',
      title: 'Sheet index: even 600 ft cells instead of 685 ft',
      body: 'Ran SENAWAVE-SheetIndex.py with even=True → 7 × 600 ft cells; no stub sheet at the end. Seam 6/7 moved by hand to clear the handhole at 1250 W.',
      tags: ['sample', 'sheet-index'],
      done: true,
      dueOn: '',
      author: 'Brandon Barkey',
      createdAt: T0,
      updatedAt: T0,
    },
  ];
}

function samplePermits(): Permit[] {
  return [
    {
      id: 'pmt_sample_1',
      projectId: 'prj_sample_1',
      agency: 'Municipal',
      agencyName: 'Brigham City',
      type: 'ROW excavation permit',
      status: 'preparing',
      permitNo: '',
      submittedOn: '',
      dueOn: '2026-10-10',
      notes: 'Needs sealed set + traffic control plan. Franchise: Box Elder County Ord. 643 covers the unincorporated stretch only.',
      createdAt: T0,
      updatedAt: T0,
    },
    {
      id: 'pmt_sample_2',
      projectId: 'prj_sample_1',
      agency: 'UDOT',
      agencyName: 'UDOT Region 1',
      type: 'Encroachment permit (bore crossing)',
      status: 'not-started',
      permitNo: '',
      submittedOn: '',
      dueOn: '',
      notes: 'Crossing at sheet 4. UDOT wants depth-of-cover and bore profile on the plan.',
      createdAt: T0,
      updatedAt: T0,
    },
  ];
}

function sampleTime(): TimeEntry[] {
  return [
    { id: 'tme_sample_1', projectId: 'prj_sample_1', date: '2026-09-26', hours: 3.5, description: 'Sheet index + utility exports (ArcGIS)', billable: true, invoiced: false, createdAt: T0, updatedAt: T0 },
    { id: 'tme_sample_2', projectId: 'prj_sample_1', date: '2026-09-29', hours: 4, description: 'Cut and align PLAN-01..05, SENACLIP', billable: true, invoiced: false, createdAt: T0, updatedAt: T0 },
  ];
}

export function seedData(): AppData {
  return {
    version: DATA_VERSION,
    activity: [],
    projects: [fluenceProject(), sampleProject()],
    notes: [welcomeNote(), ...fluenceNotes(), ...sampleNotes()],
    permits: [...fluencePermits(), ...samplePermits()],
    prints: fluencePrints(),
    redlines: fluenceRedlines(),
    timeEntries: sampleTime(),
    team: seedTeam(),
    settings: defaultSettings(),
    updatedAt: T0,
    scratch: {},
    seedRevision: SEED_REVISION,
  };
}

/** "collection:id" for every row the app ships with. In the shared tracker these are only kept when the team has them too. */
export function seedRowKeys(): Set<string> {
  const d = seedData();
  const keys = new Set<string>();
  for (const c of ['projects', 'notes', 'permits', 'prints', 'redlines', 'timeEntries', 'team'] as const) for (const r of d[c]) keys.add(`${c}:${r.id}`);
  return keys;
}

// ---------- Fluence: the first real project (Design folder, Senawave emails, the 1 Oct prints and the 2 Oct review) ----------

export const FLUENCE_ID = 'prj_fluence';
const T1 = '2026-10-01T16:45:00.000Z';


export function fluenceProject(): Project {
  return {
    id: FLUENCE_ID,
    number: '26-0009',
    name: 'Fluence — 2nd St, 400 E to 500 E, Ogden',
    client: 'Senawave',
    municipality: 'Ogden',
    county: 'Weber',
    status: 'review',
    funding: 'Private',
    crs: 'EPSG:6625',
    routeLengthFt: 600,
    pm: 'Jesse Montgomery',
    engineer: 'Brandon Barkey',
    designer: 'Jesse Montgomery',
    designDate: '2026-10-01',
    fieldDate: '2026-10-01',
    dueDate: '',
    driveFolderUrl: FLUENCE_FOLDER_URL,
    arcgisProjectUrl: 'https://drive.google.com/file/d/1wctIicuYEmaN_JMG02F-dBqbi0dB6Mss/view',
    drawingPath: 'G:\\My Drive\\Design\\Projects\\Fluence\\CAD\\Fluence.dwg',
    description:
      'Buried fiber, all directional bore, along the south side of 2nd Street from 400 E to 500 E, Ogden (one block). Project number 26-0009, as on every title block. ' +
      'Jesse built Fluence.aprx and the xrefs and plotted two 16-sheet prints on 1 Oct (cover, vicinity, notes, Ogden notes, details, materials and one PLAN sheet). ' +
      'Brandon reviewed print 2 on 2 Oct: 13 redlines, "small stuff mostly". Now: work the redlines into print 3, settle the traffic-control-plan question with Ogden, add the seal block, then QC and submit to Ogden City. ' +
      'Workflow steps were ticked from the plotted print, not watched step by step. Route length is an estimate (about one block); replace it with the bore length from the final alignment. ' +
      'Field date is the title block\'s; confirm it with Ladd before submittal.',
    workflow: Object.fromEntries(WORKFLOW_STEPS.map((w) => [w.id, true])),
    qc: {},
    sheets: [
      {
        id: 'sht_fluence_1',
        pageNumber: 1,
        angle: 0,
        cellFt: 600,
        clipX0: 1.35,
        clipX1: 13.35,
        matchL: '',
        matchR: '',
        matchT: '',
        matchB: '',
        aligned: true,
        clipped: true,
        sidePanel: true,
        titleblock: true,
        qcDone: false,
        notes: 'The only PLAN sheet. Redlines on it: legend to match the title sheets, clearer aerial, STA table, more revision rows. QC after print 3.',
      },
    ],
    createdAt: T1,
    updatedAt: T2,
    updatedBy: 'Tracker',
  };
}

/** Permits Fluence will need. */
export function fluencePermits(): Permit[] {
  return [
    {
      id: 'pmt_fluence_ogden',
      projectId: FLUENCE_ID,
      agency: 'Municipal',
      agencyName: 'Ogden City Engineering',
      type: 'Right-of-way / excavation permit (directional bore)',
      status: 'not-started',
      permitNo: '',
      submittedOn: '',
      dueOn: '',
      notes:
        'Needed for work in the city right-of-way. Ogden wants bore plans stamped, signed and dated by a PE (OGDEN01, A.4) and lists a MUTCD traffic control plan with the application (OGDEN03, E.1.b): ask whether a separate TCP is needed (see the action).',
      createdAt: T2,
      updatedAt: T2,
      updatedBy: 'Tracker',
    },
  ];
}

export function fluenceNotes(): Note[] {
  const mk = (id: string, partial: Partial<Note>): Note => ({
    id,
    projectId: FLUENCE_ID,
    sheetNo: null,
    type: 'note',
    title: '',
    body: '',
    tags: ['email'],
    done: false,
    dueOn: '',
    author: 'Tracker (from Gmail)',
    createdAt: T1,
    updatedAt: T2,
    ...partial,
  });
  return [
    mk('note_fl_meet_1002', {
      type: 'meeting',
      title: 'Redline call with Jesse — Fri 2 Oct, 1 pm (print 2 review)',
      body: 'Go through the 13 redlines on 2026-10-01_Fluence_2.pdf. "Copy open redlines" on the Prints & reviews tab gives the agenda. Write down here what was agreed and who does what.',
      tags: ['review', 'meeting', 'jesse'],
      dueOn: '2026-10-02',
      author: 'Tracker',
      createdAt: T2,
    }),
    mk('note_fl_decision_tcp', {
      type: 'decision',
      title: 'Ladd: submit the plan set without a traffic control plan',
      body: 'Ladd wants the Fluence set submitted without a TCP; Jesse: include one only if the city asks. The Ogden notes printed in the set (OGDEN03, E.1.b) list a MUTCD traffic control plan as a permit document, so the question goes to Ogden first (see the action).',
      tags: ['review', 'tcp', 'permit'],
      done: true,
      author: 'Tracker',
      createdAt: T2,
    }),
    mk('note_fl_action_tcp', {
      type: 'action',
      title: 'Ask Ogden City Engineering whether a separate TCP is needed with the permit application',
      body: 'Keep the plan set TCP-free as Ladd asked. Ask the Ogden permits desk whether the application needs a separate traffic control plan, then log the answer as a decision note so it is not argued again.',
      tags: ['permit', 'tcp'],
      dueOn: '2026-10-06',
      author: 'Tracker',
      createdAt: T2,
    }),
    mk('note_fl_meet_1001', {
      type: 'meeting',
      title: 'Fluence check-in with Jesse — Thu 1 Oct, 12:00–1:00 pm MDT (Google Meet)',
      body: 'Agenda: where Fluence.dwg stands, the sheet index (one PLAN sheet), xref binding, what Jesse still needs, licence status. Jesse plotted the first two prints the same day.',
      tags: ['email', 'meeting', 'jesse'],
      dueOn: '2026-10-01',
      done: true,
    }),
    mk('note_fl_decision_hours', {
      type: 'decision',
      title: 'Dave: enough work for ~full time; finish Fluence first, then BEAD',
      body: 'Jesse relayed from Dave (30 Sep): there is enough work for full-time or close to it. Brandon offered 30–40 h/week. Jesse: "Let\'s try and finish out Fluence first and then we can move on to BEAD."',
      tags: ['email', 'hours', 'bead'],
      done: true,
    }),
    mk('note_fl_action_licences', {
      type: 'action',
      title: 'Follow up with Dave: BricsCAD + ArcGIS licences and a @senawave.com email',
      body: 'Brandon\'s 29 Sep email to Dave and Jesse asked for the two licences and a company email for accounts. Close this once they arrive.',
      tags: ['email', 'setup', 'dave'],
      dueOn: '2026-10-02',
    }),
    mk('note_fl_ref_stamped', {
      type: 'note',
      title: 'Reference sets from Jesse: two stamped contractor plan sets (30 Sep)',
      body: '"SENAWAVE COPPERTON - UDOT TRADE 26-0062 04-22-26" and "Senawave - Ogden City Washington Blvd. Project 1" (PDFs in the "Stamped plans" email). The look-and-feel target for the Fluence set: titleblock, notes sheets, crossing callouts.',
      tags: ['email', 'reference'],
    }),
    mk('note_fl_data', {
      type: 'note',
      title: 'Data received: Fluence geopackage (25 Sep) and Design folder share (30 Sep)',
      body: 'Fluence.gpkg emailed 25 Sep; the shared Design folder holds the live copy (ArcGIS\\Shared\\Fluence.gpkg) plus the route PDF/KMZ, the Ogden City utility KMZs, Fluence.aprx/.gdb and the CAD folder with Fluence.dwg and the xref exports. See the Files page.',
      tags: ['email', 'data'],
    }),
    mk('note_fl_action_route', {
      type: 'action',
      title: 'Replace the 600 ft route estimate with the bore length from the final alignment',
      body: 'The tracker guessed one block (~600 ft) from the route PDF. Take the real bore length once print 3 is final; the MATERIALS quantities need it too.',
      tags: ['sheet-index', 'materials'],
      author: 'Tracker',
    }),
  ];
}
