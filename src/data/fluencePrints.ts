// Fluence's first two prints, the 2 Oct 2026 review (Brandon's markups) and an AI analysis.
// Read from the Drive PDFs' text layers (2026-10-01_Fluence.pdf, 2026-10-01_Fluence_2.pdf and
// 2026-10-01_Fluence_2_REVIEW-BB.pdf) and Jesse's 1 Oct email "Latest Fluence design".
// The text layer has the words on the sheets and the markup comments, not the linework.

import type { AnalysisFinding, PrintAnalysis, PrintSet, Redline } from '@/lib/types';

const FLUENCE_ID = 'prj_fluence';
const T = '2026-10-02T18:00:00.000Z';

export const FLUENCE_PRINT_V1 = 'prt_fluence_2026-10-01_v1';
export const FLUENCE_PRINT_V2 = 'prt_fluence_2026-10-01_v2';

const f = (n: number, severity: AnalysisFinding['severity'], sheet: string, issue: string, recommendation: string): AnalysisFinding => ({
  id: `fnd_fluence_v2_${String(n).padStart(2, '0')}`,
  severity,
  sheet,
  issue,
  recommendation,
  status: 'open',
});

const ANALYSIS_V2: PrintAnalysis = {
  summary:
    'Print 2 fixed the structural problems in print 1: the sheet index now matches the 16 pages, the OGDEN title blocks carry real project data, and hydrants and clean leaders are in. What is left is mostly content and consistency: one placeholder in the notes, two rules that disagree, blank materials quantities, the stamp block, and whether Ogden needs a separate traffic control plan. Your 13 redlines cover most of the cosmetic items. The findings below are what the redlines do not yet cover.',
  changes: [
    'Sheet index: print 1 listed NOTES04-1 to NOTES04-4 (20 sheets) but the PDF only had 16 pages. Print 2 drops them, so the index matches the pages.',
    'OGDEN01 to OGDEN05 title blocks: print 1 still had template placeholders (PROJECT NAME, CITY, UTAH, 26-0000, dashes). Print 2 shows Ogden 2nd St, Ogden, Utah, 26-0009 and the names and dates.',
    'Legends: EXIST FIRE HYDRANT is now in the vicinity and plan legends, matching the hydrants Jesse added and called out on the plan.',
    'PLAN-01: the stray overlapping text fragments in print 1 are gone, which fits Jesse fixing the multileader style (paper space is 1:50 of model space, so MLEADERSTYLE has to be set). The route note now reads PROPOSED PROJECT WORK / ALL DIRECTIONAL BORE instead of ENTIRE PROPOSED ROUTE IS DIRECTIONAL BORING.',
    'Station numbering changed because the first handhole is now placed accurately (Jesse, 1 Oct email). The text layer has no station labels, so this needs a look on the PDF itself.',
    'Unchanged: NOTES01 to NOTES03 text, all four DETAIL sheets, the Ogden notes, the blank revision block, the blank MATERIALS quantities and the "----------" placeholder in NOTES01 note 1.',
  ],
  findings: [
    f(1, 'high', 'All sheets', 'Project number mismatch. Every title block in both prints says 26-0009. The tracker record for this project says 26-0002.', 'Confirm the number with Jesse today, then fix the tracker project record and the Drive folder name so they agree with the title block.'),
    f(2, 'high', 'NOTES01', 'Note 1 still reads "Local permitting authorities include: ----------". It is a template placeholder that survived both prints. Your "update" redline on this sheet may be about it.', 'Fill it in: Ogden City Engineering, plus UDOT only if UDOT right-of-way stays in scope (see the NOTES03 finding).'),
    f(3, 'high', 'COVER / OGDEN01', 'Ogden requires engineered bore plans to be stamped, signed and dated by a licensed PE (OGDEN01, A.4). The cover shows ENGINEER: Brandon Barkey but no seal or signature area. You are the PE of record.', 'Add a seal and signature block to the cover (or every sheet, per Senawave standard) and plan the sealing step before submittal.'),
    f(4, 'high', 'OGDEN03', 'Ladd wants the plan submitted without the traffic control plan. The Ogden notes printed in this set list a MUTCD traffic control plan as a required permit document (E.1.b), next to the site plan and insurance and bond. Jesse said to include it only if the city asks.', 'Keep the plan set TCP-free as Ladd asked, and ask Ogden permits now whether a separate TCP is needed with the application. Log the answer as a decision note so it is not argued again later.'),
    f(5, 'medium', 'NOTES03', 'Your redline asks whether to remove the UDOT notes sheet. The Ogden notes (OGDEN01, B.5) only require UDOT notes when the work enters UDOT right-of-way. If this stays, note 5 names the "Region Two Permits Office"; Ogden and Weber County are in UDOT Region One (verify). Note 1 also restricts UDOT right-of-way work from Oct 15 to Apr 15, which starts in two weeks.', 'If 2nd St from 400 E to 500 E has no UDOT right-of-way, delete NOTES03 and its index entry (15 sheets). If it does, correct the region and tell Jesse about the Oct 15 restriction.'),
    f(6, 'medium', 'NOTES01 / OGDEN02', 'Two clearance rules disagree. NOTES01 note 19 says 5 ft from sewer and 3 ft from water and storm. Ogden (OGDEN02, C.4) requires 10 ft from water and sanitary sewer mains, 5 ft from storm, 3 ft from gas and power, 1 ft from telecom.', 'Change note 19 to defer to the Ogden offsets, or delete it for this project. The stricter number should govern on any set Ogden reviews.'),
    f(7, 'medium', 'PLAN-01', 'Your OGDEN01 redline asks to check that the plan includes everything Ogden lists. I can read words but not linework, so I cannot confirm bore path offsets, handhole positions or dimensions. The text layer shows two HH labels, hydrants in the legend, and no dimension text.', 'Walk this checklist on the PDF: bore path at least 3 ft behind curb or walk; HH not under a sidewalk, not in the ADA corner zone, not in a sight triangle; every pit and HH shown; crossing utilities and poles shown; potholing called out at road crossings; leadered easement notes where a property has no utility easement; equipment spec sheets in the set.'),
    f(8, 'medium', 'PLAN-01', 'The plan scale is labelled "1:50", which is Ogden\'s maximum. A reviewer could read 1:50 literally and not as 1 in = 50 ft. The vicinity sheet uses 1" = 100\' with a graphic scale, which is clearer.', 'Label the plan scale as 1" = 50\' and add a graphic scale bar. Do not go above 1:50, Ogden rejects larger scales.'),
    f(9, 'medium', 'PLAN-01', 'No bore depth is stated. Ogden minimum cover is 24 in, the Senawave trench detail uses 30 in, and UDOT notes require 60 in if UDOT right-of-way is touched.', 'Add one depth note on the plan sheet (design depth, and the 24 in Ogden minimum) so the contractor and reviewer see the same number.'),
    f(10, 'low', 'MATERIALS', 'All quantities are blank (your "update the quantities" redline). They depend on the new handhole position and station numbering.', 'Fill this last, after every plan change is in. Take bore length from the final alignment and handhole counts from the plan, then have Jesse check the item codes.'),
    f(11, 'low', 'All sheets', 'The revision block is empty on every sheet. That is normal for a first issue, and you asked for four more rows.', 'Add the rows once in the template so all sheets get them, and enter Rev 0 with the submittal date when it goes out.'),
    f(12, 'low', 'VICINITY / PLAN-01', 'The vicinity legend lists trench, aerial, drop, matchline, power, comm, railroad, handhole and tree. The plan legend is shorter. Ogden (OGDEN01, B.4) wants every symbol used in the set in a legend.', 'Use one legend definition for both, as your two legend redlines ask, and check that every symbol actually on the plan is in it.'),
    f(13, 'low', 'COVER / title blocks', 'Design date and field date are both 10/01/2026, the same day the prints were made. Ladd is listed as fielded by.', 'Confirm the real field date with Ladd before submittal so the title block is accurate.'),
    f(14, 'info', 'OGDEN01 to OGDEN05', 'Each Ogden sheet is marked "reference only, check for the current revision before submittal" (Ogden notes Rev 1.2025, standard drawing RD-1 2025).', 'Check the Ogden Engineering page for newer revisions before submittal, and update the source lines if they changed.'),
  ],
  basis:
    'AI read of the text layers of 2026-10-01_Fluence.pdf, 2026-10-01_Fluence_2.pdf and 2026-10-01_Fluence_2_REVIEW-BB.pdf (Drive) plus Jesse\'s 1 Oct email. I could not see linework, images, stamps or markup shapes, so nothing here is a finding about geometry. Regulatory points (UDOT region, Ogden rules) come from the notes printed in the set or general knowledge and should be verified before they go in a submittal.',
  by: 'Claude',
  at: T,
};

