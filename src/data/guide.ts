// Reference data transcribed from "SENAWAVE Plan Production Guide", Rev 5, 28 September 2026
// (BricsCAD V24+ / ArcGIS Pro 3.x). Source: docs/source/SENAWAVE-Plan-Production-Guide-Rev5.docx
// Keep this file in step with the guide: when the guide revision changes, update GUIDE_META and the tables.

export const GUIDE_META = {
  title: 'SENAWAVE Plan Production Guide',
  revision: 'Rev 5',
  date: '2026-09-28',
  software: 'BricsCAD V24+ / ArcGIS Pro 3.x',
  summary:
    'From an ArcGIS route to a plotted 11×17 plan set, in BricsCAD. The only current procedure document: it replaces the Rev 4 guide, the Layer Standard, the Symbol Guide and every README that used to sit beside the template.',
};

export const READ_NOTHING_ELSE = [
  'Model space is in FEET. Paper space is in INCHES. The bridge is ZOOM 0.02XP — 0.02 paper inches per model foot = 1" = 50\'.',
  "A sheet's size on paper is set by the page setup's PAPER UNITS, never by INSUNITS. Anything 25.4× wrong is the page setup; 12× wrong is INSUNITS.",
  'LTSCALE is always 1. The SW_* linetypes are drawn in paper inches. If dashes look wrong, run SENALTCHECK — do not touch LTSCALE.',
  'Run SENAUNITS and SENALTCHECK on every drawing you open. Both only report; they take two seconds.',
];

export const THREE_RULES = [
  {
    rule: 'Feet in model, inches on paper',
    meaning:
      'Everything in model space is drawn in real US survey feet. Layouts are 17 × 11 inches. A plan viewport shows 1" = 50\', set with ZOOM 0.02XP. There is no "1/600XP" anywhere in this workflow.',
  },
  {
    rule: 'The page setup decides the paper',
    meaning:
      'A layout does not store a paper size — it stores a printer name plus a paper name. If that name does not exist on your printer, BricsCAD silently substitutes a default, often metric. SENAUNITS tells you; SENAUNITSFIX repairs it.',
  },
  {
    rule: 'The drawing holds a snapshot',
    meaning:
      'Legend, key map, north arrow, vicinity sheet, linetypes and symbol blocks are copied into the drawing by a command. Nothing updates itself. If you edit the index, a layer or a symbol, re-run the command that built that piece (section 14).',
  },
];

export interface NumberRow {
  property: string;
  value: string;
  drives: string;
}

export const NUMBERS: NumberRow[] = [
  { property: 'Sheet', value: '17" × 11", zero margins', drives: 'Layout paper size' },
  { property: 'PLAN viewport', value: '13.700" × 8.400"', drives: 'Viewport on layer G-VPORT (no-plot)' },
  { property: 'Viewport centre', value: '7.350, 6.300', drives: 'Spans X 0.50–14.20, Y 2.10–10.50' },
  { property: 'Plot scale', value: '1" = 50\'', drives: 'Titleblock SCALE attribute' },
  { property: 'Zoom XP factor', value: '0.02 (= 1/50)', drives: 'Paper inches per model foot' },
  { property: 'Ground seen per sheet', value: '685 ft × 420 ft', drives: '13.7 × 50 and 8.4 × 50 — the largest a sheet index polygon can be' },
  { property: 'Equivalent map scale', value: '1 : 600', drives: 'For ArcGIS tools that want a ratio' },
  { property: 'Corridor half-width', value: '210 ft either side', drives: 'The route runs down the middle of the page' },
];

export const TWO_NUMBERS = ['Largest sheet index polygon = 685 ft along × 420 ft across.', 'Viewport zoom = ZOOM 0.02XP.'];

export const SHEET_MAX_ALONG_FT = 685;
export const SHEET_MAX_ACROSS_FT = 420;
export const ZOOM_XP = 0.02;
export const FT_PER_INCH = 50;

export const PAPER_COORDS = {
  sidePanel: {
    title: 'PLAN sheet side panel (block TB_SIDEPANEL, x 14.20–16.50)',
    rows: [
      { cell: 'north arrow cell', extent: 'y 9.30 – 10.50', note: 'centre 15.35, 9.85' },
      { cell: '"LEGEND" header band', extent: 'y 8.90 – 9.30', note: '' },
      { cell: 'legend body', extent: 'y 5.40 – 8.90', note: '' },
      { cell: '"KEY MAP" header band', extent: 'y 5.00 – 5.40', note: '' },
      { cell: 'key map body', extent: 'y 2.10 – 5.00', note: '' },
      { cell: 'key map content area', extent: '14.30, 2.20 to 16.40, 4.90', note: '2.10 × 2.70' },
    ],
  },
  vicinity: {
    title: 'VICINITY sheet',
    rows: [
      { cell: 'key map (whole index)', extent: '0.50, 3.00 to 8.30, 10.50', note: '' },
      { cell: 'north arrow + scale bar', extent: '0.50, 2.10 to 8.30, 3.00', note: '' },
      { cell: 'SHEET INDEX', extent: '8.30, 6.60 to 12.40, 10.50', note: '' },
      { cell: 'FIRM', extent: '12.40, 6.60 to 16.50, 10.50', note: '' },
      { cell: 'LEGEND, three columns', extent: '8.30, 2.10 to 16.50, 6.60', note: '' },
      { cell: 'map content area', extent: '0.60, 3.10 to 8.20, 10.40', note: '7.60 × 7.30' },
    ],
  },
};

export const TEMPLATES_FOLDER = `Templates\\
  SENAWAVE-Plan-Production-Guide.docx   this guide
  SENAWAVE-11x17-TEMPLATE.dwt           start every project drawing from this
  Support\\                              add this folder to BricsCAD (1.2)
     SENAWAVE-LOADALL.lsp                 loads every command below in one go
     SENAUNITS.lsp   SENALTYPE.lsp   SENASIDE.lsp   SENAVICINITY.lsp
     SENACLIP.lsp    SENATITLE.lsp   SENAWAVELOAD.lsp   PT2BLK.lsp
     SENAMIGRATE.lsp
     SENAWAVE-PAPER.lin                   the SW_* letter-coded linetypes
     SENAWAVE-FIBER-SYMBOLS.dxf           the symbol library
     SENAWAVE-11x17-DRAWORDER.lst         layer draw order
  ArcGIS\\                               run in the ArcGIS Pro Python window
     SENAWAVE-SheetIndex.py               grid-snapped sheet index
     SENAWAVE-SheetImagery.py             per-sheet aerial imagery
     SENAWAVE-KeyMapBasemap.py            pictures behind the key maps
     SENAWAVE-ARCGIS-SEED.dwg             seed file for Export To CAD
  Archive\\                              old revisions - never work from here`;

export const PROJECT_FOLDER = `<Project>\\
  <Project>.dwg          the one drawing: model space + every layout
  xref\\                  SheetIndex.dwg, the utility exports, aerial tiles
  keymap\\                KEYMAP-01.tif ... KEYMAP-VICINITY.tif (section 9)
  keymap-windows.csv     written by SENAKEYWIN, beside the .dwg
  PDF\\                   plotted sets
  Archived\\              older copies of the .dwg`;

