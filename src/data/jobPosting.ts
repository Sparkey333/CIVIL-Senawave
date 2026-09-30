// The Indeed posting that started this engagement (captured 2026-09-29; the posting has since expired on Indeed).
export const JOB_POSTING = {
  title: 'Professional Engineer (PE) – Fiber Network Design (Contract, Remote – Utah License Required)',
  company: 'Senawave',
  indeedRating: '2.6',
  location: 'Remote',
  pay: '$75 – $100 an hour',
  type: 'Contract / 1099',
  status: 'Expired on Indeed (captured 2026-09-29)',
  sourceNote: 'Indeed job page; screenshot kept with the project files.',
  about:
    'Senawave Communications is a Utah-based telecom and internet service provider building out fiber infrastructure across northern Utah, including BEAD-funded routes. We design and construct buried fiber networks through municipal right-of-way, UDOT corridors, and private easements.',
  role: [
    "We're looking for a licensed Professional Engineer to serve as Engineer of Record for our fiber route designs. You'll provide engineering direction and review over plan sets prepared by our in-house design team, then seal the drawings submitted for municipal, county, and UDOT permitting.",
    'This is ongoing contract work on a per-project basis. Volume is steady and scales with our construction schedule. Work is fully remote; occasional site familiarization is welcome but not required.',
  ],
  duties: [
    'Serve as Engineer of Record on buried fiber route designs (trenching, directional boring, plowed installations, road and utility crossings)',
    'Provide engineering direction to our in-house designers and review plan sets in sufficient detail to exercise responsible charge under Utah Admin Code R156-22',
    'Review depth-of-cover, separation, and crossing details against applicable standards and utility requirements',
    'Seal and sign plan sets for submission to municipalities, counties, and UDOT',
    'Respond to permitting agency comments and redline cycles',
    'Advise on design standards and constructability as routes are developed',
  ],
  required: [
    'Active Professional Engineer (PE) license in the State of Utah, in good standing — any discipline',
    'Ability to serve as Engineer of Record and exercise responsible charge over work prepared by others',
    'Experience reviewing and sealing civil site, utility, or underground infrastructure plan sets',
    'Familiarity with plan review and permitting processes for work in public right-of-way',
    'Ability to read and mark up drawings produced in ArcGIS Pro / CAD and returned as PDF',
    'Professional liability (E&O) insurance, or willingness to obtain it',
  ],
  preferred: [
    'Prior Engineer of Record experience on telecom or fiber outside plant projects',
    'Experience with UDOT encroachment permitting and Utah municipal ROW permitting',
    'NCEES record or comity licensure in neighboring states',
    'Familiarity with BEAD or other federally funded broadband program requirements',
    'Working knowledge of Blue Stakes / 811 utility coordination and existing-utility conflict resolution',
  ],
  details: ['Contract / 1099 engagement, per-project or hourly', 'Fully remote', 'Flexible scheduling; turnaround expectations set per plan set', 'Consistent, recurring work as our buildout continues'],
  howToApply:
    'Submit your resume along with your Utah PE license number and a short note describing fiber, utility, or underground infrastructure projects you\'ve sealed.',
};

/** What the posting implies for the design side (your seat): the deliverable the PE expects from the in-house team. */
export const DESIGN_TEAM_IMPLICATIONS = [
  'Plan sets are produced in-house in ArcGIS Pro + CAD (BricsCAD per the Plan Production Guide) and handed to the PE as PDF for markup — keep the PDF set the unit of review.',
  'The PE exercises "responsible charge" under Utah Admin Code R156-22, so redline cycles with the Engineer of Record are a formal step: track redlines per sheet and close them before sealing.',
  'Submittals go to municipalities, counties and UDOT (encroachment permits) — track each agency separately, with comment/resubmittal rounds.',
  'Depth-of-cover, separation and crossing details are the review focus — call them out on the plan sheets and in the notes sheets, not only in the drawing.',
  'BEAD-funded routes carry federal program requirements (documentation, locations served) — keep funding source on every project record.',
  'Blue Stakes / 811 coordination and existing-utility conflicts are expected design inputs — the layer standard already separates buried from overhead power for this reason.',
];