export function fluencePrints(): PrintSet[] {
  return [
    {
      id: FLUENCE_PRINT_V2,
      projectId: FLUENCE_ID,
      label: '2026-10-01_Fluence_2.pdf',
      issuedOn: '2026-10-01',
      by: 'Jesse Montgomery',
      fileUrl: 'https://drive.google.com/file/d/16anHtyE-3uuuRBmJdvB_koi9RMLovYD2/view',
      sheetCount: 16,
      status: 'redlined',
      summary: 'Jesse\'s 4:48 pm print: first handhole placed accurately (stations renumbered), hydrants and callouts added, multileader style fixed, index and title blocks cleaned up.',
      reviewFileName: '2026-10-01_Fluence_2_REVIEW-BB.pdf',
      reviewFileUrl: 'https://drive.google.com/file/d/1VsJN1aUQwnpGHh2UOi8-7C1TKJnQbD0H/view',
      reviewBy: 'Brandon Barkey',
      reviewOn: '2026-10-02',
      reviewNote: 'Sent to Jesse 2 Oct: "Small stuff mostly. Looks good." Call at 1 pm to go over them.',
      analysis: ANALYSIS_V2,
      createdAt: T,
      updatedAt: T,
    },
    {
      id: FLUENCE_PRINT_V1,
      projectId: FLUENCE_ID,
      label: '2026-10-01_Fluence.pdf',
      issuedOn: '2026-10-01',
      by: 'Jesse Montgomery',
      fileUrl: 'https://drive.google.com/file/d/12p-izVLusviJSusriqOwpzBYqZMf5Zd8/view',
      sheetCount: 16,
      status: 'superseded',
      summary: 'First full plot. Index listed 20 sheets for 16 pages, OGDEN title blocks still had template text.',
      reviewFileName: '',
      reviewFileUrl: '',
      reviewBy: '',
      reviewOn: '',
      reviewNote: '',
      analysis: null,
      createdAt: '2026-10-02T17:59:00.000Z',
      updatedAt: '2026-10-02T17:59:00.000Z',
    },
  ];
}