export const SUPPORT_FILES = [
  { file: 'SENAWAVE-11x17-TEMPLATE.dwt', purpose: 'The drawing template. Layouts COVER, VICINITY, PLAN-01, NOTES01–03, NOTES04-1–4, MATERIALS, DETAIL01–04. Carries the layer standard, the symbol blocks and the attributed titleblock TB_11X17.' },
  { file: 'SENAUNITS.lsp', purpose: 'Page-setup and units audit and fix. Run first, on everything.' },
  { file: 'SENALTYPE.lsp', purpose: 'Loads the SW_* linetypes, sets LTSCALE/PSLTSCALE/CANNOSCALE, applies the layer colour standard.' },
  { file: 'SENASIDE.lsp', purpose: 'The right-hand panel of every PLAN sheet: legend, key map, north arrow, key map basemap.' },
  { file: 'SENAVICINITY.lsp', purpose: 'The VICINITY sheet, and the commands that place both basemaps. Needs SENASIDE loaded first.' },
  { file: 'SENACLIP.lsp', purpose: 'Clips every PLAN viewport to its sheet index polygon and draws and labels the matchlines. Needs SENASIDE loaded first.' },
  { file: 'SENATITLE.lsp', purpose: 'Project titleblock fields on every sheet in one pass.' },
  { file: 'SENAWAVELOAD.lsp', purpose: 'Loads the symbol library into an older drawing that lacks it.' },
  { file: 'PT2BLK.lsp', purpose: 'Turns imported CAD points into symbol blocks.' },
  { file: 'SENAMIGRATE.lsp', purpose: 'Renames old or ArcGIS SW-* layers to the standard (Appendix C).' },
];

export const BRICSCAD_SETUP = [
  {
    id: 'support-path',
    title: 'Support path',
    body: 'SETTINGS → Program Options → Files → Support file search path → add the Templates\\Support folder. On your computer it is C:\\Users\\<you>\\My Drive\\CAD\\Templates\\Support or G:\\My Drive\\CAD\\Templates\\Support, depending on how Google Drive is mounted. This lets the scripts find the linetype file, the symbol library and each other without asking.',
  },
  {
    id: 'startup-suite',
    title: 'Load the commands automatically',
    body: 'APPLOAD → Startup Suite → Add → SENAWAVE-LOADALL.lsp. Every drawing you open now has every SENA command. (One session only: APPLOAD → select SENAWAVE-LOADALL.lsp → Load.) If BricsCAD warns about an untrusted file, choose Always load or add the folder to the trusted paths.',
  },
  {
    id: 'check-loaded',
    title: 'Check it worked',
    body: 'Open any drawing. The command line should end with "SENAWAVE: loaded 9 of 9 files". If a file is listed as NOT loaded, the support path in step 1 is wrong.',
  },
  {
    id: 'never-in-template',
    title: 'Do not work inside the template',
    body: 'Start projects with NEW → browse to Templates\\SENAWAVE-11x17-TEMPLATE.dwt, then SAVEAS into the project folder. Only open the .dwt itself when you are deliberately changing the standard (section 14), and put the previous copy in Archive first.',
  },
];

export interface WorkflowStep {
  id: string;
  phase: string;
  section: string;
  label: string;
  commands?: string[];
}

// Guide 1.4 "Your first plan set — the whole job on one page"
export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'start-new', phase: 'START', section: '2', label: 'NEW from SENAWAVE-11x17-TEMPLATE.dwt → SAVEAS <Project>\\<Project>.dwg' },
  { id: 'start-units', phase: 'START', section: '2.2', label: 'SENAUNITS: every layout "ok"? If not → SENAPAPER, SENATRY, SENAUNITSFIX', commands: ['SENAUNITS', 'SENAPAPER', 'SENATRY', 'SENAUNITSFIX'] },
  { id: 'start-lt', phase: 'START', section: '2.2', label: 'SENALTCHECK: LTSCALE 1, linetypes missing 0? If not → SENALT, SENACOLOR', commands: ['SENALTCHECK', 'SENALT', 'SENACOLOR'] },
  { id: 'gis-index', phase: 'ARCGIS', section: '4.3', label: 'Dissolve route → ArcGIS\\SENAWAVE-SheetIndex.py: edge-to-edge cells, each ≤ 685 × 420 ft; move seams by hand if needed' },
  { id: 'gis-qc', phase: 'ARCGIS', section: '4.6–4.7', label: 'QC the index → Layer = "TB-GRID" → Export To CAD → xref\\SheetIndex.dwg' },
  { id: 'gis-utilities', phase: 'ARCGIS', section: '4.8', label: 'Utility data: calculate Layer field → Export To CAD → xref\\*.dwg' },
  { id: 'cad-attach-index', phase: 'BRICSCAD — ONCE', section: '5.1', label: 'UCS World → XATTACH SheetIndex.dwg at 0,0,0 (name stays "SheetIndex")', commands: ['XATTACH'] },
  { id: 'cad-grid-noplot', phase: 'BRICSCAD — ONCE', section: '5.1', label: 'TB-GRID → no-plot' },
  { id: 'cad-utilities', phase: 'BRICSCAD — ONCE', section: '5.2', label: 'XATTACH utilities → Bind (Insert) → EXPLODE once → SENAMIGRATE, SENACOLOR', commands: ['SENAMIGRATE', 'SENACOLOR'] },
  { id: 'cad-points-imagery', phase: 'BRICSCAD — ONCE', section: '5.2–5.4', label: 'PT2BLK for point features; aerial imagery; DRAWORDERBYLAYER', commands: ['PT2BLK', 'DRAWORDERBYLAYER'] },
  { id: 'cad-layouts', phase: 'BRICSCAD — ONCE', section: '6.1', label: 'Copy layout PLAN-01 → PLAN-02 … PLAN-nn' },
  { id: 'sheet-ucs', phase: 'BRICSCAD — EVERY PLAN SHEET', section: '6.2', label: 'MSPACE → UCS Z <Angle> → PLAN Enter' },
  { id: 'sheet-zoom', phase: 'BRICSCAD — EVERY PLAN SHEET', section: '6.2', label: 'ZOOM Window <two corners> → ZOOM 0.02XP → UCS Save PLAN-nn' },
  { id: 'fin-clip', phase: 'BRICSCAD — ONCE THE SHEETS ARE ALIGNED', section: '6.2–6.4', label: 'SENACLIP: clip every viewport, matchlines + labels, lock', commands: ['SENACLIP'] },
  { id: 'fin-side', phase: 'BRICSCAD — ONCE THE SHEETS ARE ALIGNED', section: '7', label: 'SENASIDE: legend, key map, north arrow on every PLAN sheet', commands: ['SENASIDE'] },
  { id: 'fin-vicinity', phase: 'BRICSCAD — ONCE THE SHEETS ARE ALIGNED', section: '8', label: 'SENAVICINITY: the vicinity sheet', commands: ['SENAVICINITY'] },
  { id: 'fin-keymap', phase: 'BRICSCAD — ONCE THE SHEETS ARE ALIGNED', section: '9', label: 'SENAKEYWIN → ArcGIS\\SENAWAVE-KeyMapBasemap.py → SENAIMG → SENAKEYMAP', commands: ['SENAKEYWIN', 'SENAIMG', 'SENAKEYMAP'] },
  { id: 'fin-title', phase: 'BRICSCAD — ONCE THE SHEETS ARE ALIGNED', section: '10', label: 'SENATITLE: project fields; per-sheet fields by hand', commands: ['SENATITLE', 'SENAPLOTDATE'] },
  { id: 'fin-plot', phase: 'BRICSCAD — ONCE THE SHEETS ARE ALIGNED', section: '10–11', label: 'Plot to PDF (PUBLISH, Print As PDF, page setup SENAWAVE-11X17), run the QC checklist', commands: ['PUBLISH'] },
];

