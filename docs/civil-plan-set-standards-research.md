# Civil Site Development Plan Sets: What a Standard, Approvable Set Looks Like

Research compiled 2026-10-15 from public municipal checklists, agency CAD and plan-preparation manuals, and civil plan sets posted on town and county websites. Links are in the Sources section at the end.

Scope: a small-to-mid commercial or multifamily site (one building or a few, parking, utilities, stormwater). Goal: a set that is simple, complete, and reads the way reviewers and contractors expect, without padding.

---

## 1. The aerial-imagery question (short answer)

**Do not put an aerial photo under your Existing Conditions, Demolition, Site, Grading, Utility, or Plan-and-Profile sheets.** Keep it to the cover sheet vicinity map and, if useful, one standalone context or overall exhibit sheet.

Why that is the mainstream answer:

- **Caltrans CADD Users Manual** states that raster imagery such as aerial photos is not to be used as background for plan sheets such as layouts, drainage, utilities, or pavement delineation. Aerials belong only on dedicated Aerial Identification sheets or a detail sheet that needs to emphasize one unique location, and only when an engineering need justifies it. It also notes photos clutter plan sheets and suit preliminary plans better than final contract plans.
- **DoD civil/site chapter** allows an aerial photo in place of survey only at the conceptual level when survey data is not yet available, and requires the photo date to be noted. Construction-level drawings are survey-based.
- **Port of Portland CAD standards** state that aerial images are not accepted for use as a site plan.
- **USACE Mississippi Valley Division CAD supplement** requires that any aerials that do appear be plotted in grayscale, and that existing or unchanged features be screened (half-tone).
- **Caltrans PPM** requires the aerial's date and source to be noted wherever one is shown, because an outdated photo can mislead bidders about field conditions.
- **Philadelphia ePlan standards** require any reference drawing or image to be labeled or watermarked as reference only.
- **City of Mesa CAD standards** treat the aerial as a separate reference file (xref), scaled to the project horizontal datum with the grid-to-ground factor applied. That is the right CAD setup: the photo is a reference you can toggle, never part of the sheet's base linework.
- **Arlington County, VA** is the one jurisdiction found that asks for an aerial. It wants a current aerial or orthophoto of the full site and surrounding blocks as a context exhibit with the site plan application. That is an entitlement exhibit, not a construction sheet.

Practical reasons behind these rules:

- A photo is not survey. Free imagery is rarely rectified to your boundary and topo. Where it misaligns by a few feet, the contractor and reviewer now have two conflicting "existing" sources on one sheet.
- Half-size prints and reviewer PDFs. Screened linework over a photo becomes unreadable at 11x17, and most reviewers read on screen or at half size.
- Reproduction. Many agencies still require grayscale-plottable sheets. Photos muddy lineweights and hatch.
- Liability and dating. Imagery goes stale. The sheet has to carry a date and source note, and if the photo shows a shed that was removed last year the set now misrepresents conditions.
- File performance. Civil 3D users report large aerials bog down plan-and-profile sheets. Agency tips recommend low-res captures and toggling imagery off.

So, to the specific question "existing, proposed, or both": **neither** for the permit/construction sheets. Use it, if at all, on:

| Where | Use aerial? | Treatment |
|---|---|---|
| Cover sheet vicinity/location map | Optional | Small inset, grayscale OK, north arrow, site outlined |
| Standalone "Overall Site / Context Exhibit" sheet | Optional, good for boards and neighbors | Grayscale or faded color, property line and proposed footprint overlaid, note date and source, label "FOR REFERENCE ONLY, NOT A SURVEY" |
| Existing Conditions / Topo sheet | No | Screened survey linework only |
| Demolition sheet | No | Screened existing, bold or hatched removals |
| Site, Grading, Utility, ESC sheets | No | Screened existing, bold proposed |
| Plan and profile sheets | No | Same |
| Offsite drainage area map (if required) | Sometimes | Grayscale aerial or USGS/LiDAR base is common for watershed maps, since the area exceeds the survey |

If you do place an aerial on an exhibit: send it to the back with DRAWORDER, screen it (grayscale, roughly 50 to 70 percent fade, set in your plot style or image transparency), keep survey linework on top, and add a dated source note.

