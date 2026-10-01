// Core data model for the Senawave civil design tracker.
// Everything is plain JSON so it can live in localStorage today and a Drive file / database tomorrow.

export type ProjectStatus =
  | 'intake'
  | 'gis'
  | 'cad'
  | 'qc'
  | 'review'
  | 'permitting'
  | 'sealed'
  | 'construction'
  | 'closed'
  | 'on-hold';

export const PROJECT_STATUSES: { id: ProjectStatus; label: string; hint: string }[] = [
  { id: 'intake', label: 'Intake', hint: 'Scope, route received, folder made' },
  { id: 'gis', label: 'ArcGIS', hint: 'Dissolved route, sheet index, utility exports' },
  { id: 'cad', label: 'BricsCAD', hint: 'Data in, sheets cut and aligned, side panels' },
  { id: 'qc', label: 'QC', hint: 'Section 11 checklist, PDF paged through' },
  { id: 'review', label: 'PE review', hint: 'Engineer of Record review and redlines' },
  { id: 'permitting', label: 'Permitting', hint: 'Submitted to municipality / county / UDOT' },
  { id: 'sealed', label: 'Sealed', hint: 'Plan set sealed and issued' },
  { id: 'construction', label: 'Construction', hint: 'Construction support, as-builts' },
  { id: 'closed', label: 'Closed', hint: 'Done' },
  { id: 'on-hold', label: 'On hold', hint: 'Waiting on client, agency or funding' },
];

export type Funding = 'BEAD' | 'Private' | 'Municipal' | 'Other' | '';

export type PermitAgencyType = 'UDOT' | 'Municipal' | 'County' | 'Railroad' | 'Private easement' | 'Blue Stakes / 811' | 'Other';
export type PermitStatus = 'not-started' | 'preparing' | 'submitted' | 'comments' | 'resubmitted' | 'approved' | 'denied' | 'closed';

export const PERMIT_STATUSES: { id: PermitStatus; label: string }[] = [
  { id: 'not-started', label: 'Not started' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'comments', label: 'Comments received' },
  { id: 'resubmitted', label: 'Resubmitted' },
  { id: 'approved', label: 'Approved' },
  { id: 'denied', label: 'Denied' },
  { id: 'closed', label: 'Closed' },
];