export const WORKFLOW_PHASES = [...new Set(WORKFLOW_STEPS.map((s) => s.phase))];

export const HEALTH_CHECK = [
  { see: 'SENAUNITS, each layout', expected: 'ok — Print As PDF, ANSI full bleed B, 17 × 11 inches, 1:1, TB 16 × 10, margins .03 (ok)', ifNot: 'Page setup fix: SENAPAPER → SENATRY → SENAUNITSFIX → SENAUNITS.' },
  { see: 'SENAUNITS, header', expected: 'INSUNITS 2 (feet), MEASUREMENT 0, PSLTSCALE 1, LTSCALE 1', ifNot: 'The page setup fix sets them too.' },
  { see: 'SENALTCHECK (run it on the Model tab)', expected: 'LTSCALE 1, PSLTSCALE 1, MSLTSCALE 1, CANNOSCALE 1"=50\', SENA-LT present, linetypes missing: 0', ifNot: 'SENALT, then SENACOLOR, then REGENALL. If SENALT says CANNOSCALE NOT SET, add the scale first (SCALELISTEDIT → Add → 1"=50\', paper 1, drawing 50).' },
];

export const PAGE_SETUP_FIX = [
  'SENAPAPER — every paper on "Print As PDF" that MEASURES 17 × 11, with its margins. Names are not trusted: "full bleed" can have margins.',
  'SENATRY — on ONE layout: pick a paper with margins of .05 or less, then look. The border should sit 0.5" inside the paper all round. Not right → SENAUNITSUNDO, then SENATRY the next candidate.',
  'SENAUNITSFIX — every layout. It names the paper it will use and asks Yes/No: answer Yes only if it is the paper you just approved.',
  'SENAUNITS — confirm every layout now says ok, then SAVE. Then save a named page setup SENAWAVE-11X17 from a good layout.',
  'A layout whose paper origin has already shifted cannot be repaired: delete that layout and copy a good one.',
];

export const CRS_OPTIONS = [
  { code: 'EPSG:3566', label: 'NAD83 / Utah Central (ftUS)' },
  { code: 'EPSG:3560', label: 'NAD83 / Utah North (ftUS)' },
  { code: 'EPSG:6625', label: 'NAD83(2011) / Utah Central (ftUS)' },
  { code: 'EPSG:6620', label: 'NAD83(2011) / Utah North (ftUS)' },
];

export const CRS_RULES = [
  'The route is one dissolved polyline in the project CRS — EPSG 3566 (Utah Central, ftUS) or 3560 (Utah North), or their NAD83(2011) versions such as 6625 — whichever the job uses, the same one everywhere: route, exports, imagery map and the epsg= you give the scripts. Never Web Mercator.',
  'Merge, then Dissolve with "unsplit lines": disconnected pieces break the page chain and restart the numbering.',
  "Every layer you export is in that same CRS — Export To CAD writes coordinates in the input's CRS and ignores the environment settings.",
  'An ArcGIS Basic licence is enough for everything here.',
];

export const INDEX_METHODS = [
  { method: 'ArcGIS\\SENAWAVE-SheetIndex.py (recommended)', use: 'Street grids, branches, most jobs. Sheets come out square to the street grid, edge-to-edge, with the clip and matchline numbers already filled in.', section: '4.3' },
  { method: 'Draw or adjust the polygons by hand', use: 'Moving a seam off a handhole or intersection, small jobs, fixing a corner. Often: run the script, then move a few seams.', section: '4.4' },
  { method: 'Strip Map Index Features at 0 % overlap', use: 'A long, curving single corridor (a highway). Needs hand fixes at bends.', section: '4.5' },
];

export const SHEET_INDEX_RUN = [
  'ArcGIS Pro, project open → View → Python window',
  'Right-click in the Python window → Load Code… → pick Templates\\ArcGIS\\SENAWAVE-SheetIndex.py → Enter (it prints "SENAWAVE-SheetIndex loaded" — nothing has run yet)',
  'sheet_index("Route_Dissolved")  ← your route layer name in Contents. Optional: sheet_index("Route_Dissolved", dry_run=True) to check only',
];

export const SHEET_INDEX_OPTIONS = [
  { option: 'out_name', def: '"SheetIndex"', what: 'Feature class name only.' },
  { option: 'out_gdb', def: 'project default', what: 'A different .gdb to write into.' },
  { option: 'snap_deg', def: '90', what: '90 = street grid, 45 also allows diagonals, 0 = follow the route freely.' },
  { option: 'grid_brg', def: '0', what: 'Degrees CCW from east. Set to the street bearing on a skewed plat.' },
  { option: 'min_cell', def: '120', what: 'Feet. A leftover shorter than this gets no sheet; it is listed so you can fix it by hand (4.4).' },
  { option: 'even', def: 'True', what: 'Equal cells along each run, so there is no stub sheet at the end.' },
  { option: 'overwrite', def: 'False', what: 'True replaces an existing SheetIndex made by this script — nothing else.' },
  { option: 'dry_run', def: 'False', what: 'True = check and report, write nothing.' },
];

export const SHEET_INDEX_FIELDS = [
  { field: 'PageNumber', use: 'Sheet number. PageNumber 4 → layout PLAN-04.' },
  { field: 'Angle', use: 'The UCS Z rotation for that sheet (6.2 step 3). Always between −90 and 90, so north is on the top or right of the sheet, never upside down.' },
  { field: 'NorthRot', use: '= −Angle, the north arrow rotation (SENANORTH works it out itself).' },
  { field: 'CellFt', use: "The cell's length along the route, ≤ 685 ft." },
  { field: 'ClipX0 / ClipX1', use: 'Paper X of the clip rectangle: it runs from (ClipX0, 2.10) to (ClipX1, 10.50). A 685 ft cell is 0.50 to 14.20 — the full viewport, no clip needed.' },
  { field: 'MatchL / MatchR / MatchT / MatchB', use: 'The sheet across the Left / Right / Top / Bottom border as plotted — the "SEE SHEET" numbers for the matchline labels.' },
  { field: 'RunId / SeqId / AcrossFt', use: 'Which run, position in it, and how wide the route wanders across the cell.' },
];

export const INDEX_QC = [
  'Polygons touch but never overlap, and the route never crosses a gap between them (the script\'s "coverage gaps" is 0).',
  'No polygon is bigger than 685 × 420 ft, and the route stays inside each one\'s 420 ft width.',
  'On a street grid every Angle is a multiple of 90°.',
  'No seam runs through a handhole, splice or intersection.',
  'PageNumber runs 1…N with no gaps.',
];

export const EXPORT_INDEX_SNIPPET = `arcpy.management.AddField("SheetIndex", "Layer", "TEXT", field_length=255)
arcpy.management.CalculateField("SheetIndex", "Layer", '"TB-GRID"', "PYTHON3")
arcpy.conversion.ExportCAD(
    in_features = "SheetIndex", Output_Type = "DWG_R2018",
    Output_File = r"<Project>\\xref\\SheetIndex.dwg",
    Ignore_FileNames = "Ignore_Filenames_in_Tables",
    Append_To_Existing = "Overwrite_Existing_Files",
    Seed_File = r"<Templates>\\ArcGIS\\SENAWAVE-ARCGIS-SEED.dwg")`;