---

## 2. Real plan sets found online (for studying layout and content)

The public web rarely hosts truly "approved and stamped" sets because approved sets live in permit portals. These are the best examples located; all are PDFs on town, city, or agency sites. Some are stamped bid or contract sets, some are permit-level review sets.

| Set | Type | Why useful |
|---|---|---|
| Ogden City, UT, Lester Park Phase 1 "Contract-Stamped" | Stamped contract set, public park sitework | A real stamped construction set posted by the owner |
| Ann Arbor, MI, ITB 4780 contract drawings | Public-works bid set | Municipal utility plan-and-profile conventions |
| Pembroke, MA, Bohler civil set | Permit-level multifamily set | Clean Bohler-style index: C-101 Cover, C-102 General Notes, C-103 Jurisdictional Notes, C-201 Demolition, C-301 Site, C-401 Grading and Drainage, C-501 Utility, C-801 Erosion and Sediment Control, C-901 to C-906 Details, L-series landscape |
| Cranston, RI, McDonald's site plan (Bohler) | Commercial permit set | Same numbering pattern, small commercial scale |
| Hanover Township, NC, Highland hotel plans | Commercial permit set | Same pattern, hotel site |
| Walpole, MA, Summer Street multifamily (Howard Stein Hudson, 65 sheets) | Permit set | Example of a larger set using C.1, C.2 numbering, "Sheet 1 of 65" |
| Walpole, MA, Bohler multifamily (updated set) | Preliminary review set | Index and general notes; notes that only approved, signed and sealed plans may be used for construction |
| Mint Hill, NC, 4500 Morris Park Dr civil construction plans | Small commercial | Eight-sheet set: cover, notes, existing conditions, site, utility, grading, details (C1.0 to C5.2) |
| Winchendon, MA, civil permit plans (Nov 2022) | Permit set | Another compact New England permit set |
| Delaware OMB bid set (MJ4506000006) | Public bid set | Uses C-101 Site, C-301 Grading, C-501 Utility |
| El Paso County, CO, substation construction documents | Public bid set | Uses C-101 Horizontal Control, C-201 Site, showing numbering is not universal |
| Garrett College STEM bid drawings (2017) | Public bid set | Existing/demolition site plan, grading, ESC sheets |
| Connecticut Siting Council, Racebrook Solar civil site plan set (Oct 2025) | Permit set | Overall site, layout and materials, grading/drainage/utility sheets |
| Monterey Peninsula RPD outdoor classroom bid set | Public bid set | Small-site example |
| Minnesota SWLRT Civil West Volume 2 (60% submittal) | Transit civil package | Large-project plan-and-profile sheet naming (W1-CIV-PRF-###) |
| NRC-hosted feasibility set | Not for construction | Index pattern C-1.0 Existing Conditions and Survey Control, C-1.1 Demolition, C-2.0 General Site Plan |

Practical tip for finding stamped approved sets in your own area: search the jurisdiction's planning commission or planning board agenda packets (they attach full civil sets), the public works bid page (contract sets are stamped), and permit portals such as Raleigh's development plan archive.

---

## 3. A standard, simple-but-complete sheet set

Consensus from the Ann Arbor, Denton, Frisco, Lancaster OH, Wake Forest, Tolleson, Rolesville, Selma, McKinney, and Gilroy checklists, plus the Bohler-pattern sets above. Use National CAD Standard sheet types: C-0xx general, C-1xx plans, C-2xx profiles/elevations, C-3xx sections, C-5xx details. Many firms instead use C-101 Cover, C-201 Demo, C-301 Site, etc. Either is accepted. Pick one and keep the index in sheet order with a count that matches the set.

### Recommended index (10 to 14 sheets for a typical small commercial site)

| Sheet | Title | Contents |
|---|---|---|
| C-001 (or C-101) | Cover Sheet | Project name and address, owner, engineer, surveyor; vicinity map (aerial OK here); sheet index; site data table (zoning, parcel, area, impervious, parking); benchmark and datum statement; engineer's seal; agency approval block and signature lines; utility contact list or 811 note |
| C-002 | General Notes and Legend | General, grading, utility, paving, ESC notes; legend of existing (screened) vs proposed (bold) symbols and linetypes; abbreviations; standard jurisdiction notes verbatim if required |
| C-100 | Existing Conditions / Topographic Survey | Boundary with bearings and distances, easements, adjoiners, benchmarks, existing contours and spot grades, trees, structures, pavement, all existing utilities with rim and invert elevations, floodplain and wetlands lines. Extend topo at least to the ROW centerline and ideally 50 to 100 ft beyond the site. Often the surveyor's sheet, sealed by the surveyor |
| C-101 | Demolition Plan | Items to be removed (hatched or heavy dashed), items to remain and protect, tree protection, limits of disturbance, utility abandonment and cap notes. Combine with C-100 on small sites if it stays legible |
| C-200 | Site Plan (Layout and Dimensioning) | Building footprint and FFE, curb and pavement with dimensions and radii, parking with counts and ADA, sidewalks, setbacks, easements, striping and signage, dumpster, light pole locations (if civil), horizontal control or coordinates. No contours, no utilities except where they dictate layout |
| C-300 | Grading and Drainage Plan | Existing contours screened, proposed contours bold, spot elevations at curbs, corners, ADA routes, doors, high and low points; storm structures and pipes with size, slope, material; retaining walls with TW/BW; drainage arrows; ponds or BMPs with contours and outlet. Keep underground dry utilities off this sheet |
| C-301 | Stormwater Management / BMP Plan and Details | Only if the jurisdiction wants BMPs separated: pond or underground detention sections, outlet control structure detail, drainage area map (may use grayscale aerial or LiDAR base for offsite area) |
| C-400 | Utility Plan | Water (size, fittings, valves, hydrants, meter, backflow), sanitary (manholes, cleanouts, inverts, slope), storm shown lightly for conflicts, fire line, dry utility conduits by reference. Crossings and separations called out |
| C-401 to C-40x | Plan and Profile Sheets | Public or long private sanitary, storm, and water mains. See Section 4 |
| C-500 | Erosion and Sediment Control Plan (phases as required) | Perimeter controls, inlet protection, stabilized construction entrance, concrete washout, stockpile, phasing notes, ESC details or reference, SWPPP data as required |
| C-600 | Paving, Signing and Striping (optional) | Only if the site plan is too busy or the jurisdiction wants pavement sections separated |
| C-700 series | Site Details | Curbs, pavement sections, sidewalk and ADA ramps, dumpster pad, signs |
| C-701 series | Utility and Storm Details | Manholes, inlets, trench, thrust blocks, hydrants, cleanouts; cite agency standard detail numbers rather than redrawing where the agency allows |
| L-100, L-500 | Landscape Plan and Details | Separate discipline, usually required by zoning |
| E-100 | Site Lighting / Photometrics | Separate discipline, if required |

Rules of thumb that recur in the checklists:

- **One purpose per sheet.** Ann Arbor says underground utilities do not go on the grading sheet. Rolesville says demo can be on existing conditions only if it stays legible. Caltrans says when a layout gets crowded, move work to other sheets rather than cramming.
- **Every sheet** carries north arrow, graphic bar scale, written scale, title block with engineer's name, address, license number, seal and signature, sheet title, sheet number, revision block, and benchmark on grading and utility sheets.
- **Existing is screened or dashed and light; proposed is solid and bold.** This convention appears in EBMUD, WMATA, San Diego, Arlington County, and USACE standards. Set the screening in the plot style (CTB/STB), not by drawing gray lines.
- **Match the sheet index to the set.** Reviewers check the count.
- **Sealing.** Approval sets are signed and sealed on every sheet by the licensee of record. The survey sheet is sealed by the surveyor. Preliminary sets are stamped "Preliminary, Not for Construction."

---

## 4. Plan and profile sheet conventions

From Ann Arbor, Madera, Sutter County, Franklin WI, Los Gatos, Elk Grove, Clinton Twp MI, Denton, Palm Springs, Salisbury MD, Sedgwick County, Scottsdale, Spartanburg Water.

- **Layout.** Plan view on top, profile directly below, on the same sheet, with the profile stationed to match the plan. Franklin WI and Ann Arbor both require this pairing on one sheet.
- **Scales.** The most common pairing is 1"=40' horizontal with 1"=4' vertical, or 1"=20' with 1"=2' in congested areas (Ann Arbor, Madera, Denton, Salisbury, Palm Springs). Sutter County allows 20/40/50 horizontal with 2/4/5 vertical. Spartanburg caps sewer at 1"=100' by 1"=10'. Use only the scale the sheet is set up for.
- **Profile content.** Existing grade (dashed, screened) and proposed finish grade (solid) along the pipe, labeled. Each structure with station, rim or top, and invert in and out. Pipe runs labeled with length, size, material, class, and slope. Crossing utilities, existing and proposed, shown and dimensioned for vertical clearance. Hydraulic grade line for storm when the agency asks (Scottsdale). Stationing every 50 or 100 ft; centerline elevations at 50 ft and vertical curve elevations at 25 ft on road profiles (Elk Grove).
- **Separate profiles per utility** where they are not in a common trench (Clinton Twp).
- **Plan view.** Station labels, structure numbers matching the profile, pipe labels in plan or profile but consistent, easements and ROW lines, match lines to adjacent sheets.
- **Datum.** Benchmark description and datum (NAVD88 or local) on each profile sheet.

---

## 5. Drafting and submittal basics that reviewers check

| Item | Common requirement |
|---|---|
| Sheet size | 24x36 most common; 22x34 accepted in some places; half-size 11x17 PDF often requested |
| Site plan scale | 1"=20' preferred for small sites; 1"=30' or 1"=40' maximum in many checklists (Alexandria no smaller than 1"=30'; Clark County NV no smaller than 1"=40') |
| Text height | Minimum 0.1" on full size (Gig Harbor; Wildomar requires 1/10" machine lettering) |
| Line conventions | Existing screened or dashed; proposed solid bold; demolition hatched or heavy dashed |
| Title block | Engineer name, address, license number, seal and signature, project, sheet title and number, date, revision log |
| Control | Benchmarks and horizontal control ties on pertinent sheets (McKinney ties to city GPS monuments) |
| Submittal | Single combined PDF, sequentially numbered, landscape, flattened single layer; some agencies also want half-size sets and CAD |
| Legend and abbreviations | On cover or notes sheet, covering every symbol used |
| Approval block | Agency signature block on cover and often on each sheet |

---

## 6. Suggested answer for your workflow

1. Build the set off the sealed topographic survey as the base xref. Screen it.
2. No aerial on C-100 through the profiles. If the client or board wants to "see" the site, add one Context Exhibit sheet with a grayscale, dated aerial and the footprint overlaid, labeled for reference only.
3. Keep the vicinity map on the cover; an aerial inset there is fine.
4. Use the 10 to 14 sheet index above. Drop C-301 and C-600 if the site is simple. Add plan-and-profile sheets only for mains that are public or long enough to need stationing.
5. Pull the actual checklist from the reviewing agency before drafting and mirror its sheet names. Local rules control everything above.

---

## Sources

Standards and manuals
- Caltrans CADD Users Manual, Ch. 4 (raster imagery on plan sheets): https://dot.ca.gov/-/media/dot-media/programs/design/documents/cadd/caddman-ch4-sect1-a11y.pdf
- Caltrans Plans Preparation Manual, Ch. 2 Sect. 2-4 (aerial identification sheets, date and source): https://dot.ca.gov/-/media/dot-media/programs/design/documents/cadd/ppm-text-ch2-sect2-4-a11y.pdf
- Caltrans PPM, Ch. 2 Sect. 1 and 2-5 (layout crowding): https://dot.ca.gov/-/media/dot-media/programs/design/documents/cadd/ppm-text-ch2-sect1-a11y.pdf and https://dot.ca.gov/-/media/dot-media/programs/design/documents/cadd/ppm-text-ch2-sect2-5-a11y.pdf
- DoD Chapter 3 Civil/Site Development Engineering (aerial at conceptual level, site plan scale): https://media.defense.gov/2024/May/23/2003471378/-1/-1/0/CHAPTER%203%20-%20CIVIL-20230823%20(002).PDF
- USACE Mississippi Valley Division A/E/C CAD Standard Supplement (screened existing, grayscale aerials): https://www.mvd.usace.army.mil/portals/52/docs/mvd-cad-std-40.pdf
- Port of Portland CAD Standards Manual (aerials not accepted as site plan): https://cdn.portofportland.com/eng-specs-gdline/PART%203%20-%20CAD%20STANDARDS.pdf
- City of Mesa Engineering CAD Standards (aerial reference file): https://www.mesaaz.gov/files/assets/public/v/1/business-development/engineering/engineering-cad-standards.pdf
- City of San Diego CADD Standards 2018 (dashed existing): https://www.sandiego.gov/sites/default/files/city_computer_aided_design_and_drafting_cadd_standards_2018_edition.pdf
- Arlington County VA CADD Standards (existing dashed, proposed solid): https://arlingtonva.s3.amazonaws.com/wp-content/uploads/sites/21/2013/12/CADD-Standards-and-Guidelines.pdf
- Arlington County VA Site Plan Drawing Specifications (aerial context exhibit): https://www.arlingtonva.us/files/sharedassets/public/v/4/building/documents/review-processes/administrative-regulation-4.1/site-plan-drawing-specifications-12.20.24.pdf
- Philadelphia ePlan Submission Standards (reference-only labeling, C- prefix): https://www.phila.gov/media/20210222130550/P_024_INF_ePlan-Submission-Standard-Fact-Sheet.rev-2.22.21.pdf
- EBMUD Drafting Guidelines, Screened Lines: https://www5.ebmud.com/specsinternet/projects/01%20Drafting%20Guidelines/FacHelp/Screened_Lines.htm
- WMATA 2014 CAD Standards (screened linework, NCS line widths): https://www.wmata.com/business/procurement/solicitations/documents/WMATA%202014%20CAD%20Standards_Approved.pdf
- Archtoolbox, Construction Document Sheet Numbers (NCS sheet types): https://www.archtoolbox.com/construction-document-sheet-numbers/
- University of Houston CAD Standards Appendix B, Sheet Type Designators: https://uh.edu/facilities-planning-construction/vendor-resources/cad-standards/appendix-b---sheet-type.pdf
- Gresham OR CAD Manual (topo 100 ft beyond site): https://www.greshamoregon.gov/globalassets/city-departments/environmental-services/public-works-standards/cad-manual.pdf?id=8897
- Wisconsin DOT FDM 15-5 (JPEG for aerial backgrounds): https://wisconsindot.gov/rdwy/fdm/fd-15-05.pdf
- Montana DOT Civil 3D tips (aerial draw order, resolution): https://www.mdt.mt.gov/other/webdata/external/esdc/library/Tip-ImportAerialSurveyTIFFsIntoC3D.pdf
- Envision CAD, Adding Aerial Imagery to Civil 3D: https://envisioncad.com/civil-3d-tip-adding-aerial-imagery-to-your-drawings/
- Autodesk Community, Aerial Background Issues: https://forums.autodesk.com/t5/civil-3d-forum/aerial-background-issues/td-p/8687363

Municipal checklists (sheet lists, scales, profile content)
- Ann Arbor MI Civil Construction Plan Checklist: https://www.a2gov.org/media/riel2xit/civil20construction20plan20checklist20-20final.pdf
- University of Michigan AEC Civil Sheet Set-up Checklist: https://umaec.umich.edu/desguide/2.0-Procedures/Civil-Sheet-Set-up-Checklist.pdf
- Denton TX Civil Engineering Plans Checklist (Feb 2026): https://www.cityofdenton.com/DocumentCenter/View/479/Civil-Engineering-Plans-Checklist-PDF
- Frisco TX Construction Plan Checklist: https://www.friscotexas.gov/DocumentCenter/View/1363/Checklist-Construction-Plan-PDF
- Lancaster OH Site Engineering Requirements: https://lancasterohio.gov/DocumentCenter/View/1559/Site-Engineering-Requirements?bidId=
- Wake Forest NC Construction Plans Checklist (Jan 2026): https://www.wakeforestnc.gov/sites/default/files/uploads/planning/Forms/construction_plans_checklist_jan_2026.pdf
- Rolesville NC Construction Infrastructure Drawings Checklist: https://www.rolesvillenc.gov/sites/default/files/uploads/projects/documents/v1_cid-24-06_2_cid-checklist.pdf
- Colonial Heights VA Site Development Design Checklist: https://www.colonialheightsva.gov/DocumentCenter/View/898/Site-Development-Design-Checklist
- McKinney TX Engineering Development Plan Review Checklist: https://www.mckinneytexas.org/DocumentCenter/View/395/Engineering-Development-Plan-Review-Checklist
- Tolleson AZ Civil Construction Document Submittal Checklist: https://www.tolleson.az.gov/DocumentCenter/View/5700/Civil-Construction-Document-Submittal-Checklist
- Gilroy CA Minimum Plan Submittal Guidelines: https://www.cityofgilroy.org/DocumentCenter/View/7709/Minimum-Residential-Plan-Submittal-Guidelines-Handout-2018
- Selma NC Site Plan Application: https://selma-nc.com/wp-content/uploads/2025/07/ZONING-PERMIT-SITE-PLAN-commercial-or-multi-family.pdf
- Chandler AZ Civil Improvement Plan Check: https://www.chandleraz.gov/sites/default/files/documents/imported/UDM_CivilImprovPlanCheck.pdf
- Madera CA Section 27 (plan and profile scales): https://www.madera.gov/wp-content/uploads/2016/04/SECTION-27.pdf
- Sutter County CA improvement plan standards: https://suttercounty.org/home/showpublisheddocument/2616/637554857479270000
- Franklin WI Design Standards Ch. 2: https://www.franklinwi.gov/Files/Engineering/ConstructionDesignStandards/Chap2-Updated-Design-Stds-4-7-2021.pdf
- Los Gatos CA plan standards: https://losgatosca.gov/common/modules/documentcenter2/documentview.asp?DID=384
- Elk Grove CA Improvement Standards Sect. 3: https://www.elkgrovecity.org/sites/default/files/city-files/Departments/Public%20Works/improvement-standards/section-03-020907.pdf
- Clinton Township MI code (profiles per utility): https://dev-codelibrary.amlegal.com/codes/clintontwp/latest/clintontwp_mi/0-0-0-21086
- Salisbury MD As-Built Checklist (rim, invert, scales): https://salisbury.md/wp-content/uploads/2024/07/As-Built-Checklist-for-Utilities-Public-Infrastructure-July-29-2024.pdf
- Spartanburg Water Sewer As-Built Checklist: https://spartanburgwater.org/files/files/Sewer_As-Built_Checklist_rev_7.13.2023.pdf
- Scottsdale AZ Grading and Drainage Checklist (HGL): https://ww2.scottsdaleaz.gov/Assets/ScottsdaleAZ/Building/Grading+and+Drainage+Checklist.pdf
- Palm Springs CA storm drain checklist: https://www.palmspringsca.gov/home/showpublisheddocument/16635/638787464544330000
- Sedgwick County KS storm sewer sheet requirements: https://www.sedgwickcounty.org/media/61569/45-volume-3-09-appendix-g.pdf
- Clark County NV Grading Plan Review Checklist: https://files.clarkcountynv.gov/Grading%20Plan%20Review%20Checklist.pdf
- Alexandria VA Grading Plan Checklist: https://media.alexandriava.gov/docs-archives/tes/info/grading-plan-checklist-2019-update-final-=1=.pdf
- Gig Harbor WA Civil Land Use Checklist (text height): https://www.gigharborwa.gov/DocumentCenter/View/2970/Civil-Land-Use-Checklist
- Wildomar CA plan requirements (lettering): https://wildomar.gov/DocumentCenter/View/364
- Ridgefield WA Engineering Standards (sheet sizes): https://ridgefieldwa.us/DocumentCenter/View/2508/2024-Engineering-Standards-Volume-1-PDF
- Keizer OR Storm Drainage Standards Ch. 4: https://evogov.s3.amazonaws.com/media/60/media/17106.pdf
- Permit Arlington online submission guidelines (sheet numbering, PDF format): https://www.arlingtonva.us/Government/Programs/Building/Permits/Apply-Online/Guidelines
- NPS Design Development and CD deliverables: https://www.nps.gov/dscw/del_designdevelopdb.htm and https://www.nps.gov/dscw/del_constructiondbb.htm

Example plan sets
- Ogden City UT, Lester Park Ph 1 contract set (stamped): https://www.ogdencity.gov/DocumentCenter/View/40679/260807-LesterParkPh1-Contract-Stamped
- Ann Arbor MI, ITB 4780 contract drawings: https://www.a2gov.org/media/wfnn5ijt/itb_4780_plans.pdf
- Pembroke MA, Bohler civil set: https://www.pembroke-ma.gov/DocumentCenter/View/7981
- Cranston RI, McDonald's site plan (Bohler): https://www.cranstonri.gov/_resources/common/userfiles/file/DPRC/2024/4.17.24/McDonald's/Site%20Plan.pdf
- Hanover Township NC, Highland hotel plans: https://hanovertwp-nc.org/media/2908/2-h24-23-a-90-highland-hotel-plans.pdf
- Walpole MA, Bohler multifamily civil set: https://www.walpole-ma.gov/sites/g/files/vyhlif12086/f/pages/9_updated_civil_engineering_plan_set_prepared_by_bohler.pdf
- Walpole MA, Summer Street site plan (HSH, 65 sheets): https://www.walpole-ma.gov/sites/g/files/vyhlif12086/f/pages/19097.04_-_site_plan_1_0.pdf
- Mint Hill NC, 4500 Morris Park Dr civil construction plans: https://cms5.revize.com/revize/minthillnc/Document_Center/Department/Planning/Development%20Activity/ZC23-4%20Site%20Plans.pdf
- Winchendon MA civil permit plans: https://www.townofwinchendon.com/sites/g/files/vyhlif8401/f/events/1_-_winchendon_ma_-_civil_permit_plans_ss_11.08.22.pdf
- Methuen MA site plan: https://methuen.gov/DocumentCenter/View/1060/Site-Plan-PDF
- Newton MA site plan set: https://www.newtonma.gov/home/showpublisheddocument/124297/638670046541670000
- Delaware OMB bid set: https://bidcondocs.delaware.gov/OMB/OMB-MJ4506000006-SPECS.pdf
- El Paso County CO substation construction documents: https://epc-assets.elpasoco.com/wp-content/uploads/sites/2/procurement/Solicitations/1.-Substation-Construction-Documents.pdf
- Garrett College STEM bid drawings: https://www.garrettcollege.edu/images/stem/stem-bid-drawings.pdf
- CT Siting Council, Racebrook Solar civil site plan set: https://portal.ct.gov/-/media/csc/3_petitions-medialibrary/petitions_medialibrary/mediapetitionnos1601-1700/pe1675/petitionersubmissions/exhibit-n---civil-site-plan-set.pdf
- Monterey Peninsula RPD outdoor classroom bid set: https://www.mprpd.org/files/06e6f60c7/Item0724-6E_ApprvRFBOutdoorClassroom_Attach1.ExhibitA.Drawings.pdf
- Minnesota SWLRT Civil West Vol 2 (60%): https://www.leg.mn.gov/docs/2015/other/151010/West%20Vol2%20Civil%20Design.pdf
- NRC-hosted feasibility set: https://www.nrc.gov/docs/ML1321/ML13219A203.pdf
- City of Raleigh development plan archive: https://www.raleighnc.gov/development

Industry explainers
- RSP Engineers, What's Included in a Civil Site Plan: https://rspengineers.com/civil-engineering-blog/whats-included-in-a-civil-site-plan
- Helonic, How to Read Civil Drawings: https://helonic.com/knowledge-base/how-to-read-civil-drawings
- Site Plan Creator, Can You Use Google Maps for a Permit Site Plan: https://www.siteplancreator.com/blog/can-you-use-google-maps-to-draw-a-site-plan-for-a-permit
