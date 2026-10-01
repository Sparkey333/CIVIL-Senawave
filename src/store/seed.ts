import type { AppData, Note, Permit, Project, Settings, Sheet, TeamMember, TimeEntry } from '@/lib/types';
import { DATA_VERSION } from '@/lib/types';
import { COMPANY } from '@/data/company';

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
];

export function defaultSettings(): Settings {
  return {
    ownerName: 'Brandon Barkey',
    ownerEmail: 'brandonlbarkey@gmail.com',
    allowedEmails: [],
    hourlyRate: null,
    driveFileId: '',
    driveFolderName: 'Senawave Tracker',
    driveScope: 'drive.file',
    autoSync: false,
    theme: 'system',
    quickLinks: DEFAULT_QUICK_LINKS,
    syncTimeEntries: true,
  };
}

export function seedTeam(): TeamMember[] {
  return [
    {
      id: 'tm_owner',
      name: 'Brandon Barkey',
      role: 'Civil designer (contract) — plan production, ArcGIS → BricsCAD',
      org: 'Contractor (Ansom Outdoor LLC)',
      email: 'brandonlbarkey@gmail.com',
      phone: '',
      responsibilities:
        'Produce 11×17 plan sets per the Plan Production Guide: sheet index in ArcGIS Pro, utility exports, BricsCAD sheet cutting, side panels, titleblocks, QC and PDF. Track redlines and agency comments; hand sealed-ready sets to the Engineer of Record.',
      notes: 'This tool is signed in as you. Edit your details in Settings.',
      links: [],
      verified: 'verified',
      updatedAt: T0,
    },
    {
      id: 'tm_david',
      name: 'David Bradshaw',
      role: 'Principal / COO (also cited as CEO and Operations Manager)',
      org: 'Senawave (VAIX, Inc. dba Senawave Communications)',
      email: '',
      phone: '',
      responsibilities:
        'Senior operations/executive principal and named Provider representative on municipal franchise agreements (Willard City, Farr West, Box Elder County corridor). Decision-maker on franchise, right-of-way and BEAD build-out matters.',
      notes:
        'Verified across Crunchbase, ZoomInfo, LinkedIn, D&B, FCC Form 499 (CEO of VAIX, Inc.), Cottonwood Heights city news and council minutes. Background: BS Computer Science (UVU), formerly Arrival Telecom; with Senawave since about 2012. No PE/PLS record found — not the Engineer of Record.',
      links: [
        { label: 'Crunchbase', url: 'https://www.crunchbase.com/person/david-bradshaw-c253' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/david-bradshaw-8b8b9535/' },
        { label: 'FCC Form 499 (VAIX, Inc.)', url: 'https://apps.fcc.gov/cgb/form499/499detail.cfm?FilerNum=829516' },
        { label: 'Farr West council minutes 2020', url: 'https://www.utah.gov/pmn/files/593539.pdf' },
        { label: 'Willard City packet Dec 2025', url: 'https://www.willardcityut.gov/uploads/2/3/0/7/23075090/council_packet_12-11-2025.pdf' },
      ],
      verified: 'verified',
      updatedAt: T0,
    },
    {
      id: 'tm_jesse',
      name: 'Jesse Montgomery',
      role: 'Design / project contact — role to confirm',
      org: 'Senawave (assumed)',
      email: '',
      phone: '',
      responsibilities: 'Day-to-day design coordination (your working folder is "Utah Fiber - Jesse"). Confirm title, email and whether Jesse is Senawave staff or a contractor.',
      notes:
        'NOT FOUND in any public source tied to Senawave, Vaix, Utah telecom/fiber, Ansom Outdoor or "UT Light" (about 20 search variants). Utah people with this name found online are in unrelated fields (Co-Diagnostics, Veola Consulting, Intermountain Healthcare). Ask David or Jesse directly and update this card.',
      links: [],
      verified: 'unverified',
      updatedAt: T0,
    },
    {
      id: 'tm_pe',
      name: 'Engineer of Record (PE) — to be named',
      role: 'Licensed Utah PE, contract (per the Indeed posting)',
      org: 'Contractor to Senawave',
      email: '',
      phone: '',
      responsibilities:
        'Engineering direction and review of plan sets; responsible charge under Utah Admin Code R156-22; seals and signs sets for municipal, county and UDOT permitting; responds to agency comments and redline cycles.',
      notes: 'Placeholder from the job posting ($75–$100/hr, remote, Utah PE required). Replace with the real person once Senawave engages one.',
      links: [],
      verified: 'unverified',
      updatedAt: T0,
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

function sampleNotes(): Note[] {
  return [
    {
      id: 'note_welcome',
      projectId: null,
      sheetNo: null,
      type: 'note',
      title: 'How this tool is meant to be used',
      body:
        'Projects hold one plan set each: sheet index tracker, the guide 1.4 workflow, the section 11 QC list, permits and time.\n' +
        'Notes are the running log — redlines from the PE, agency comments, decisions, lessons learned. Tag them and tie them to a project and sheet.\n' +
        'Reference is the Plan Production Guide (Rev 5) as searchable tables: numbers, commands, layers, symbols, troubleshooting.\n' +
        'Team & Company is the verified background on Senawave, David and Jesse, plus the job posting.\n' +
        'Data lives in this browser until you sign in with Google and turn on Drive sync (Settings). Export JSON any time.',
      tags: ['getting-started'],
      done: false,
      dueOn: '',
      author: 'Tracker',
      createdAt: T0,
      updatedAt: T0,
    },
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
    projects: [sampleProject()],
    notes: sampleNotes(),
    permits: samplePermits(),
    timeEntries: sampleTime(),
    team: seedTeam(),
    settings: defaultSettings(),
    updatedAt: T0,
    scratch: {},
  };
}