export const STRIP_MAP_SNIPPET = `arcpy.cartography.StripMapIndexFeatures(
    in_features = "Route_Dissolved", out_feature_class = "SheetIndex",
    use_page_unit = "NO_USEPAGEUNIT",
    length_along_line = "685 Feet", length_perpendicular_to_line = "420 Feet",
    page_orientation = "HORIZONTAL", overlap_percentage = 0,
    starting_page_number = 1, direction_type = "WE_NS")`;

export const LAYER_FIELD_SNIPPET = `// power, from a Placement field holding UG or OH
"PWR-" + $feature.Placement + "-E"                    -> PWR-UG-E / PWR-OH-E
// fiber, from Placement (Aerial / UG) and Status (Proposed / Existing)
"FBR-" + IIf($feature.Placement == "Aerial", "AER", "UG")
       + IIf($feature.Status == "Existing", "-E", "-P")
// handhole points: Layer = "FBR-HH-P", RefName = "HH-PROP-17X30"`;

export const CAD_FIELDS = [
  { field: 'Layer', type: 'Text', drives: 'The CAD layer the feature lands on (the important one — use Appendix A names)' },
  { field: 'RefName', type: 'Text', drives: 'For point features: the symbol block to insert (Appendix B names)' },
  { field: 'Color / Linetype / LineWt', type: 'Short / Text / Short', drives: 'Overrides. Normally leave empty so the layer decides.' },
];

export const IMAGERY_RUN = [
  'In ArcGIS Pro make a map that shows ONLY the imagery (e.g. "Imagery"), in the drawing CRS: Map Properties → Coordinate Systems → EPSG 3566',
  'Python window → Load Code… → ArcGIS\\SENAWAVE-SheetImagery.py',
  'sheet_imagery("Imagery", "SheetIndex", r"<Project>\\xref\\imagery", epsg=3566) — optional: map_scale=750, gsd=0.25 (ft/px), margin_ft=10, pad_in=0.6, only=[3, 4], fmt="JPEG", overwrite=True, dry_run=True',
  'BricsCAD, Model tab: IMAGEATTACH each PLAN-nn.png in World UCS from its world file; base layer, DRAWORDER Back, Fade 40–60. Credits text once per sheet in paper space on TB-TEXT (e.g. 0.60, 2.20, height 0.07"). Fade, never transparency.',
];

export const PER_SHEET_RECIPE = [
  'Open layout PLAN-nn',
  'Double-click inside the viewport (or MSPACE)',
  'UCS → Z → <Angle of polygon nn>. No Angle field: UCS → Entity → pick the polygon edge that runs along the route; if north lands at the bottom or left, UCS → Z → 180',
  'PLAN → Enter (accepts <Current UCS>)',
  "ZOOM → Window → snap the polygon's two diagonal corners",
  'ZOOM → 0.02XP — exact 1" = 50\', about the polygon centre',
  'UCS → Save → PLAN-nn so you can come back to label',
  'PSPACE. Clip — skip if CellFt is 685: make G-VPORT current, RECTANG <ClipX0>,2.10 <ClipX1>,10.50, VPCLIP → pick the viewport → pick the rectangle',
  'Matchlines and their labels (6.4)',
  'Select the viewport → Properties → Display locked = Yes',
];

export const SYSVARS = [
  { variable: 'UCSVP', value: '1 (default)', why: 'Each viewport keeps its own UCS — one rotation per sheet.' },
  { variable: 'UCSFOLLOW', value: '0 (default)', why: 'If on, every UCS change zooms to extents and destroys the scale.' },
  { variable: 'SNAPANG', value: 'the UCS angle', why: 'Aligns crosshairs to the rotated view. Reset to 0 afterwards.' },
  { variable: 'PSLTSCALE / LTSCALE', value: '1 / 1', why: 'Paper-inch linetypes. Checked by SENALTCHECK.' },
  { variable: 'FILLMODE', value: '1', why: 'Solid fills (handholes, key map highlight) draw hollow at 0.' },
];

export const TEXT_HEIGHTS = [
  { use: 'Matchline label', paper: '0.14"', model: '7.0 ft' },
  { use: 'Street names', paper: '0.12"', model: '6.0 ft' },
  { use: 'Construction callouts, station tags', paper: '0.10"', model: '5.0 ft' },
  { use: 'Dimensions, leader text', paper: '0.08"', model: '4.0 ft' },
  { use: 'Minor labels (addresses)', paper: '0.07"', model: '3.5 ft' },
  { use: 'Paper-space notes, titleblock values', paper: '0.10–0.12"', model: '—' },
];

export const TEXT_RULES = [
  'Model-space text height = plotted inches × 50 (feet); paper-space text height = plotted inches.',
  'Below 0.07" becomes unreadable once someone prints 11×17 down to letter size.',
  'TrueType fonts plot about 30% smaller than SHX at the same height — check the PDF, not the Properties panel.',
  'Restore the sheet\'s UCS (UCS → Named → PLAN-nn), then place TEXT, MTEXT, leaders and dimensions at rotation 0. Re-create dimensions rather than ROTATE them.',
];

export const MATCHLINE_RULES = [
  'With edge-to-edge sheets the clipped viewport border is the matchline. Everything here is in paper space.',
  'On each border that has a neighbour (MatchL/R/T/B) draw a polyline on G-MATCH along that clip edge.',
  'Label it just inside the border, parallel to it: MATCHLINE – SEE SHEET 5, paper-space text 0.14" high. Left and right border labels are rotated 90°.',
  'A border can meet two sheets (at a corner): give each stretch its own label.',
  "Check the pairs agree: if sheet 4's right border says SEE SHEET 5, sheet 5 has a matchline back to 4.",
  'The clip boundary must stay on a layer that is ON (G-VPORT, on, no-plot). Never turn G-VPORT off — it blanks every clipped sheet.',
  'Lock last: rotate → scale → centre → clip → lock. To adjust a finished sheet: unlock, fix, re-lock.',
];

export const KEYMAP_SETTINGS = [
  { setting: '*ss-key-frame*', values: 'Auto (default) | Fit | Window', effect: 'Fit squeezes the whole index into the cell; Window holds a fixed scale and centres on this sheet (UDOT style). Auto uses Fit until a rectangle would draw shorter than 0.30".' },
  { setting: '*ss-key-hlmode*', values: 'Auto | Fill | Bold | None', effect: 'How "you are here" is marked. Auto = filled, or bold once a basemap is behind it.' },
  { setting: '*ss-key-xref*', values: '"SheetIndex"', effect: 'Name of the xref/block holding the rectangles.' },
];

export const TITLEBLOCK_RULES = [
  'Layout PLAN-nn ↔ PageNumber nn. Keep this absolute; matchlines and key maps depend on it.',
  'Project-wide fields (name, location, number, engineer, PM, design/field dates) go in once with SENATITLE, which writes every TB_11X17. Enter keeps the current value; a single "." blanks it. SENAPLOTDATE stamps today into PLOT_DATE.',
  'Per-sheet fields are not touched by SENATITLE — edit them on each layout: SHEET_TITLE, SHEET_NAME, SCALE, COMPANY.',
  'SCALE on plan sheets reads 1" = 50\'. The template placeholder "1:50" is wrong — replace it.',
  'Fill the total sheet count last, once notes and details are final.',
  'NOTES04-3 carries an embedded object from the source set — check it on the first plot.',
  'Plot the whole set to PDF (PUBLISH, device Print As PDF, page setup SENAWAVE-11X17) and page through it. Route continuity across matchlines is the fastest way to spot a mis-set viewport.',
];

export interface QcItem {
  id: string;
  group: string;
  label: string;
}

