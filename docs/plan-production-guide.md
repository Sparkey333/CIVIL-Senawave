# SENAWAVE Plan Production Guide — Rev 5 (28 September 2026)

> Markdown transcription of `docs/source/SENAWAVE-Plan-Production-Guide-Rev5.docx` (BricsCAD V24+ / ArcGIS Pro 3.x) so it can be searched and diffed in the repo. The .docx stays the authoritative copy; the tables are also encoded in `src/data/guide.ts` for the app's Reference pages.

From an ArcGIS route to a plotted 11×17 plan set, in BricsCAD
Rev 5 · 28 September 2026 · BricsCAD V24+ / ArcGIS Pro 3.x
This is the only document you need. It replaces the Rev 4 guide, the Layer Standard, the Symbol Guide and every README that used to sit beside the template. The layer table, the symbol library and the GIS→CAD translation map are now the appendices at the back. Superseded material is in Templates\Archive\ for history only — nothing in there is current.

```text
If you read nothing else
Model space is in FEET. Paper space is in INCHES. The bridge is ZOOM 0.02XP — 0.02 paper inches per model foot = 1" = 50'.
A sheet's size on paper is set by the page setup's PAPER UNITS, never by INSUNITS. Anything 25.4× wrong is the page setup; 12× wrong is INSUNITS.
LTSCALE is always 1. The SW_* linetypes are drawn in paper inches. If dashes look wrong, run SENALTCHECK — do not touch LTSCALE.
Run SENAUNITS and SENALTCHECK on every drawing you open. Both only report; they take two seconds.
```


## Contents

| Section | What it covers |
|---|---|
| 1  Start here | What is in the folder, one-time BricsCAD setup, the whole job on one page. |
| 2  Start a project drawing | New drawing from the template, project folder, the day-one health check, how linetypes work. |
| 3  The numbers | Template constants and the paper coordinates of every cell. |
| 4  ArcGIS — sheet index and data | Edge-to-edge sheet index (SheetIndex.py, by hand, Strip Map), QC, Export To CAD, the Layer field. |
| 5  BricsCAD — bring the data in | Attach the index, bind the utilities, symbols, aerial imagery, draw order. |
| 6  Cut and align the plan sheets | Copy layouts, the per-sheet UCS recipe, matchlines, annotation and text heights. |
| 7  The side panel | Legend, key map, north arrow — SENASIDE. |
| 8  The VICINITY sheet | SENAVICINITY. |
| 9  Basemaps behind the key maps | SENAKEYWIN → ArcGIS → SENAIMG. |
| 10 Titleblocks and plotting | SENATITLE, per-sheet fields, the final PDF. |
| 11 QC checklist | Everything to check before a set leaves. |
| 12 Troubleshooting | Symptom → cause → fix. Every row happened on a real job. |
| 13 Command reference | Every command, which file it is in, what it does. |
| 14 Maintaining the package | Where each part of the standard lives and how to change it safely. |
| Appendix A–C | Layer standard · symbol library · old-layer translation map. |


# 1.  Start here
## 1.1  What is in the Templates folder

```text
Templates\
  SENAWAVE-Plan-Production-Guide.docx   this guide
  SENAWAVE-11x17-TEMPLATE.dwt           start every project drawing from this
  Support\                              add this folder to BricsCAD (1.2)
     SENAWAVE-LOADALL.lsp                 loads every command below in one go
     SENAUNITS.lsp   SENALTYPE.lsp   SENASIDE.lsp   SENAVICINITY.lsp
     SENACLIP.lsp    SENATITLE.lsp   SENAWAVELOAD.lsp   PT2BLK.lsp
     SENAMIGRATE.lsp
     SENAWAVE-PAPER.lin                   the SW_* letter-coded linetypes
     SENAWAVE-FIBER-SYMBOLS.dxf           the symbol library
     SENAWAVE-11x17-DRAWORDER.lst         layer draw order
  ArcGIS\                               run in the ArcGIS Pro Python window
     SENAWAVE-SheetIndex.py               grid-snapped sheet index
     SENAWAVE-SheetImagery.py             per-sheet aerial imagery
     SENAWAVE-KeyMapBasemap.py            pictures behind the key maps
     SENAWAVE-ARCGIS-SEED.dwg             seed file for Export To CAD
  Archive\                              old revisions - never work from here
```



| File | What it is for |
|---|---|
| SENAWAVE-11x17-TEMPLATE.dwt | The drawing template. Layouts COVER, VICINITY, PLAN-01, NOTES01–03, NOTES04-1–4, MATERIALS, DETAIL01–04. Carries the layer standard, the symbol blocks and the attributed titleblock TB_11X17. |
| SENAUNITS.lsp | Page-setup and units audit and fix. Run first, on everything. |
| SENALTYPE.lsp | Loads the SW_* linetypes, sets LTSCALE/PSLTSCALE/CANNOSCALE, applies the layer colour standard. |
| SENASIDE.lsp | The right-hand panel of every PLAN sheet: legend, key map, north arrow, key map basemap. |
| SENAVICINITY.lsp | The VICINITY sheet, and the commands that place both basemaps. Needs SENASIDE loaded first. |
| SENACLIP.lsp | Clips every PLAN viewport to its sheet index polygon and draws and labels the matchlines. Needs SENASIDE loaded first. |
| SENATITLE.lsp | Project titleblock fields on every sheet in one pass. |
| SENAWAVELOAD.lsp | Loads the symbol library into an older drawing that lacks it. |
| PT2BLK.lsp | Turns imported CAD points into symbol blocks. |
| SENAMIGRATE.lsp | Renames old or ArcGIS SW-* layers to the standard (Appendix C). |


## 1.2  Set up BricsCAD once (per computer)
- Support path. SETTINGS → Program Options → Files → Support file search path → add the Templates\Support folder. On your computer it is C:\Users\<you>\My Drive\CAD\Templates\Support or G:\My Drive\CAD\Templates\Support, depending on how Google Drive is mounted. This is what lets the scripts find the linetype file, the symbol library and each other without asking.
- Load the commands automatically. APPLOAD → Startup Suite → Add → SENAWAVE-LOADALL.lsp. Every drawing you open now has every SENA command. (For one session only: APPLOAD → select SENAWAVE-LOADALL.lsp → Load.) If BricsCAD warns about loading an untrusted file, choose Always load or add the same folder to the trusted paths.
- Check it worked. Open any drawing. The command line should end with SENAWAVE: loaded 9 of 9 files. If a file is listed as NOT loaded, the support path in step 1 is wrong.

```text
Do not work inside the template
Start projects with NEW → browse to Templates\SENAWAVE-11x17-TEMPLATE.dwt, then SAVEAS into the project folder. Only open the .dwt itself when you are deliberately changing the standard (section 14), and put the previous copy in Archive first.
```


## 1.3  Three rules that explain most problems

| Rule | What it means in practice |
|---|---|
| Feet in model, inches on paper | Everything in model space is drawn in real US survey feet. Layouts are 17 × 11 inches. A plan viewport shows 1" = 50', set with ZOOM 0.02XP. There is no "1/600XP" anywhere in this workflow. |
| The page setup decides the paper | A layout does not store a paper size — it stores a printer name plus a paper name. If that name does not exist on your printer, BricsCAD silently substitutes a default, often metric. SENAUNITS tells you; SENAUNITSFIX repairs it. |
| The drawing holds a snapshot | Legend, key map, north arrow, vicinity sheet, linetypes and symbol blocks are copied into the drawing by a command. Nothing updates itself. If you edit the index, a layer or a symbol, re-run the command that built that piece (table in section 14). |


## 1.4  Your first plan set — the whole job on one page
Each line points at the section with the detail. Tick through it in order.