export interface Permit {
  id: string;
  deletedAt?: string | null; // tombstone: hidden everywhere, kept so the delete syncs, purged after 90 days
  updatedBy?: string;
  projectId: string;
  agency: PermitAgencyType;
  agencyName: string; // e.g. "UDOT Region 1", "Logan City", "Cache County"
  type: string; // e.g. "Encroachment permit", "ROW excavation permit"
  status: PermitStatus;
  permitNo: string;
  submittedOn: string; // ISO date
  dueOn: string; // ISO date
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sheet {
  id: string;
  pageNumber: number;
  angle: number | null; // UCS Z rotation, -90..90
  cellFt: number | null; // <= 685
  clipX0: number | null;
  clipX1: number | null;
  matchL: string;
  matchR: string;
  matchT: string;
  matchB: string;
  aligned: boolean; // 6.2 steps 1-7
  clipped: boolean; // SENACLIP / 6.2 steps 8-10
  sidePanel: boolean; // SENASIDE
  titleblock: boolean; // per-sheet fields
  qcDone: boolean;
  notes: string;
}

export interface Project {
  id: string;
  deletedAt?: string | null;
  updatedBy?: string;
  number: string; // titleblock project number, e.g. 26-0001
  name: string;
  client: string;
  municipality: string;
  county: string;
  status: ProjectStatus;
  funding: Funding;
  crs: string; // e.g. EPSG:3566
  routeLengthFt: number | null;
  pm: string;
  engineer: string; // Engineer of Record
  designer: string;
  designDate: string;
  fieldDate: string;
  dueDate: string;
  driveFolderUrl: string;
  arcgisProjectUrl: string;
  drawingPath: string; // <Project>\<Project>.dwg
  description: string;
  workflow: Record<string, boolean>; // guide 1.4 step ids
  qc: Record<string, boolean>; // guide section 11 item ids
  sheets: Sheet[];
  sample?: boolean; // seeded demo data, safe to delete
  createdAt: string;
  updatedAt: string;
}

export type NoteType = 'note' | 'action' | 'redline' | 'agency-comment' | 'meeting' | 'decision' | 'issue';

export const NOTE_TYPES: { id: NoteType; label: string }[] = [
  { id: 'note', label: 'Note' },
  { id: 'action', label: 'Action item' },
  { id: 'redline', label: 'Redline / PE comment' },
  { id: 'agency-comment', label: 'Agency comment' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'decision', label: 'Decision' },
  { id: 'issue', label: 'Issue / lesson learned' },
];

export interface Note {
  id: string;
  deletedAt?: string | null; // tombstone: hidden everywhere, kept so the delete syncs, purged after 90 days
  updatedBy?: string;
  projectId: string | null;
  sheetNo: number | null;
  type: NoteType;
  title: string;
  body: string;
  tags: string[];
  done: boolean;
  dueOn: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  deletedAt?: string | null; // tombstone: hidden everywhere, kept so the delete syncs, purged after 90 days
  updatedBy?: string;
  projectId: string | null;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  invoiced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  deletedAt?: string | null;
  updatedBy?: string;
  name: string;
  role: string;
  org: string;
  email: string;
  phone: string;
  responsibilities: string;
  notes: string;
  links: { label: string; url: string }[];
  verified: 'verified' | 'partial' | 'unverified';
  updatedAt: string;
}

export interface Settings {
  ownerName: string;
  ownerEmail: string;
  allowedEmails: string[]; // who may sign in (in addition to owner)
  hourlyRate: number | null; // your contract rate, for the time log
  driveFileId: string; // shared JSON file id (optional; auto-created when blank)
  driveFolderName: string;
  driveScope: 'drive.file' | 'drive';
  autoSync: boolean;
  theme: 'system' | 'light' | 'dark';
  quickLinks: { label: string; url: string }[];
  /** Include the time log in the Drive file. Turn off before sharing the file with the client. */
  syncTimeEntries: boolean;
  /** The shared Senawave "Design" folder (Templates + Projects). Shared setting. */
  designFolderUrl: string;
  /** Device-only feature switches: each one asks Google for one extra read-only scope. */
  driveFilesEnabled: boolean;
  gmailEnabled: boolean;
  /** Hour (0-23, local) the Daily page switches from morning brief to evening log. */
  eveningHour: number;
}

/**
 * Settings that stay on this device and are never written to the Drive file or an export:
 * your rate, how this browser looks, and where this device syncs from.
 */
export const PRIVATE_SETTING_KEYS = ['hourlyRate', 'theme', 'autoSync', 'driveFileId', 'driveFolderName', 'driveScope', 'syncTimeEntries', 'driveFilesEnabled', 'gmailEnabled', 'eveningHour'] as const satisfies readonly (keyof Settings)[];
export type PrivateSettingKey = (typeof PRIVATE_SETTING_KEYS)[number];

export type EntityKind = 'projects' | 'notes' | 'permits' | 'timeEntries' | 'team';

export type ActivityKind = 'status' | 'workflow' | 'qc' | 'sheet' | 'note' | 'permit' | 'time' | 'project' | 'file' | 'email';

/** One line of "what happened": feeds the evening log. Capped, synced, newest-wins like everything else. */
export interface ActivityEntry {
  id: string;
  at: string; // ISO
  kind: ActivityKind;
  label: string;
  projectId: string | null;
  by: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/** A file or folder seen in the Senawave Design folder (Drive). Device-local cache, never synced. */
export interface DriveNode {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  parentId: string | null;
  path: string; // e.g. Projects/Fluence/CAD/xref/SheetIndex.dwg
  modifiedTime: string;
  modifiedBy: string;
  size: number | null;
  webViewLink: string;
}

export interface DriveSnapshot {
  rootId: string;
  takenAt: string;
  nodes: DriveNode[];
  source: 'live' | 'seed';
}

export interface AppData {
  version: number;
  activity: ActivityEntry[];
  projects: Project[];
  notes: Note[];
  permits: Permit[];
  timeEntries: TimeEntry[];
  team: TeamMember[];
  settings: Settings;
  updatedAt: string;
  // free-form per-key markdown-ish notes (e.g. "gusto", "bricscad-setup")
  scratch: Record<string, { body: string; updatedAt: string }>;
}

export const DATA_VERSION = 3;