// Guide section 11
export const QC_CHECKLIST: QcItem[] = [
  { id: 'setup-units', group: 'Setup', label: 'SENAUNITS reports every layout ok; SENALTCHECK reports LTSCALE 1 and 0 linetypes missing.' },
  { id: 'setup-title', group: 'Setup', label: 'Titleblock project fields identical on every sheet (SENATITLE, spot-check three).' },
  { id: 'plan-scale', group: 'Plan sheets', label: 'Every PLAN viewport: Custom scale 0.02, Display locked = Yes.' },
  { id: 'plan-route-middle', group: 'Plan sheets', label: 'The route runs through the middle of every sheet and never touches the top or bottom of the viewport.' },
  { id: 'plan-matchlines', group: 'Plan sheets', label: 'Every border that meets another sheet carries a matchline and a SEE SHEET label, and the pairs agree in both directions.' },
  { id: 'plan-no-overlap', group: 'Plan sheets', label: 'No stretch of route is drawn on two sheets, and none is missing between sheets.' },
  { id: 'plan-text', group: 'Plan sheets', label: 'No text on any sheet is upside down or crooked; text meets the heights in 6.5.' },
  { id: 'plan-grid', group: 'Plan sheets', label: 'TB-GRID rectangles do not appear on the PDF. No clipped viewport plots blank.' },
  { id: 'plan-codes', group: 'Plan sheets', label: 'Existing utilities show their letter codes on the PDF; proposed fiber is the top linework.' },
  { id: 'plan-numbers', group: 'Plan sheets', label: 'Sheet numbers run 1…N with no gaps and the key maps agree.' },
  { id: 'side-legend', group: 'Side panel and vicinity', label: 'The legend lists every linetype and symbol on the sheets and nothing else; swatches show dashes and letters, not solid lines (SENALEGDIAG).' },
  { id: 'side-keymap', group: 'Side panel and vicinity', label: 'Each key map marks its own sheet and only that one; numbers match the layout names.' },
  { id: 'side-north', group: 'Side panel and vicinity', label: 'North arrow correct on a rotated sheet — check one 90° sheet by eye.' },
  { id: 'side-basemaps', group: 'Side panel and vicinity', label: 'Both basemaps visible, faded and behind the linework. Nothing from the key map shows in a plan viewport.' },
  { id: 'side-placeholder', group: 'Side panel and vicinity', label: 'No placeholder text (PROJECT NAME, 26-0000, ---) anywhere in the PDF.' },
  { id: 'side-greyscale', group: 'Side panel and vicinity', label: 'Print one sheet in greyscale: every utility is still identifiable.' },
];

export const QC_GROUPS = [...new Set(QC_CHECKLIST.map((q) => q.group))];

export const TROUBLESHOOTING = [
  { symptom: 'A copied or new layout is the wrong size; titleblock does not match the paper.', fix: 'The page setup names a paper your printer does not have, so BricsCAD substituted a default (often metric). Section 2.2: SENAUNITS → SENAPAPER → SENATRY → SENAUNITSFIX.' },
  { symptom: 'Something is 25.4× out.', fix: 'Inches vs millimetres — always the page setup. 12× is feet vs inches (INSUNITS). 304.8× is both.' },
  { symptom: 'Sheet sits off-centre on the paper; ~1" spare on two sides.', fix: 'Paper margins. Pick a paper whose margins are .05" or less with SENAPAPER / SENATRY. If re-applying does not move it back, delete the layout and copy a good one.' },
  { symptom: 'Dashed lines read solid, or letter codes are missing everywhere.', fix: 'LTSCALE is not 1, or the SW_* linetypes are missing. SENALTCHECK → SENALT → SENACOLOR → REGENALL. (Missing only on very short segments is normal — 2.3.)' },
  { symptom: 'Linetypes look right on a layout but wrong on the Model tab.', fix: 'The Model tab\'s CANNOSCALE is not 1" = 50\' — it is stored per tab. SENALT sets it; or set it with the annotation scale control on the Model tab.' },
  { symptom: 'SENALT loads no linetypes at all.', fix: 'The .lin file was not found or not read. Check the path SENALT prints; the file must keep Windows (CRLF) line endings — do not re-save it in an editor that changes them.' },
  { symptom: 'Legend swatches are solid though the sheet dashes are fine.', fix: 'TB_LEGEND was built with an older swatch length. SENALEGDIAG confirms ("STALE"); re-run SENALEGEND and SENAVICINITY.' },
  { symptom: 'An edited symbol still shows the old artwork.', fix: 'SENAWAVELOAD never overwrites an existing block. Erase the inserts → -PURGE → Blocks → <name> → SENAWAVELOAD. SENALEGSYM shows which block the legend is really using.' },
  { symptom: 'Fills missing everywhere — handholes, key map highlight.', fix: 'FILLMODE is 0. Set it to 1 and REGENALL.' },
  { symptom: 'A whole plan viewport plots blank; other sheets are fine.', fix: 'Its VPCLIP boundary is on a layer that is off or frozen. Turn that layer on, move the boundary to G-VPORT.' },
  { symptom: 'North arrows all point the same way / key map sheets unmatched.', fix: 'SENANORTH / SENAKEYMAP ran before the sheets were aligned. Align, then re-run — they replace rather than add.' },
  { symptom: 'Key map rectangles microscopic.', fix: 'Fit framing on a long corridor. Set *ss-key-frame* to "Window" (or "Auto") and re-run SENAKEYMAP.' },
  { symptom: 'SENACLIP skips a sheet: "view centre is on no polygon".', fix: 'That sheet is not aligned yet, or the view was panned off its polygon. Redo 6.2 steps 1–7 for it, then SENACLIP → Current.' },
  { symptom: 'A matchline label says SEE SHEET ??.', fix: 'The neighbouring polygon has no PLAN layout (or that sheet is not aligned). Add or align the layout, then re-run SENACLIP.' },
  { symptom: 'Key map or vicinity map says no rectangles.', fix: 'The xref is not named SheetIndex. Rename it in the Attachments panel or change *ss-key-xref*.' },
  { symptom: 'Basemap attached, right place, but invisible.', fix: 'The image came in at zero size. SENAIMGFIX re-sizes what is attached.' },
  { symptom: 'Vicinity map empty, key maps fine.', fix: 'KEYMAP-VICINITY.tif missing because SENAKEYWIN ran before SENAVICINITY. Re-run SENAKEYWIN and the ArcGIS script, then SENAIMG.' },
  { symptom: 'PUBLISH produces blank white tiles.', fix: 'Transparency inside a viewport. Remove it; use image Fade.' },
  { symptom: 'An xref vanishes after XATTACH.', fix: 'It was attached under a rotated UCS. UCS World and re-attach.' },
  { symptom: 'Strip-map pages 20–40° off the street.', fix: 'Strip Map follows the local trend of the line. Use SENAWAVE-SheetIndex.py on a street grid (4.3).' },
  { symptom: 'A clipped viewport shows the wrong stretch, or the clip cuts through the polygon.', fix: 'The view was not centred on the polygon before clipping, or the ClipX values came from another sheet. Unlock, VPCLIP → Delete, redo 6.2 steps 5–8.' },
  { symptom: 'A polygon measures 5040 ft across.', fix: 'Inch-unit seed. Re-export with ArcGIS\\SENAWAVE-ARCGIS-SEED.dwg; never scale the geometry.' },
  { symptom: 'Aerial imagery offset a few feet from the linework.', fix: 'Basemap registration drift. Measure the offset with DIST, MOVE the images by it (or correct the world files and re-attach).' },
  { symptom: 'A titleblock arrives with no editable attributes.', fix: 'The block was inserted by a script that does not create attributes. Select the titleblock on a good sheet, COPYCLIP, then PASTEORIG on this sheet, and delete the bad one.' },
];