```text
START (section 2)
  NEW from SENAWAVE-11x17-TEMPLATE.dwt  ->  SAVEAS <Project>\<Project>.dwg
  SENAUNITS        every layout "ok"?   no -> SENAPAPER, SENATRY, SENAUNITSFIX
  SENALTCHECK      LTSCALE 1, linetypes missing 0?   no -> SENALT, SENACOLOR
ARCGIS (section 4)
  Dissolve route -> ArcGIS\SENAWAVE-SheetIndex.py: edge-to-edge cells,
                    each <= 685 x 420 ft; move seams by hand if needed
  QC the index -> Layer = "TB-GRID" -> Export To CAD -> xref\SheetIndex.dwg
  Utility data: calculate Layer field -> Export To CAD -> xref\*.dwg
BRICSCAD - ONCE (section 5)
  UCS World -> XATTACH SheetIndex.dwg at 0,0,0 (name stays "SheetIndex")
  TB-GRID -> no-plot
  XATTACH utilities -> Bind (Insert) -> EXPLODE once -> SENAMIGRATE, SENACOLOR
  PT2BLK for point features; aerial imagery; DRAWORDERBYLAYER
  Copy layout PLAN-01 -> PLAN-02 ... PLAN-nn
BRICSCAD - EVERY PLAN SHEET (section 6)
  MSPACE -> UCS Z <Angle> -> PLAN Enter
  ZOOM Window <two corners> -> ZOOM 0.02XP -> UCS Save PLAN-nn
BRICSCAD - ONCE THE SHEETS ARE ALIGNED (sections 6-10)
  SENACLIP          clip every viewport, matchlines + labels, lock
  SENASIDE          legend, key map, north arrow on every PLAN sheet
  SENAVICINITY      the vicinity sheet
  SENAKEYWIN -> ArcGIS\SENAWAVE-KeyMapBasemap.py -> SENAIMG -> SENAKEYMAP
  SENATITLE         project fields; per-sheet fields by hand
  plot to PDF, run the QC checklist (section 11)
```


# 2.  Start a project drawing
## 2.1  The drawing and the project folder
NEW → browse to the template → SAVEAS. Keep one folder per project, laid out like this — several commands write next to the drawing and expect to find things there:

```text
<Project>\
  <Project>.dwg          the one drawing: model space + every layout
  xref\                  SheetIndex.dwg, the utility exports, aerial tiles
  keymap\                KEYMAP-01.tif ... KEYMAP-VICINITY.tif (section 9)
  keymap-windows.csv     written by SENAKEYWIN, beside the .dwg
  PDF\                   plotted sets
  Archived\              older copies of the .dwg
```


## 2.2  Day-one health check
Do this on every new drawing and on any older drawing before you trust it. Both commands only report.

```text
SENAUNITS      page setup of every layout, plus INSUNITS, MEASUREMENT,
               PSLTSCALE and LTSCALE
SENALTCHECK    LTSCALE, PSLTSCALE, MSLTSCALE, CANNOSCALE, text style SENA-LT,
               and how many SW_* linetypes are missing
```



| You see | Expected | If not |
|---|---|---|
| SENAUNITS, each layout | ok — Print As PDF, ANSI full bleed B, 17 × 11 inches, 1:1, TB 16 × 10, margins .03 (ok) | Page setup fix below. |
| SENAUNITS, header | INSUNITS 2 (feet), MEASUREMENT 0, PSLTSCALE 1, LTSCALE 1 | Page setup fix below sets them too. |
| SENALTCHECK (run it on the Model tab) | LTSCALE 1, PSLTSCALE 1, MSLTSCALE 1, CANNOSCALE 1"=50', SENA-LT present, linetypes missing: 0 | SENALT, then SENACOLOR, then REGENALL. If SENALT says CANNOSCALE NOT SET, add the scale first (below). |


### Page setup fix

```text
SENAPAPER      every paper on "Print As PDF" that MEASURES 17 x 11, with its
               margins. Names are not trusted: "full bleed" can have margins.
SENATRY        on ONE layout: pick a paper with margins of .05 or less, then
               look. The border should sit 0.5" inside the paper all round.
               Not right -> SENAUNITSUNDO, then SENATRY the next candidate.
SENAUNITSFIX   every layout. It names the paper it will use and asks Yes/No:
               answer Yes only if it is the paper you just approved.
SENAUNITS      confirm every layout now says ok, then SAVE
```


Then open the Page Setup Manager on a good layout and save its settings as a named page setup SENAWAVE-11X17, so any layout you add later can be given it in one click. SENAUNITSUNDO works only until you close the drawing.

```text
A layout whose paper origin has already shifted cannot be repaired
If a layout sits off-centre on the paper and re-applying the page setup does not move it back, delete that layout and copy a good one.
```


### Annotation scale fix
CANNOSCALE is stored per tab, and a drawing can only use a scale that is in its scale list. If SENALT reports CANNOSCALE NOT SET, the list has no 1" = 50':

```text
SCALELISTEDIT  -> Add -> name 1"=50'  paper units 1  drawing units 50  -> OK
Model tab      -> annotation scale (status bar, lower right) -> 1"=50'
SENALT         -> SENACOLOR -> REGENALL -> SENALTCHECK on the Model tab
```


## 2.3  How the linetypes work
Existing utilities are drawn with letter-coded linetypes — ---- G ---- G ---- for gas — so a black-and-white print still says what each line is. They come from SENAWAVE-PAPER.lin and are all named SW_*.
- The patterns are measured in paper inches. With PSLTSCALE = 1 and LTSCALE = 1 a coded pattern repeats every 0.66" on paper at any viewport scale. What you see in the viewport is what prints.
- The Model tab matches only when its annotation scale (CANNOSCALE) is 1" = 50'. CANNOSCALE is stored per tab, so set it on the Model tab itself. SENALT does this for you.
- A line shorter than one pattern cycle draws solid. At 1" = 50' one cycle is about 33 ft of ground, so a short stub shows as a plain dash with no letter. That is expected.
- Never "fix" dashes by changing LTSCALE. SENALTCHECK tells you whether a drawing is set up correctly and SENALT puts it right.
- Layer colours are chosen to stay distinguishable in greyscale. SENACOLOR applies them (Appendix A).
# 3.  The numbers
Measured from the template, layout PLAN-01. Everything else in this guide is derived from these — use them, do not re-derive them.

| Property | Value | What it drives |
|---|---|---|
| Sheet | 17" × 11", zero margins | Layout paper size |
| PLAN viewport | 13.700" × 8.400" | Viewport on layer G-VPORT (no-plot) |
| Viewport centre | 7.350, 6.300 | Spans X 0.50–14.20, Y 2.10–10.50 |
| Plot scale | 1" = 50' | Titleblock SCALE attribute |
| Zoom XP factor | 0.02 (= 1/50) | Paper inches per model foot |
| Ground seen per sheet | 685 ft × 420 ft | 13.7 × 50 and 8.4 × 50 — the largest a sheet index polygon can be |
| Equivalent map scale | 1 : 600 | For ArcGIS tools that want a ratio |
| Corridor half-width | 210 ft either side | The route runs down the middle of the page |



```text
Two numbers to memorise
Largest sheet index polygon = 685 ft along × 420 ft across.
Viewport zoom = ZOOM 0.02XP.
```


## 3.1  Paper coordinates of every cell
Paper inches, origin at the bottom-left corner of the 17 × 11 sheet. Content is inset 0.10" inside each cell.
### PLAN sheet side panel (block TB_SIDEPANEL, x 14.20–16.50)

```text
north arrow cell        y 9.30 - 10.50     centre 15.35 , 9.85
"LEGEND" header band    y 8.90 -  9.30
legend body             y 5.40 -  8.90
"KEY MAP" header band   y 5.00 -  5.40
key map body            y 2.10 -  5.00
key map content area    14.30 , 2.20  to  16.40 , 4.90     (2.10 x 2.70)
```


### VICINITY sheet

```text
key map (whole index)   0.50 , 3.00  to   8.30 , 10.50
north arrow + scale bar 0.50 , 2.10  to   8.30 ,  3.00
SHEET INDEX             8.30 , 6.60  to  12.40 , 10.50
FIRM                   12.40 , 6.60  to  16.50 , 10.50
LEGEND, three columns   8.30 , 2.10  to  16.50 ,  6.60
map content area        0.60 , 3.10  to   8.20 , 10.40     (7.60 x 7.30)
```