const r = (n: number, sheet: string, kind: Redline['kind'], text: string): Redline => ({
  id: `red_fluence_v2_${String(n).padStart(2, '0')}`,
  projectId: FLUENCE_ID,
  printId: FLUENCE_PRINT_V2,
  sheet,
  kind,
  text,
  by: 'Brandon Barkey',
  status: 'open',
  response: '',
  createdAt: T,
  updatedAt: T,
});

/** The 13 markup comments in 2026-10-01_Fluence_2_REVIEW-BB.pdf, word for word from the PDF text layer. */
export function fluenceRedlines(): Redline[] {
  return [
    r(1, 'COVER', 'fix', 'Add DIG stamp at least once'),
    r(2, 'VICINITY', 'check', 'Consier longer ... ADDRESS, blank to Adams Ave (the comment text is split in the PDF; read it on the sheet)'),
    r(3, 'VICINITY', 'fix', 'Trim aerial border to remove stamp'),
    r(4, 'VICINITY', 'fix', 'Shrink legend to match PLAN sheet'),
    r(5, 'NOTES01', 'fix', 'update (written next to the CONSTRUCTION NOTES title)'),
    r(6, 'NOTES03', 'check', 'remove UDOT? entire sheet'),
    r(7, 'OGDEN01', 'check', 'check plan to make sure all is included'),
    r(8, 'MATERIALS', 'fix', 'update the quantities'),
    r(9, 'PLAN-01', 'check', 'still consider EXIST only utilities separate plan sheet before this PROP sheet'),
    r(10, 'PLAN-01', 'check', 'clearer aerial? remove stamp'),
    r(11, 'PLAN-01', 'fix', 'match legend to title sheets'),
    r(12, 'PLAN-01', 'check', 'other plan sets include table here with STA, check'),
    r(13, 'PLAN-01', 'fix', 'add 4 more rows or so for more revisions'),
  ];
}