export interface CommandRow {
  command: string;
  file: string;
  what: string;
}

export const COMMANDS: CommandRow[] = [
  { command: 'SENAUNITS', file: 'SENAUNITS', what: "Report every layout's page setup and the unit/linetype header settings. Changes nothing." },
  { command: 'SENAPAPER', file: 'SENAUNITS', what: 'List every paper on the device that measures 17 × 11, with margins and orientation.' },
  { command: 'SENATRY', file: 'SENAUNITS', what: 'Apply one of those papers to the current layout only.' },
  { command: 'SENAUNITSFIX', file: 'SENAUNITS', what: 'Apply the paper to every layout; set INSUNITS, MEASUREMENT, PSLTSCALE 1, LTSCALE 1.' },
  { command: 'SENAUNITSUNDO', file: 'SENAUNITS', what: 'Undo SENATRY / SENAUNITSFIX (this session only).' },
  { command: 'SENAMEDIA', file: 'SENAUNITS', what: 'Raw list of devices and paper names.' },
  { command: 'SENALT', file: 'SENALTYPE', what: 'Create text style SENA-LT, load the SW_* linetypes, set PSLTSCALE/MSLTSCALE/LTSCALE 1 and CANNOSCALE 1" = 50\'.' },
  { command: 'SENACOLOR', file: 'SENALTYPE', what: 'Apply colour, linetype and lineweight to the utility and base layers (Appendix A).' },
  { command: 'SENALTCHECK', file: 'SENALTYPE', what: 'Report the linetype settings. Changes nothing.' },
  { command: 'SENALTDIAG', file: 'SENALTYPE', what: 'Pick a line: prints what one pattern cycle measures on paper and on the Model tab.' },
  { command: 'SENASIDE', file: 'SENASIDE', what: 'Whole side panel on every PLAN sheet (the next four in order).' },
  { command: 'SENASIDECLEAN', file: 'SENASIDE', what: 'Strip placeholder text out of TB_SIDEPANEL.' },
  { command: 'SENALEGEND', file: 'SENASIDE', what: 'Build TB_LEGEND and place it on every PLAN sheet.' },
  { command: 'SENAKEYMAP', file: 'SENASIDE', what: 'Key map in paper space on every PLAN sheet.' },
  { command: 'SENANORTH', file: 'SENASIDE', what: 'North arrow on every PLAN sheet at −θ.' },
  { command: 'SENALEGDIAG', file: 'SENASIDE', what: "Check every legend row's swatch against its linetype; flags a stale TB_LEGEND." },
  { command: 'SENALEGSYM', file: 'SENASIDE', what: 'Report legend symbol rows and placed blocks the legend does not list.' },
  { command: 'SENALEGWIPE', file: 'SENASIDE', what: 'Delete TB_LEGEND and TB_VICINITY everywhere, for a clean rebuild.' },
  { command: 'SENAKEYWIN', file: 'SENASIDE', what: 'Write keymap-windows.csv for SENAWAVE-KeyMapBasemap.py.' },
  { command: 'SENAKEYIMG', file: 'SENASIDE', what: 'Attach the basemap behind every key map.' },
  { command: 'SENAKEYIMGCLEAN', file: 'SENASIDE', what: 'Remove those pictures.' },
  { command: 'SENAKEYCLEAN', file: 'SENASIDE', what: 'Remove a model-space key map left by an old version (SENAKEYMAP calls it).' },
  { command: 'SENAVICINITY', file: 'SENAVICINITY', what: 'Build or rebuild the VICINITY sheet.' },
  { command: 'SENAVICCLEAN', file: 'SENAVICINITY', what: 'Empty the VICINITY sheet, keep the layout.' },
  { command: 'SENAVICIMG', file: 'SENAVICINITY', what: 'Attach KEYMAP-VICINITY.tif behind the vicinity map.' },
  { command: 'SENAIMG', file: 'SENAVICINITY', what: 'Both basemaps in one go.' },
  { command: 'SENAIMGFIX', file: 'SENAVICINITY', what: 'Re-size basemap pictures that are attached but invisible.' },
  { command: 'SENACLIP', file: 'SENACLIP', what: 'Clip every aligned PLAN viewport to its index polygon; matchlines + SEE SHEET labels on G-MATCH; lock.' },
  { command: 'SENACLIPCLEAN', file: 'SENACLIP', what: 'Remove the clips, matchlines and labels SENACLIP made.' },
  { command: 'SENATITLE', file: 'SENATITLE', what: 'Project titleblock fields on every sheet.' },
  { command: 'SENAPLOTDATE', file: 'SENATITLE', what: "Today's date into PLOT_DATE on every sheet." },
  { command: 'SENAWAVELOAD', file: 'SENAWAVELOAD', what: 'Load the symbol library into a drawing that lacks it. Never overwrites existing blocks.' },
  { command: 'PT2BLK', file: 'PT2BLK', what: "Replace CAD points with a symbol block, on the point's layer." },
  { command: 'SENAMIGRATE', file: 'SENAMIGRATE', what: 'Rename old / SW-* layers to the standard. Follow with SENALT + SENACOLOR.' },
];

export const RETIRED_COMMANDS = [
  { command: 'SENALTS', replacedBy: 'Set LTSCALE 0.25 for the old stock linetypes, which breaks the SW_* codes. Now only points you to SENALTCHECK / SENALT.' },
  { command: 'SENAKEYPREP', replacedBy: 'Kept as an alias of SENAKEYMAP.' },
  { command: 'SENAHHFIX.lsp', replacedBy: 'Rebuilt the handholes as plain rectangles — it would undo the current boxed "HH" symbol. Archived.' },
  { command: 'SENWAVELOAD / SENALOAD / KRADOLOAD', replacedBy: 'Old spellings of SENAWAVELOAD (the first two still work).' },
];

export const MAINTAIN = [
  { element: 'Legend rows (both legends)', livesIn: 'SENASIDE.lsp *ss-legend-rows* / *ss-legend-syms*', copiedBy: 'SENALEGEND + SENAVICINITY' },
  { element: 'Side panel / vicinity cell geometry', livesIn: 'Config blocks at the top of SENASIDE.lsp and SENAVICINITY.lsp — separate', copiedBy: 'SENASIDE / SENAVICINITY' },
  { element: 'Symbol blocks', livesIn: 'SENAWAVE-FIBER-SYMBOLS.dxf and the template', copiedBy: 'Template (new projects), SENAWAVELOAD (old drawings — only missing blocks)' },
  { element: 'Linetype definitions', livesIn: 'SENAWAVE-PAPER.lin', copiedBy: 'SENALT — skips names already in the drawing' },
  { element: 'Layer colour / linetype / lineweight', livesIn: 'SENALTYPE.lsp *sl-layers*', copiedBy: 'SENACOLOR' },
  { element: 'Annotation scale 1" = 50\', CANNOSCALE, LTSCALE', livesIn: 'The drawing (CANNOSCALE per tab)', copiedBy: 'SENALT' },
  { element: 'Page setup', livesIn: 'The drawing', copiedBy: 'SENAUNITSFIX; named setup SENAWAVE-11X17' },
];