# 4.  ArcGIS — the sheet index and the data
Before any sheet is cut, make the sheet index: one polygon per PLAN sheet, drawn in ArcGIS, that says which stretch of route that sheet owns. SENAWAVE sheets are edge-to-edge — each polygon is at most 685 ft along the route × 420 ft across (what one viewport shows at 1" = 50'), and neighbouring polygons share an edge but never overlap. In BricsCAD each plan viewport is clipped to its polygon, so:
- the viewport border is the matchline, and its label sits at the border instead of across the drawing;
- every foot of route is drawn on exactly one sheet — no overlap band drawn twice, no callout counted twice;
- the same polygons give you the key maps (section 7).
## 4.1  Prerequisites
- The route is one dissolved polyline in the project CRS — EPSG 3566 (Utah Central, ftUS) or 3560 (Utah North), or their NAD83(2011) versions such as 6625 — whichever the job uses, the same one everywhere: route, exports, imagery map and the epsg= you give the scripts. Never Web Mercator. Merge, then Dissolve with "unsplit lines": disconnected pieces break the page chain and restart the numbering.
- Every layer you export is in that same CRS — Export To CAD writes coordinates in the input's CRS and ignores the environment settings.
- An ArcGIS Basic licence is enough for everything here.
## 4.2  Three ways to make the index

| Method | Use it for | Section |
|---|---|---|
| ArcGIS\SENAWAVE-SheetIndex.py (recommended) | Street grids, branches, most jobs. Sheets come out square to the street grid, edge-to-edge, with the clip and matchline numbers already filled in. | 4.3 |
| Draw or adjust the polygons by hand | Moving a seam off a handhole or intersection, small jobs, fixing a corner. Often: run the script, then move a few seams. | 4.4 |
| Strip Map Index Features at 0 % overlap | A long, curving single corridor (a highway). Needs hand fixes at bends. | 4.5 |


## 4.3  SENAWAVE-SheetIndex.py
All three ArcGIS scripts work the same way: loading the file only defines a command; you then run the command with your own layer names. Nothing inside the files points at a particular project.

```text
1  ArcGIS Pro, project open -> View -> Python window
2  right-click in the Python window -> Load Code... -> pick
      Templates\ArcGIS\SENAWAVE-SheetIndex.py  -> Enter
   (it prints "SENAWAVE-SheetIndex loaded" - nothing has run yet)
3  sheet_index("Route_Dissolved")       <- your route layer name in Contents
      optional:  sheet_index("Route_Dissolved", dry_run=True)   check only
```


It checks everything before writing: the route must be a polyline layer in a projected CRS in feet; the output goes into the project's default geodatabase as a new feature class named SheetIndex (SheetIndex_1, _2 … if the name is taken) and is added to the map. out_name is a name, never a path — a path or a .gdb is refused.

```text
It never deletes your data
The only thing it will ever replace is a sheet index it made itself, and only when you pass overwrite=True. It refuses a geodatabase, folder, table or any other dataset as the output. (An earlier version deleted whatever path it was given — including a whole geodatabase. That version is retired.)
```


The route is split into straight runs at each bend, each run into equal cells no longer than 685 ft (a 1,500 ft run becomes three 500 ft sheets); at a corner the sheet that gets there first owns it and the next run starts at its edge. A branch already inside an existing sheet gets no sheet of its own.

| Option | Default | What it does |
|---|---|---|
| out_name | "SheetIndex" | Feature class name only. |
| out_gdb | project default | A different .gdb to write into. |
| snap_deg | 90 | 90 = street grid, 45 also allows diagonals, 0 = follow the route freely. |
| grid_brg | 0 | Degrees CCW from east. Set to the street bearing on a skewed plat. |
| min_cell | 120 | Feet. A leftover shorter than this gets no sheet; it is listed so you can fix it by hand (4.4). |
| even | True | Equal cells along each run, so there is no stub sheet at the end. |
| overwrite | False | True replaces an existing SheetIndex made by this script — nothing else. |
| dry_run | False | True = check and report, write nothing. |


Example: sheet_index("Route_Dissolved", out_name="SheetIndex_v2", grid_brg=14.5)
Fields it writes on every polygon, all used in BricsCAD:

| Field | Use |
|---|---|
| PageNumber | Sheet number. PageNumber 4 → layout PLAN-04. |
| Angle | The UCS Z rotation for that sheet (6.2 step 3). Always between −90 and 90, so north is on the top or right of the sheet, never upside down. |
| NorthRot | = −Angle, the north arrow rotation (SENANORTH works it out itself). |
| CellFt | The cell's length along the route, ≤ 685 ft. |
| ClipX0<br>ClipX1 | Paper X of the clip rectangle: it runs from (ClipX0, 2.10) to (ClipX1, 10.50). A 685 ft cell is 0.50 to 14.20 — the full viewport, no clip needed. |
| MatchL<br>MatchR<br>MatchT<br>MatchB | The sheet across the Left<br>Right<br>Top<br>Bottom border as plotted — the "SEE SHEET" numbers for the matchline labels. |
| RunId<br>SeqId<br>AcrossFt | Which run, position in it, and how wide the route wanders across the cell. |


It also reports: sheet count, the rotations used, any sheet where the route leaves the 420 ft band, coverage gaps (points on the route that are on no sheet), and any leftover too short for a sheet. Sheets per run = run length ÷ 685, rounded up — a 24,917 ft straight corridor is 37 sheets.
## 4.4  Drawing or adjusting the polygons by hand
- Each polygon is a rectangle no larger than 685 × 420 ft, long side along the route. Keep the full 420 ft across; shorten only along the route.
- Neighbours share an edge exactly — edit with vertex and edge snapping on, so there is no sliver of overlap or gap.
- Put seams on straight runs, clear of handholes, splices, bore pits and intersections. At a corner, one sheet owns the whole corner.
- Keep an Angle field (degrees CCW from east, −90 to 90) if you can; otherwise you pick the edge in CAD (6.2 step 3).
- Renumber PageNumber 1…N in reading order, and update the MatchL/R/T/B fields if you moved a seam — or take the neighbours from the key map.
## 4.5  Strip Map Index Features (curving corridors)
Cartography Tools → Data Driven Pages → Strip Map Index Features, with Percentage of Overlap = 0, Length Along the Line 685 Feet, Length Perpendicular 420 Feet, Page Orientation Horizontal, Direction WE_NS, Starting Page 1, Use Page Unit and Scale unchecked.

```text
arcpy.cartography.StripMapIndexFeatures(
    in_features = "Route_Dissolved", out_feature_class = "SheetIndex",
    use_page_unit = "NO_USEPAGEUNIT",
    length_along_line = "685 Feet", length_perpendicular_to_line = "420 Feet",
    page_orientation = "HORIZONTAL", overlap_percentage = 0,
    starting_page_number = 1, direction_type = "WE_NS")
```


- Pages turn to the local trend of the line, so at every bend neighbouring pages overlap on the inside of the curve and leave a wedge on the outside. Fix those by hand (4.4).
- On a street grid the pages come out 20–40° off the street where a trunk meets a lateral — use the script instead.
- Use LeftPage / RightPage for neighbours (Previous / Next are creation order only). Do not use Strip Map's Angle field for the CAD rotation — its datum and sign differ; pick the edge in CAD instead.
## 4.6  QC the index before you export
Draw SheetIndex hollow, label it with PageNumber, and pan the whole corridor:
- Polygons touch but never overlap, and the route never crosses a gap between them (the script's "coverage gaps" is 0).
- No polygon is bigger than 685 × 420 ft, and the route stays inside each one's 420 ft width.
- On a street grid every Angle is a multiple of 90°.
- No seam runs through a handhole, splice or intersection.
- PageNumber runs 1…N with no gaps.
## 4.7  Export the index

```text
arcpy.management.AddField("SheetIndex", "Layer", "TEXT", field_length=255)
arcpy.management.CalculateField("SheetIndex", "Layer", '"TB-GRID"', "PYTHON3")
arcpy.conversion.ExportCAD(
    in_features = "SheetIndex", Output_Type = "DWG_R2018",
    Output_File = r"<Project>\xref\SheetIndex.dwg",
    Ignore_FileNames = "Ignore_Filenames_in_Tables",
    Append_To_Existing = "Overwrite_Existing_Files",
    Seed_File = r"<Templates>\ArcGIS\SENAWAVE-ARCGIS-SEED.dwg")
```


- SENAWAVE-SheetIndex.py already writes Layer = TB-GRID — skip the AddField / CalculateField lines and run only ExportCAD.
- Always use the .dwg seed. The seed's file format overrides Output_Type, so a .dxf seed forces DXF output.
- Keep the file name SheetIndex.dwg. The side panel and vicinity commands look for an xref (or block) named SheetIndex; if you name it anything else, change *ss-key-xref* at the top of SENASIDE.lsp to match.
## 4.8  Export the utility data so it lands on the right layers
In CAD, meaning lives in the layer. ArcGIS can draw buried and aerial power differently from an attribute; CAD cannot. So every distinction that matters must become its own layer before export, or it flattens onto one layer and cannot be recovered. Export To CAD honours these reserved fields — add them to each feature class and calculate them:

| Field | Type | Drives |
|---|---|---|
| Layer | Text | The CAD layer the feature lands on (the important one — use Appendix A names) |
| RefName | Text | For point features: the symbol block to insert (Appendix B names) |
| Color<br>Linetype<br>LineWt | Short<br>Text<br>Short | Overrides. Normally leave empty so the layer decides. |



```text
// power, from a Placement field holding UG or OH
"PWR-" + $feature.Placement + "-E"                    -> PWR-UG-E
PWR-OH-E
// fiber, from Placement (Aerial
UG) and Status (Proposed
Existing)
"FBR-" + IIf($feature.Placement == "Aerial", "AER", "UG")
       + IIf($feature.Status == "Existing", "-E", "-P")
// handhole points: Layer = "FBR-HH-P", RefName = "HH-PROP-17X30"
```


Export each dataset with the same seed to <Project>\xref\. Data that arrives with old names (SW-POWER-DISTRIBUTION and so on) can be renamed afterwards with SENAMIGRATE, but that cannot tell buried from overhead — fix those at the source.
# 5.  BricsCAD — bring the data in
## 5.1  Attach the sheet index
- UCS → World. XATTACH inserts in the current UCS, and a rotated UCS gives you an xref you cannot find.
- XATTACH → xref\SheetIndex.dwg, insertion 0,0,0, scale 1, rotation 0. Leave it attached (do not bind) so it can be reloaded when the index changes.
- Check with DIST that a polygon measures 420 ft across and no more than 685 ft along. 5040 across means an inch seed was used; tiny numbers mean metric. Fix the export, never scale the geometry.
- Set layer TB-GRID to no-plot. The polygons are in model space, so they show in every viewport while you work and never on paper.
## 5.2  Utility linework and point features
- XATTACH each utility export at 0,0,0 in World UCS, then in the Attachments panel right-click → Bind → Insert so the layers come in with clean names.
- Bind leaves the whole file as one block reference. Select it and EXPLODE it once so its lines, points and blocks become separate objects on their own layers — until then SENAMIGRATE, SENACOLOR selections and PT2BLK cannot reach them. (Shortcut for both steps: INSERT the .dwg at 0,0,0, scale 1, rotation 0 with Explode ticked.) Explode only once — a second EXPLODE breaks up the symbol blocks inside it.
- If any layers arrived with old names (SW-*, GAS, WATER …): SENAMIGRATE — work on a copy; check anything it maps to PWR-OH-E.
- SENACOLOR then REGENALL — re-applies the standard colours, SW_* linetypes and lineweights to the utility layers.
- Points arrive as one-pixel CAD points. Turn them into symbols with PT2BLK: type the block name (Appendix B), scale 1, then Layer to convert every point on a layer at once. Each symbol lands on the layer of the point it replaces. Points exported with a RefName are already blocks — skip them.
- Drawing by hand instead: set the current layer (Appendix A) and PLINE; place symbols with INSERT at scale 1.
Drawings started from the template already contain every symbol block. For an older drawing, run SENAWAVELOAD first.

```text
Keep SheetIndex as an xref
The sheet index is the one attachment you do not bind or explode. It must stay an attached xref named SheetIndex: SENACLIP, SENAKEYMAP and SENAVICINITY read the polygons from it, and Reload picks up an edited index.
```


## 5.3  Aerial imagery behind the plan
ArcGIS\SENAWAVE-SheetImagery.py makes one georeferenced picture per sheet index polygon. It exports the map, not a raster, so it works with Esri World Imagery and any other basemap or service layer. Each picture is framed with padding on every side, exported, and the padding cropped off — the credit line ArcGIS prints along the bottom of the frame falls in that padding, so no picture carries credits. The credits go into imagery-credits.txt for you to place once per sheet.

```text
1  In ArcGIS Pro make a map that shows ONLY the imagery (e.g. "Imagery"),
   in the drawing CRS: Map Properties -> Coordinate Systems -> EPSG 3566
2  Python window -> Load Code... -> ArcGIS\SENAWAVE-SheetImagery.py
3  sheet_imagery("Imagery", "SheetIndex", r"<Project>\xref\imagery", epsg=3566)
      optional: map_scale=750, gsd=0.25 (ft/px), margin_ft=10, pad_in=0.6,
                only=[3, 4], fmt="JPEG", overwrite=True, dry_run=True
```


- map_name is a map, not a layer. Every visible layer in that map is burned into the pictures; the script lists them.
- map_scale (default 750) is the scale the map is drawn at. Basemaps like World Imagery choose their detail level from the scale, so set it to the scale at which the imagery looks sharp when you zoom in Pro; if the pictures look soft, lower it (e.g. 600). It does not change the picture size.
- gsd = ground feet per pixel. 0.25 prints at 200 dpi at 1" = 50'; 0.19 matches the 300 dpi West Village tiles. Finer than the source imagery only makes bigger files.
- Each picture covers its polygon plus margin_ft (10 ft) so there is never a hairline gap at the clip edge; the viewport clip hides the extra.
- Pixels are snapped to one grid shared by every sheet, and the world file is rewritten from the exported one, so neighbouring pictures meet exactly. Existing pictures are skipped unless overwrite=True.
Then in BricsCAD, on the Model tab:
- IMAGEATTACH each PLAN-nn.png in model space, World UCS, position and scale from its world file.
- Put the images on a base layer, DRAWORDER → Back, and give them Fade 40–60 (Properties → Image section — select images only, or use IMAGEADJUST).
- On each PLAN sheet put the text from imagery-credits.txt once, in paper space on TB-TEXT, in the bottom-left corner of the viewport (e.g. insertion 0.60, 2.20, height 0.07").
- BricsCAD reads a world file only at attach time. If a world file changes, detach and re-attach. If the imagery sits a few feet off the linework (basemap registration drift), measure it with DIST and MOVE all the images by that amount.

```text
Fade, never transparency
Entity or layer transparency inside a viewport makes PUBLISH/PDF flatten the whole viewport into blank white tiles. Image Fade is a different property and plots fine.
```


## 5.4  Draw order
Proposed fiber must be the top linework and annotation must sit above it. After binding data or attaching imagery, run DRAWORDERBYLAYER and point it at Support\SENAWAVE-11x17-DRAWORDER.lst. The file lists layers bottom first, top last; a name that is not in the drawing is skipped. Draw order is stored per object, so re-run it after every large import.
# 6.  Cut and align the plan sheets
## 6.1  Make the layouts
Right-click the PLAN-01 tab → Copy, once per sheet index polygon, and rename the copies PLAN-02, PLAN-03 … The copy carries the titleblock, the correctly sized viewport and the page setup. Never draw a plan viewport by hand — its size would not match and nothing downstream lines up. Layout PLAN-nn always shows polygon nn.
## 6.2  The per-sheet recipe
Turn the UCS to the polygon, ask for the plan view of that UCS, centre and scale it, then clip the viewport to the polygon.

```text
1  Open layout PLAN-nn
 2  Double-click inside the viewport (or MSPACE)
 3  UCS -> Z -> <Angle of polygon nn>
       no Angle field: UCS -> Entity -> pick the polygon edge that runs
       along the route; if north lands at the bottom or left, UCS -> Z -> 180
 4  PLAN -> Enter  (accepts <Current UCS>)
 5  ZOOM -> Window -> snap the polygon's two diagonal corners
 6  ZOOM -> 0.02XP                 exact 1" = 50', about the polygon centre
 7  UCS -> Save -> PLAN-nn          so you can come back to label
 8  PSPACE.  Clip - skip this if CellFt is 685:
       make G-VPORT the current layer
       RECTANG  <ClipX0>,2.10  <ClipX1>,10.50
       VPCLIP -> pick the viewport -> pick the rectangle
 9  Matchlines and their labels (6.4)
10  Select the viewport -> Properties -> Display locked = Yes
```



```text
Shortcut: SENACLIP does steps 8–10 on every sheet
Align every PLAN sheet with steps 1–7, then run SENACLIP once. It clips each viewport to its polygon (boundary on G-VPORT), draws a matchline on G-MATCH along every border that meets another polygon, labels it MATCHLINE - SEE SHEET nn, and locks the viewport. It reads the polygons themselves, so it works for hand-drawn ones too. Re-run it after moving a seam; SENACLIPCLEAN takes it all off again. Do at least one sheet by hand first so you know what it is doing.
```


Steps 5 and 6 put the polygon's centre in the middle of the viewport at exactly 0.02, which is why the clip rectangle can be typed from ClipX0 / ClipX1. Check in Properties that Custom scale reads 0.02, and that after clipping the polygon's edges sit on the clip edges.
Hand-drawn polygon without Clip fields: at step 8 go back into the viewport (MSPACE), make G-VPORT current, draw a RECTANG snapping to the polygon's corners, then CHSPACE it to paper space and VPCLIP to it.

```text
Lock last
A locked viewport cannot be rotated, scaled or panned. The order is always rotate → scale → centre → clip → lock. To adjust a finished sheet: unlock, fix, re-lock.
```


## 6.3  System variables

| Variable | Set to | Why |
|---|---|---|
| UCSVP | 1 (default) | Each viewport keeps its own UCS — one rotation per sheet. |
| UCSFOLLOW | 0 (default) | If on, every UCS change zooms to extents and destroys the scale. |
| SNAPANG | the UCS angle | Aligns crosshairs to the rotated view. Reset to 0 afterwards. |
| PSLTSCALE<br>LTSCALE | 1<br>1 | Paper-inch linetypes. Checked by SENALTCHECK. |
| FILLMODE | 1 | Solid fills (handholes, key map highlight) draw hollow at 0. |


Why UCS + PLAN rather than the alternatives: MVSETUP Align sets no UCS, so annotation is still crooked; DVIEW TWist inverts the sign; rotating the viewport frame depends on a registry setting that does not travel with the template.
## 6.4  Matchlines
With edge-to-edge sheets the clipped viewport border is the matchline. Everything here is in paper space, so the view rotation never touches it. SENACLIP draws all of this for you; by hand:
- On each border that has a neighbour — MatchL / MatchR / MatchT / MatchB, or read it off the key map — draw a polyline on G-MATCH along that clip edge.
- Label it just inside the border, parallel to it: MATCHLINE – SEE SHEET 5, paper-space text 0.14" high. Labels on the left and right borders are rotated 90°.
- A border can meet two sheets (at a corner): give each stretch its own label.
- Check the pairs agree: if sheet 4's right border says SEE SHEET 5, sheet 5 has a matchline back to 4.

```text
The clip boundary must stay on a layer that is ON
If the clip rectangle sits on a layer that is turned off or frozen, the whole viewport plots blank. Keep it on G-VPORT (on, no-plot). Never turn G-VPORT off to hide something — it blanks every clipped sheet.
```


Earlier jobs used overlapping pages with the matchline drawn inside the sheet. That method is retired; the script still has ABUT = False for reproducing an old index.
## 6.5  Annotation in a rotated view
- Restore the sheet's UCS (UCS → Named → PLAN-nn), then place TEXT, MTEXT, leaders and dimensions at rotation 0. They read horizontal on the sheet. This is the main reason for the UCS + PLAN method.
- Labels made before the UCS was set, or copied from another sheet, read crooked. Re-create dimensions rather than ROTATE them.
- Sheet-fixed items — north arrow, legend, key map, matchlines and their labels — live in paper space, where the twist cannot touch them.
### Text heights
Decide the plotted height first. Model-space text height = plotted inches × 50 (feet); paper-space text height = plotted inches. Below 0.07" becomes unreadable once someone prints 11×17 down to letter size. TrueType fonts plot about 30% smaller than SHX at the same height — check the PDF, not the Properties panel.

| Use | Plotted height | Model-space height |
|---|---|---|
| Matchline label | 0.14" | 7.0 ft |
| Street names | 0.12" | 6.0 ft |
| Construction callouts, station tags | 0.10" | 5.0 ft |
| Dimensions, leader text | 0.08" | 4.0 ft |
| Minor labels (addresses) | 0.07" | 3.5 ft |
| Paper-space notes, titleblock values | 0.10–0.12" | — |


# 7.  The side panel
The right-hand column of every PLAN sheet is block TB_SIDEPANEL: north arrow, LEGEND, KEY MAP. SENASIDE.lsp fills it. Every command is safe to re-run — it replaces what it made last time.

```text
SENASIDE        whole panel on every PLAN sheet - runs the four below, in order
  SENASIDECLEAN   strip placeholder text out of TB_SIDEPANEL
  SENALEGEND      build TB_LEGEND and place it on every PLAN sheet
  SENAKEYMAP      key map on every PLAN sheet
  SENANORTH       north arrow on every PLAN sheet, rotated -theta
```


SENAKEYMAP and SENANORTH read the plan viewports, so run SENASIDE after section 6, and again whenever you re-cut or realign a sheet.
## 7.1  Legend
Each row is a short line drawn on the layer it represents with the label beside it, so the legend cannot disagree with the sheet — change a layer's colour or linetype and the legend follows. Symbol rows insert the real block.
- Rows live at the top of Support\SENASIDE.lsp: *ss-legend-rows* (layer, label) and *ss-legend-syms* (layer, block, label). Delete rows you do not use; add IRR-UG-E only on jobs with irrigation. Rows space themselves.
- After editing: APPLOAD SENASIDE.lsp again, then SENALEGEND and SENAVICINITY — both legends read the same table but each is a snapshot.
- Text height = the smaller of 0.10" and 42% of the row gap. With ~18 rows labels drop just under 0.08" — drop a row if they get too small.
- SENALEGDIAG reports every row: linetype, pattern length, and whether the swatch is long enough to show it (ok / marginal / SOLID). SENALEGSYM reports the symbol rows and any block placed in the drawing that the legend does not list.
- A legend that stays wrong after re-running: SENALEGWIPE (deletes both legend blocks everywhere), then SENALEGEND and SENAVICINITY.
## 7.2  Key map
The sheet-index rectangles seen from above, north up, numbered, with this sheet marked. It is paper-space linework — one block per sheet, TB_KEYMAP-nn — not a viewport, so nothing from it can appear in the plan viewport. It is a snapshot: if the index changes, reload the xref and re-run SENAKEYMAP.

| Setting (top of SENASIDE.lsp) | Values | Effect |  |  |  |
|---|---|---|---|---|---|
| *ss-key-frame* | Auto (default) | Fit | Window | Fit squeezes the whole index into the cell; Window holds a fixed scale and centres on this sheet (UDOT style). Auto uses Fit until a rectangle would draw shorter than 0.30". |  |
| *ss-key-hlmode* | Auto | Fill | Bold | None | How "you are here" is marked. Auto = filled, or bold once a basemap is behind it (a fill would hide the basemap). |
| *ss-key-xref* | "SheetIndex" | Name of the xref/block holding the rectangles. |  |  |  |


Numbers come from the layout name, so PLAN-04 is always key map 4. SENAKEYMAP matches rectangles to sheets by reading the model point at the centre of each sheet's plan viewport, so a sheet that is not aligned yet is left blank rather than guessed.
## 7.3  North arrow
If a sheet's UCS is turned θ to lay the route across the page, the paper-space north arrow must be turned −θ. SENANORTH reads θ from each sheet's plan viewport and prints θ and the arrow rotation for every sheet — a free QC pass: on a grid-snapped index every θ is a multiple of 90°.
# 8.  The VICINITY sheet
Page 2 of the set, after the COVER. The only place that shows the whole route, the only full-size legend and the only sheet index. The layout is already in the template.

```text
SENAVICINITY    build or rebuild the sheet (needs SENASIDE loaded first)
SENAVICCLEAN    empty it, keep the layout
```



| Panel | Where its content comes from |
|---|---|
| Key map | The SheetIndex rectangles, whole corridor, north up, fitted to the 7.60 × 7.30" cell. Numbering reuses SENAKEYMAP's matching — run SENAKEYMAP first. |
| North arrow + scale bar | Rotation 0 — this map is north up. |
| SHEET INDEX | The layout tab order, with the PLAN layouts collapsed to "PLAN-01 THRU PLAN-nn". |
| FIRM | The TB_11X17 titleblock attributes — fill them with SENATITLE. |
| LEGEND | The same rows as the side panel legend, in three columns. |


If a drawing lacks the VICINITY layout, copy the COVER tab, rename it VICINITY, drag it after COVER, delete the extra viewport, then run SENAVICINITY.
# 9.  Basemaps behind the key maps
A light street picture behind the numbered rectangles, on every plan sheet and the vicinity sheet. One small pre-cropped image per cell, attached in paper space — nothing reaches model space.

```text
BricsCAD     SENAKEYMAP       framing decided here
             SENAVICINITY     adds the VICINITY row to the window list
             SENAKEYWIN       writes keymap-windows.csv beside the .dwg
ArcGIS Pro   Load Code... ArcGIS\SENAWAVE-KeyMapBasemap.py, then
             keymap_basemaps(r"<Project>\keymap-windows.csv", epsg=3566)
               basemap map named KeyMapBase (or map_name="...")
               pictures go to <Project>\keymap (or out_dir=...)
             -> KEYMAP-01.tif ... KEYMAP-nn.tif, KEYMAP-VICINITY.tif
BricsCAD     SENAIMG          both basemaps; asks once for the keymap folder
             SENAKEYMAP       again: "you are here" switches from fill to bold
```



```text
Order matters
SENAKEYWIN writes the VICINITY row only after SENAVICINITY has run. Export before that and the vicinity map stays empty.
```


Each picture comes out exactly the size of its cell (2.10 × 2.70" for a key map, 7.60 × 7.30" for the vicinity map at 200 dpi), so one can also be placed by hand: IMAGEATTACH at scale 1, rotation 0, insertion 14.30,2.20 (key map) or 0.60,3.10 (vicinity); layer TB-KEYMAP-IMG, Fade 25, DRAWORDER Back, IMAGEFRAME 0. SENAKEYIMGCLEAN removes the key map pictures; SENAIMGFIX re-sizes pictures that are attached but invisible.
# 10.  Titleblocks, numbering and plotting
- Layout PLAN-nn ↔ PageNumber nn. Keep this absolute; matchlines and key maps depend on it.
- Project-wide fields (name, location, number, engineer, PM, design/field dates) go in once with SENATITLE, which writes every TB_11X17 in the drawing. At each prompt Enter keeps the current value; a single "." blanks it. SENAPLOTDATE stamps today into PLOT_DATE.
- Per-sheet fields are not touched by SENATITLE — edit them on each layout (double-click the titleblock): SHEET_TITLE, SHEET_NAME, SCALE, COMPANY.
- SCALE on plan sheets reads 1" = 50'. The template placeholder "1:50" is wrong — replace it.
- Fill the total sheet count last, once notes and details are final.
- NOTES04-3 carries an embedded object from the source set — check it on the first plot.
- Plot the whole set to PDF (PUBLISH, device Print As PDF, page setup SENAWAVE-11X17) and page through it. Route continuity across matchlines is the fastest way to spot a mis-set viewport.
# 11.  QC checklist
### Setup
- SENAUNITS reports every layout ok; SENALTCHECK reports LTSCALE 1 and 0 linetypes missing.
- Titleblock project fields identical on every sheet (SENATITLE, spot-check three).
### Plan sheets
- Every PLAN viewport: Custom scale 0.02, Display locked = Yes.
- The route runs through the middle of every sheet and never touches the top or bottom of the viewport.
- Every border that meets another sheet carries a matchline and a SEE SHEET label, and the pairs agree in both directions.
- No stretch of route is drawn on two sheets, and none is missing between sheets.
- No text on any sheet is upside down or crooked; text meets the heights in 6.5.
- TB-GRID rectangles do not appear on the PDF. No clipped viewport plots blank.
- Existing utilities show their letter codes on the PDF; proposed fiber is the top linework.
- Sheet numbers run 1…N with no gaps and the key maps agree.
### Side panel and vicinity
- The legend lists every linetype and symbol on the sheets and nothing else; swatches show dashes and letters, not solid lines (SENALEGDIAG).
- Each key map marks its own sheet and only that one; numbers match the layout names.
- North arrow correct on a rotated sheet — check one 90° sheet by eye.
- Both basemaps visible, faded and behind the linework. Nothing from the key map shows in a plan viewport.
- No placeholder text (PROJECT NAME, 26-0000, ---) anywhere in the PDF.
- Print one sheet in greyscale: every utility is still identifiable.
# 12.  Troubleshooting
Every row happened on a real job.

| Symptom | Cause and fix |
|---|---|
| A copied or new layout is the wrong size; titleblock does not match the paper. | The page setup names a paper your printer does not have, so BricsCAD substituted a default (often metric). Section 2.2: SENAUNITS → SENAPAPER → SENATRY → SENAUNITSFIX. |
| Something is 25.4× out. | Inches vs millimetres — always the page setup. 12× is feet vs inches (INSUNITS). 304.8× is both. |
| Sheet sits off-centre on the paper; ~1" spare on two sides. | Paper margins. Pick a paper whose margins are .05" or less with SENAPAPER<br>SENATRY. If re-applying does not move it back, delete the layout and copy a good one. |
| Dashed lines read solid, or letter codes are missing everywhere. | LTSCALE is not 1, or the SW_* linetypes are missing. SENALTCHECK → SENALT → SENACOLOR → REGENALL. (Missing only on very short segments is normal — 2.3.) |
| Linetypes look right on a layout but wrong on the Model tab. | The Model tab's CANNOSCALE is not 1" = 50' — it is stored per tab. SENALT sets it; or set it with the annotation scale control on the Model tab. |
| SENALT loads no linetypes at all. | The .lin file was not found or not read. Check the path SENALT prints; the file must keep Windows (CRLF) line endings — do not re-save it in an editor that changes them. |
| Legend swatches are solid though the sheet dashes are fine. | TB_LEGEND was built with an older swatch length. SENALEGDIAG confirms ("STALE"); re-run SENALEGEND and SENAVICINITY. |
| An edited symbol still shows the old artwork. | SENAWAVELOAD never overwrites an existing block. Erase the inserts → -PURGE → Blocks → <name> → SENAWAVELOAD. SENALEGSYM shows which block the legend is really using. |
| Fills missing everywhere — handholes, key map highlight. | FILLMODE is 0. Set it to 1 and REGENALL. |
| A whole plan viewport plots blank; other sheets are fine. | Its VPCLIP boundary is on a layer that is off or frozen. Turn that layer on, move the boundary to G-VPORT. |
| North arrows all point the same way<br>key map sheets unmatched. | SENANORTH<br>SENAKEYMAP ran before the sheets were aligned. Align, then re-run — they replace rather than add. |
| Key map rectangles microscopic. | Fit framing on a long corridor. Set *ss-key-frame* to "Window" (or "Auto") and re-run SENAKEYMAP. |
| SENACLIP skips a sheet: "view centre is on no polygon". | That sheet is not aligned yet, or the view was panned off its polygon. Redo 6.2 steps 1–7 for it, then SENACLIP → Current. |
| A matchline label says SEE SHEET ??. | The neighbouring polygon has no PLAN layout (or that sheet is not aligned). Add or align the layout, then re-run SENACLIP. |
| Key map or vicinity map says no rectangles. | The xref is not named SheetIndex. Rename it in the Attachments panel or change *ss-key-xref*. |
| Basemap attached, right place, but invisible. | The image came in at zero size. SENAIMGFIX re-sizes what is attached. |
| Vicinity map empty, key maps fine. | KEYMAP-VICINITY.tif missing because SENAKEYWIN ran before SENAVICINITY. Re-run SENAKEYWIN and the ArcGIS script, then SENAIMG. |
| PUBLISH produces blank white tiles. | Transparency inside a viewport. Remove it; use image Fade. |
| An xref vanishes after XATTACH. | It was attached under a rotated UCS. UCS World and re-attach. |
| Strip-map pages 20–40° off the street. | Strip Map follows the local trend of the line. Use SENAWAVE-SheetIndex.py on a street grid (4.3). |
| A clipped viewport shows the wrong stretch, or the clip cuts through the polygon. | The view was not centred on the polygon before clipping, or the ClipX values came from another sheet. Unlock, VPCLIP → Delete, redo 6.2 steps 5–8. |
| A polygon measures 5040 ft across. | Inch-unit seed. Re-export with ArcGIS\SENAWAVE-ARCGIS-SEED.dwg; never scale the geometry. |
| Aerial imagery offset a few feet from the linework. | Basemap registration drift. Measure the offset with DIST, MOVE the images by it (or correct the world files and re-attach). |
| A titleblock arrives with no editable attributes. | The block was inserted by a script that does not create attributes. Select the titleblock on a good sheet, COPYCLIP, then PASTEORIG on this sheet, and delete the bad one. |


# 13.  Command reference
All commands are loaded by SENAWAVE-LOADALL.lsp. File = the .lsp in Templates\Support that defines it.

| Command | File | What it does |
|---|---|---|
| SENAUNITS | SENAUNITS | Report every layout's page setup and the unit/linetype header settings. Changes nothing. |
| SENAPAPER | SENAUNITS | List every paper on the device that measures 17 × 11, with margins and orientation. |
| SENATRY | SENAUNITS | Apply one of those papers to the current layout only. |
| SENAUNITSFIX | SENAUNITS | Apply the paper to every layout; set INSUNITS, MEASUREMENT, PSLTSCALE 1, LTSCALE 1. |
| SENAUNITSUNDO | SENAUNITS | Undo SENATRY<br>SENAUNITSFIX (this session only). |
| SENAMEDIA | SENAUNITS | Raw list of devices and paper names. |
| SENALT | SENALTYPE | Create text style SENA-LT, load the SW_* linetypes, set PSLTSCALE/MSLTSCALE/LTSCALE 1 and CANNOSCALE 1" = 50'. |
| SENACOLOR | SENALTYPE | Apply colour, linetype and lineweight to the utility and base layers (Appendix A). |
| SENALTCHECK | SENALTYPE | Report the linetype settings. Changes nothing. |
| SENALTDIAG | SENALTYPE | Pick a line: prints what one pattern cycle measures on paper and on the Model tab. |
| SENASIDE | SENASIDE | Whole side panel on every PLAN sheet (the next four in order). |
| SENASIDECLEAN | SENASIDE | Strip placeholder text out of TB_SIDEPANEL. |
| SENALEGEND | SENASIDE | Build TB_LEGEND and place it on every PLAN sheet. |
| SENAKEYMAP | SENASIDE | Key map in paper space on every PLAN sheet. |
| SENANORTH | SENASIDE | North arrow on every PLAN sheet at −θ. |
| SENALEGDIAG | SENASIDE | Check every legend row's swatch against its linetype; flags a stale TB_LEGEND. |
| SENALEGSYM | SENASIDE | Report legend symbol rows and placed blocks the legend does not list. |
| SENALEGWIPE | SENASIDE | Delete TB_LEGEND and TB_VICINITY everywhere, for a clean rebuild. |
| SENAKEYWIN | SENASIDE | Write keymap-windows.csv for SENAWAVE-KeyMapBasemap.py. |
| SENAKEYIMG | SENASIDE | Attach the basemap behind every key map. |
| SENAKEYIMGCLEAN | SENASIDE | Remove those pictures. |
| SENAKEYCLEAN | SENASIDE | Remove a model-space key map left by an old version (SENAKEYMAP calls it). |
| SENAVICINITY | SENAVICINITY | Build or rebuild the VICINITY sheet. |
| SENAVICCLEAN | SENAVICINITY | Empty the VICINITY sheet, keep the layout. |
| SENAVICIMG | SENAVICINITY | Attach KEYMAP-VICINITY.tif behind the vicinity map. |
| SENAIMG | SENAVICINITY | Both basemaps in one go. |
| SENAIMGFIX | SENAVICINITY | Re-size basemap pictures that are attached but invisible. |
| SENACLIP | SENACLIP | Clip every aligned PLAN viewport to its index polygon; matchlines + SEE SHEET labels on G-MATCH; lock. |
| SENACLIPCLEAN | SENACLIP | Remove the clips, matchlines and labels SENACLIP made. |
| SENATITLE | SENATITLE | Project titleblock fields on every sheet. |
| SENAPLOTDATE | SENATITLE | Today's date into PLOT_DATE on every sheet. |
| SENAWAVELOAD | SENAWAVELOAD | Load the symbol library into a drawing that lacks it. Never overwrites existing blocks. |
| PT2BLK | PT2BLK | Replace CAD points with a symbol block, on the point's layer. |
| SENAMIGRATE | SENAMIGRATE | Rename old<br>SW-* layers to the standard. Follow with SENALT + SENACOLOR. |


### Retired — do not use

| Command / file | Replaced by |
|---|---|
| SENALTS | Set LTSCALE 0.25 for the old stock linetypes, which breaks the SW_* codes. Now only points you to SENALTCHECK<br>SENALT. |
| SENAKEYPREP | Kept as an alias of SENAKEYMAP. |
| SENAHHFIX.lsp | Rebuilt the handholes as plain rectangles — it would undo the current boxed "HH" symbol. Archived. |
| SENWAVELOAD<br>SENALOAD<br>KRADOLOAD | Old spellings of SENAWAVELOAD (the first two still work). |


# 14.  Maintaining the package
For whoever changes the standard. The source files in Support\ are authoritative; every drawing holds a copy made by a command, and nothing updates itself.

| Element | Lives in | Copied into a drawing by |
|---|---|---|
| Legend rows (both legends) | SENASIDE.lsp *ss-legend-rows*<br>*ss-legend-syms* | SENALEGEND + SENAVICINITY |
| Side panel<br>vicinity cell geometry | Config blocks at the top of SENASIDE.lsp and SENAVICINITY.lsp — separate | SENASIDE<br>SENAVICINITY |
| Symbol blocks | SENAWAVE-FIBER-SYMBOLS.dxf and the template | Template (new projects), SENAWAVELOAD (old drawings — only missing blocks) |
| Linetype definitions | SENAWAVE-PAPER.lin | SENALT — skips names already in the drawing |
| Layer colour<br>linetype<br>lineweight | SENALTYPE.lsp *sl-layers* | SENACOLOR |
| Annotation scale 1" = 50', CANNOSCALE, LTSCALE | The drawing (CANNOSCALE per tab) | SENALT |
| Page setup | The drawing | SENAUNITSFIX; named setup SENAWAVE-11X17 |


### Rules
- Changing a symbol: edit it in the template AND in SENAWAVE-FIBER-SYMBOLS.dxf, and in any live project drawing (erase inserts → -PURGE → SENAWAVELOAD). A fix made in one of the three places fixes only that one.
- Changing a linetype: add it under a new name in SENAWAVE-PAPER.lin (keep CRLF line endings), add the name to *sl-ltypes*, point the layer at it in *sl-layers*, run SENALT + SENACOLOR. Re-loading a changed pattern under an existing name is unreliable.
- Changing the template: OPEN the .dwt (not NEW), make the change, run SENAUNITS and SENALTCHECK, SAVEAS the same name — after copying the previous .dwt into Archive\<date>\. PURGE carefully: SW_SIDEWALK, SW_DRIVEWAY, SW_DASH, SW_PHANTOM and SW_DOT are not used by a layer and PURGE All deletes them (SENALT restores them).
- Changing this guide: update the revision and date on page 1, keep it the only procedure document, and archive the previous revision.
- Folder paths are never hard-coded in the procedure — the scripts find their files on the support path. If you move the folder, only the BricsCAD support path needs updating.
# Appendix A — Layer standard
Names follow UTILITY-PLACEMENT-STATUS: FBR fiber, PWR power, COM third-party comm, GAS, WAT water, SAN sanitary, STM storm, IRR irrigation, MSC misc; UG underground, OH/AER overhead/aerial, BORE, DROP, POLE, HH handhole, STR structure; P proposed, E existing. V- = survey base, TB- = titleblock, G- = general sheet. Placement is its own field because buried power conflicts with a buried fiber trench and overhead power does not.
Colour, linetype and lineweight below are what SENACOLOR applies. "Template" means the layer is set in the template and SENACOLOR leaves it alone.

| Layer | Colour (RGB) | Linetype (code) | LW | Use |
|---|---|---|---|---|
| FBR-UG-P | 255,102,0 | Continuous | 0.50 | Proposed underground fiber<br>conduit |
| FBR-BORE-P | 255,102,0 | SW_FIBER_BORE | 0.50 | Proposed directional bore |
| FBR-AER-P | 255,102,0 | SW_FIBER_AER | 0.50 | Proposed aerial fiber |
| FBR-DROP-P | 255,102,0 | SW_FIBER_DROP | 0.25 | Proposed service drop |
| FBR-HH-P | Template |  |  | Proposed handhole symbol |
| FBR-STR-P | Template |  |  | Proposed structure: ped, cabinet, splice, slack, MST, bore pit, drop box, manhole |
| FBR-LBL | Template |  |  | Fiber labels and callouts |
| FBR-UG-E | 191,95,0 | SW_FO (FO) | 0.13 | Existing underground fiber |
| FBR-AER-E<br>FBR-STR-E | Template |  |  | Existing aerial fiber<br>existing structures |
| PWR-UG-E | 204,0,0 | SW_POWER (E) | 0.13 | Existing buried power — conflict with buried fiber |
| PWR-OH-E | 204,0,0 | SW_OHP (OH) | 0.13 | Existing overhead power |
| PWR-POLE-E | Template |  |  | Poles, towers, guys, streetlights |
| COM-UG-E | 128,64,0 | SW_COMM (T) | 0.13 | Existing buried comm<br>telephone |
| COM-OH-E | 128,64,0 | SW_OHP (OH) | 0.13 | Existing overhead comm |
| GAS-UG-E | 191,143,0 | SW_GAS (G) | 0.13 | Existing gas |
| WAT-UG-E | 0,102,204 | SW_WATER (W) | 0.13 | Existing water |
| SAN-UG-E | 0,140,70 | SW_SEWER (S) | 0.13 | Existing sanitary sewer |
| STM-UG-E | 0,176,176 | SW_STORM (ST) | 0.13 | Existing storm drain |
| IRR-UG-E | 153,0,204 | SW_IRR (IR) | 0.13 | Existing irrigation |
| MSC-E | Template |  |  | Signs, signals, RR crossing arms |
| V-ROW | 128,128,128 | SW_RW (R/W) | 0.18 | Right of way |
| V-PARCEL | 160,160,160 | SW_DASHFINE | 0.09 | Parcel lines |
| V-ROAD | 80,80,80 | Continuous | 0.25 | Edge of pavement<br>back of curb |
| V-ROAD-CL | 128,128,128 | SW_CENTER | 0.13 | Road centreline |
| V-WALK | 128,128,128 | Continuous | 0.13 | Sidewalk |
| V-BLDG | 80,80,80 | Continuous | 0.20 | Buildings |
| V-FENCE | 128,128,128 | SW_FENCEX | 0.13 | Fence |
| V-RAIL | 80,80,80 | SW_RAIL | 0.20 | Railroad |
| V-VEG<br>V-ANNO | Template |  |  | Trees<br>base annotation |
| TB-BORDER, TB-TEXT, TB-ATTR, TB-GRID | Template |  |  | Titleblock; TB-GRID = sheet index polygons (no-plot) |
| G-VPORT | Template |  |  | Viewports and clip boundaries — ON, no-plot |
| G-MATCH<br>G-KEYNOTE | Template |  |  | Matchlines<br>keynotes and leaders |
| G-KEYMAP, G-KEYMAP-TXT, KM-HL, TB-KEYMAP-IMG | made by SENASIDE |  |  | Key map linework, numbers, highlight, basemap picture |
| DETAIL-LINEWORK<br>-TEXT<br>-FILL | Template |  |  | Notes and detail sheets |


Proposed fiber carries no letter code: it is identified by its heavier weight and colour, so it can never read as an existing utility. Letter codes also appear in the legend labels, e.g. "EXIST GAS (G)".
# Appendix B — Symbol library
The blocks in the template and in Support\SENAWAVE-FIBER-SYMBOLS.dxf. Drawn in feet, insert at scale 1 for 1" = 50' (for another plot scale, scale = target feet-per-inch ÷ 50). Symbol linework is forced Continuous and BYLAYER, so each symbol takes its layer's colour. Place them with INSERT or PT2BLK.
Colours shown are the library file's own; in a project drawing each symbol takes the colour of its layer.

| Block | Layer |
|---|---|
| HH-PROP-17X30, HH-PROP-24X36 | FBR-HH-P — both draw the same boxed "HH"; call out the size in a plan label |
| MANHOLE-AIO, PED, CABINET-BOX, CABINET-CIRC, DROP-BOX, BORE-PIT, SPLICE, SLACK-LOOP, SLACK-LOOP-50, MST-CALLOUT | FBR-STR-P |
| HH-EXIST | FBR-STR-E |
| POWER-POLE, DOWN-GUY, TOWER, STREET-LIGHT, GROUND-ROD | PWR-POLE-E |
| XFMR | PWR-UG-E |
| FIRE-HYDRANT, WATER-VALVE, WATER-METER | WAT-UG-E |
| GAS-VALVE | GAS-UG-E |
| CATCH-BASIN, CULVERT | STM-UG-E |
| IRRIGATION | IRR-UG-E |
| SIGN, TRAFFIC-SIGNAL, RR-CROSSING-ARM | MSC-E |
| TREE | V-VEG |


# Appendix C — Old and ArcGIS layer names
What SENAMIGRATE does to layers with old names. Anything mapped to PWR-OH-E must be checked: those old names carried no buried/overhead flag.

| Old layer | Standard | Old layer | Standard |
|---|---|---|---|
| ELEC-POWER | PWR-POLE-E | SW-HH-PROP | FBR-HH-P |
| FBR-HANDHOLE | FBR-HH-P | SW-POWER-DISTRIBUTION | PWR-OH-E  (verify) |
| FBR-STRUCT | FBR-STR-P | SW-POWER-TRANSMISSION | PWR-OH-E  (verify) |
| FBR-ROUTE-PROP | FBR-UG-P | SW-POWER-POLES | PWR-POLE-E |
| FBR-ROUTE-EXIST | FBR-UG-E | SW-POWER-SUBSTATIONS | PWR-POLE-E |
| FBR-CONDUIT | FBR-UG-P | SW-RAILROAD | V-RAIL |
| FBR-BORE | FBR-BORE-P | SW-ROAD-CL | V-ROAD-CL |
| FBR-AERIAL | FBR-AER-P | SW-ROAD-EDGE | V-ROAD |
| FBR-DROP | FBR-DROP-P | SW-ROW | V-ROW |
| GAS | GAS-UG-E | SW-PARCELS | V-PARCEL |
| WATER | WAT-UG-E | SW-SIDEWALK | V-WALK |
| STORM | STM-UG-E | SW-BUILDING-FOOTPRINTS | V-BLDG |
| IRRIGATION | IRR-UG-E | SW-FENCE | V-FENCE |
| STRUCT-MISC | MSC-E | SW-TREES | V-VEG |
| VEG-TREE | V-VEG | SW-ANNO | V-ANNO |
| SYM-LABEL | FBR-LBL | SW-REF | V-ANNO |
| SW-FIBER-PROP | FBR-UG-P | SW-SHEET-INDEX | V-ANNO |


SENAMIGRATE assigns the old stock linetypes as it goes. Always follow it with SENALT and SENACOLOR.