export const MAINTAIN_RULES = [
  'Changing a symbol: edit it in the template AND in SENAWAVE-FIBER-SYMBOLS.dxf, and in any live project drawing (erase inserts → -PURGE → SENAWAVELOAD). A fix made in one of the three places fixes only that one.',
  'Changing a linetype: add it under a new name in SENAWAVE-PAPER.lin (keep CRLF line endings), add the name to *sl-ltypes*, point the layer at it in *sl-layers*, run SENALT + SENACOLOR. Re-loading a changed pattern under an existing name is unreliable.',
  'Changing the template: OPEN the .dwt (not NEW), make the change, run SENAUNITS and SENALTCHECK, SAVEAS the same name — after copying the previous .dwt into Archive\\<date>\\. PURGE carefully: SW_SIDEWALK, SW_DRIVEWAY, SW_DASH, SW_PHANTOM and SW_DOT are not used by a layer and PURGE All deletes them (SENALT restores them).',
  'Changing this guide: update the revision and date on page 1, keep it the only procedure document, and archive the previous revision.',
  'Folder paths are never hard-coded in the procedure — the scripts find their files on the support path. If you move the folder, only the BricsCAD support path needs updating.',
];

export interface LayerRow {
  layer: string;
  rgb: string; // "255,102,0" or "Template"
  linetype: string;
  lw: string;
  use: string;
  group: 'Proposed fiber' | 'Existing fiber' | 'Existing utilities' | 'Survey base' | 'Sheet & titleblock';
}

export const LAYERS: LayerRow[] = [
  { layer: 'FBR-UG-P', rgb: '255,102,0', linetype: 'Continuous', lw: '0.50', use: 'Proposed underground fiber / conduit', group: 'Proposed fiber' },
  { layer: 'FBR-BORE-P', rgb: '255,102,0', linetype: 'SW_FIBER_BORE', lw: '0.50', use: 'Proposed directional bore', group: 'Proposed fiber' },
  { layer: 'FBR-AER-P', rgb: '255,102,0', linetype: 'SW_FIBER_AER', lw: '0.50', use: 'Proposed aerial fiber', group: 'Proposed fiber' },
  { layer: 'FBR-DROP-P', rgb: '255,102,0', linetype: 'SW_FIBER_DROP', lw: '0.25', use: 'Proposed service drop', group: 'Proposed fiber' },
  { layer: 'FBR-HH-P', rgb: 'Template', linetype: '', lw: '', use: 'Proposed handhole symbol', group: 'Proposed fiber' },
  { layer: 'FBR-STR-P', rgb: 'Template', linetype: '', lw: '', use: 'Proposed structure: ped, cabinet, splice, slack, MST, bore pit, drop box, manhole', group: 'Proposed fiber' },
  { layer: 'FBR-LBL', rgb: 'Template', linetype: '', lw: '', use: 'Fiber labels and callouts', group: 'Proposed fiber' },
  { layer: 'FBR-UG-E', rgb: '191,95,0', linetype: 'SW_FO (FO)', lw: '0.13', use: 'Existing underground fiber', group: 'Existing fiber' },
  { layer: 'FBR-AER-E / FBR-STR-E', rgb: 'Template', linetype: '', lw: '', use: 'Existing aerial fiber / existing structures', group: 'Existing fiber' },
  { layer: 'PWR-UG-E', rgb: '204,0,0', linetype: 'SW_POWER (E)', lw: '0.13', use: 'Existing buried power — conflict with buried fiber', group: 'Existing utilities' },
  { layer: 'PWR-OH-E', rgb: '204,0,0', linetype: 'SW_OHP (OH)', lw: '0.13', use: 'Existing overhead power', group: 'Existing utilities' },
  { layer: 'PWR-POLE-E', rgb: 'Template', linetype: '', lw: '', use: 'Poles, towers, guys, streetlights', group: 'Existing utilities' },
  { layer: 'COM-UG-E', rgb: '128,64,0', linetype: 'SW_COMM (T)', lw: '0.13', use: 'Existing buried comm / telephone', group: 'Existing utilities' },
  { layer: 'COM-OH-E', rgb: '128,64,0', linetype: 'SW_OHP (OH)', lw: '0.13', use: 'Existing overhead comm', group: 'Existing utilities' },
  { layer: 'GAS-UG-E', rgb: '191,143,0', linetype: 'SW_GAS (G)', lw: '0.13', use: 'Existing gas', group: 'Existing utilities' },
  { layer: 'WAT-UG-E', rgb: '0,102,204', linetype: 'SW_WATER (W)', lw: '0.13', use: 'Existing water', group: 'Existing utilities' },
  { layer: 'SAN-UG-E', rgb: '0,140,70', linetype: 'SW_SEWER (S)', lw: '0.13', use: 'Existing sanitary sewer', group: 'Existing utilities' },
  { layer: 'STM-UG-E', rgb: '0,176,176', linetype: 'SW_STORM (ST)', lw: '0.13', use: 'Existing storm drain', group: 'Existing utilities' },
  { layer: 'IRR-UG-E', rgb: '153,0,204', linetype: 'SW_IRR (IR)', lw: '0.13', use: 'Existing irrigation', group: 'Existing utilities' },
  { layer: 'MSC-E', rgb: 'Template', linetype: '', lw: '', use: 'Signs, signals, RR crossing arms', group: 'Existing utilities' },
  { layer: 'V-ROW', rgb: '128,128,128', linetype: 'SW_RW (R/W)', lw: '0.18', use: 'Right of way', group: 'Survey base' },
  { layer: 'V-PARCEL', rgb: '160,160,160', linetype: 'SW_DASHFINE', lw: '0.09', use: 'Parcel lines', group: 'Survey base' },
  { layer: 'V-ROAD', rgb: '80,80,80', linetype: 'Continuous', lw: '0.25', use: 'Edge of pavement / back of curb', group: 'Survey base' },
  { layer: 'V-ROAD-CL', rgb: '128,128,128', linetype: 'SW_CENTER', lw: '0.13', use: 'Road centreline', group: 'Survey base' },
  { layer: 'V-WALK', rgb: '128,128,128', linetype: 'Continuous', lw: '0.13', use: 'Sidewalk', group: 'Survey base' },
  { layer: 'V-BLDG', rgb: '80,80,80', linetype: 'Continuous', lw: '0.20', use: 'Buildings', group: 'Survey base' },
  { layer: 'V-FENCE', rgb: '128,128,128', linetype: 'SW_FENCEX', lw: '0.13', use: 'Fence', group: 'Survey base' },
  { layer: 'V-RAIL', rgb: '80,80,80', linetype: 'SW_RAIL', lw: '0.20', use: 'Railroad', group: 'Survey base' },
  { layer: 'V-VEG / V-ANNO', rgb: 'Template', linetype: '', lw: '', use: 'Trees / base annotation', group: 'Survey base' },
  { layer: 'TB-BORDER, TB-TEXT, TB-ATTR, TB-GRID', rgb: 'Template', linetype: '', lw: '', use: 'Titleblock; TB-GRID = sheet index polygons (no-plot)', group: 'Sheet & titleblock' },
  { layer: 'G-VPORT', rgb: 'Template', linetype: '', lw: '', use: 'Viewports and clip boundaries — ON, no-plot', group: 'Sheet & titleblock' },
  { layer: 'G-MATCH / G-KEYNOTE', rgb: 'Template', linetype: '', lw: '', use: 'Matchlines / keynotes and leaders', group: 'Sheet & titleblock' },
  { layer: 'G-KEYMAP, G-KEYMAP-TXT, KM-HL, TB-KEYMAP-IMG', rgb: 'made by SENASIDE', linetype: '', lw: '', use: 'Key map linework, numbers, highlight, basemap picture', group: 'Sheet & titleblock' },
  { layer: 'DETAIL-LINEWORK / -TEXT / -FILL', rgb: 'Template', linetype: '', lw: '', use: 'Notes and detail sheets', group: 'Sheet & titleblock' },
];

export const LAYER_NAMING =
  'Names follow UTILITY-PLACEMENT-STATUS: FBR fiber, PWR power, COM third-party comm, GAS, WAT water, SAN sanitary, STM storm, IRR irrigation, MSC misc; UG underground, OH/AER overhead/aerial, BORE, DROP, POLE, HH handhole, STR structure; P proposed, E existing. V- = survey base, TB- = titleblock, G- = general sheet. Placement is its own field because buried power conflicts with a buried fiber trench and overhead power does not. Proposed fiber carries no letter code: it is identified by its heavier weight and colour, so it can never read as an existing utility.';

export const SYMBOLS = [
  { blocks: 'HH-PROP-17X30, HH-PROP-24X36', layer: 'FBR-HH-P', note: 'both draw the same boxed "HH"; call out the size in a plan label' },
  { blocks: 'MANHOLE-AIO, PED, CABINET-BOX, CABINET-CIRC, DROP-BOX, BORE-PIT, SPLICE, SLACK-LOOP, SLACK-LOOP-50, MST-CALLOUT', layer: 'FBR-STR-P', note: '' },
  { blocks: 'HH-EXIST', layer: 'FBR-STR-E', note: '' },
  { blocks: 'POWER-POLE, DOWN-GUY, TOWER, STREET-LIGHT, GROUND-ROD', layer: 'PWR-POLE-E', note: '' },
  { blocks: 'XFMR', layer: 'PWR-UG-E', note: '' },
  { blocks: 'FIRE-HYDRANT, WATER-VALVE, WATER-METER', layer: 'WAT-UG-E', note: '' },
  { blocks: 'GAS-VALVE', layer: 'GAS-UG-E', note: '' },
  { blocks: 'CATCH-BASIN, CULVERT', layer: 'STM-UG-E', note: '' },
  { blocks: 'IRRIGATION', layer: 'IRR-UG-E', note: '' },
  { blocks: 'SIGN, TRAFFIC-SIGNAL, RR-CROSSING-ARM', layer: 'MSC-E', note: '' },
  { blocks: 'TREE', layer: 'V-VEG', note: '' },
];

export const SYMBOL_RULES =
  'Drawn in feet, insert at scale 1 for 1" = 50\' (for another plot scale, scale = target feet-per-inch ÷ 50). Symbol linework is forced Continuous and BYLAYER, so each symbol takes its layer\'s colour. Place them with INSERT or PT2BLK.';

export const MIGRATION = [
  { old: 'ELEC-POWER', std: 'PWR-POLE-E' },
  { old: 'FBR-HANDHOLE', std: 'FBR-HH-P' },
  { old: 'FBR-STRUCT', std: 'FBR-STR-P' },
  { old: 'FBR-ROUTE-PROP', std: 'FBR-UG-P' },
  { old: 'FBR-ROUTE-EXIST', std: 'FBR-UG-E' },
  { old: 'FBR-CONDUIT', std: 'FBR-UG-P' },
  { old: 'FBR-BORE', std: 'FBR-BORE-P' },
  { old: 'FBR-AERIAL', std: 'FBR-AER-P' },
  { old: 'FBR-DROP', std: 'FBR-DROP-P' },
  { old: 'GAS', std: 'GAS-UG-E' },
  { old: 'WATER', std: 'WAT-UG-E' },
  { old: 'STORM', std: 'STM-UG-E' },
  { old: 'IRRIGATION', std: 'IRR-UG-E' },
  { old: 'STRUCT-MISC', std: 'MSC-E' },
  { old: 'VEG-TREE', std: 'V-VEG' },
  { old: 'SYM-LABEL', std: 'FBR-LBL' },
  { old: 'SW-FIBER-PROP', std: 'FBR-UG-P' },
  { old: 'SW-HH-PROP', std: 'FBR-HH-P' },
  { old: 'SW-POWER-DISTRIBUTION', std: 'PWR-OH-E (verify)' },
  { old: 'SW-POWER-TRANSMISSION', std: 'PWR-OH-E (verify)' },
  { old: 'SW-POWER-POLES', std: 'PWR-POLE-E' },
  { old: 'SW-POWER-SUBSTATIONS', std: 'PWR-POLE-E' },
  { old: 'SW-RAILROAD', std: 'V-RAIL' },
  { old: 'SW-ROAD-CL', std: 'V-ROAD-CL' },
  { old: 'SW-ROAD-EDGE', std: 'V-ROAD' },
  { old: 'SW-ROW', std: 'V-ROW' },
  { old: 'SW-PARCELS', std: 'V-PARCEL' },
  { old: 'SW-SIDEWALK', std: 'V-WALK' },
  { old: 'SW-BUILDING-FOOTPRINTS', std: 'V-BLDG' },
  { old: 'SW-FENCE', std: 'V-FENCE' },
  { old: 'SW-TREES', std: 'V-VEG' },
  { old: 'SW-ANNO', std: 'V-ANNO' },
  { old: 'SW-REF', std: 'V-ANNO' },
  { old: 'SW-SHEET-INDEX', std: 'V-ANNO' },
];

export const LINETYPE_NOTES = [
  'Existing utilities are drawn with letter-coded linetypes — ---- G ---- G ---- for gas — so a black-and-white print still says what each line is. They come from SENAWAVE-PAPER.lin and are all named SW_*.',
  'The patterns are measured in paper inches. With PSLTSCALE = 1 and LTSCALE = 1 a coded pattern repeats every 0.66" on paper at any viewport scale.',
  'The Model tab matches only when its annotation scale (CANNOSCALE) is 1" = 50\'. CANNOSCALE is stored per tab, so set it on the Model tab itself. SENALT does this for you.',
  'A line shorter than one pattern cycle draws solid. At 1" = 50\' one cycle is about 33 ft of ground, so a short stub shows as a plain dash with no letter. That is expected.',
  'Never "fix" dashes by changing LTSCALE. Layer colours are chosen to stay distinguishable in greyscale. SENACOLOR applies them (Appendix A).',
];

/** Sheets needed for a straight run: run length ÷ 685, rounded up (guide 4.3). */
export function sheetsForRun(lengthFt: number): number {
  if (!Number.isFinite(lengthFt) || lengthFt <= 0) return 0;
  return Math.ceil(lengthFt / SHEET_MAX_ALONG_FT);
}

/** Even cell length along a run once the sheet count is known (guide: even=True). */
export function evenCellFt(lengthFt: number): number {
  const n = sheetsForRun(lengthFt);
  return n === 0 ? 0 : lengthFt / n;
}

/** Paper X extents of the clip rectangle for a cell shorter than 685 ft, centred in the viewport. */
export function clipExtents(cellFt: number): { x0: number; x1: number } {
  const widthIn = Math.min(cellFt, SHEET_MAX_ALONG_FT) * ZOOM_XP;
  const centre = 7.35;
  return { x0: +(centre - widthIn / 2).toFixed(2), x1: +(centre + widthIn / 2).toFixed(2) };
}

/** Model-space text height (ft) for a plotted height in inches at 1" = 50'. */
export function modelTextHeightFt(paperIn: number): number {
  return +(paperIn * FT_PER_INCH).toFixed(2);
}
