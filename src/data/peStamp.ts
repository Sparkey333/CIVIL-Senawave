/**
 * PE seal (stamp) requirements and license lookups, Utah first (the Senawave work), then Colorado.
 * Rule text is summarised from the state rules linked in `sources`; re-check the official text before relying on it
 * for a submittal, since the mirrors can lag the current rule.
 */

export interface SealSpec {
  state: 'UT' | 'CO';
  name: string;
  /** Short line for the header card. */
  summary: string;
  shape: string;
  size: string;
  /** Text the seal must carry. */
  wording: string[];
  /** Words on the outer arcs (top, bottom) as commonly made; the rule's required elements are in `wording`. */
  arcs: { top: string; bottom: string };
  centre: string[];
  signing: string[];
  where: string[];
  electronic: string[];
  other: string[];
  sources: { label: string; url: string; note?: string }[];
  lookup: { label: string; url: string; how: string };
  renewal: string;
  vendors: { label: string; url: string; note: string }[];
}

export const SEAL_SPECS: SealSpec[] = [
  {
    state: 'UT',
    name: 'Utah',
    summary: 'Circular, 1-1/2" minimum. Signed and dated across the face. Wet, embossed or electronic.',
    shape: 'Circular.',
    size: '1-1/2 inch minimum diameter (1-3/4" is the common stamp size).',
    wording: ["The licensee's name", 'The license number', '"State of Utah"', '"Professional Engineer" (or "Professional Structural Engineer")'],
    arcs: { top: 'STATE OF UTAH', bottom: 'PROFESSIONAL ENGINEER' },
    centre: ['Licensee name', 'License number (Utah numbers end in -2202 for PE)'],
    signing: [
      'Each seal is signed and dated, with the signature and date across the face of the seal imprint.',
      'Copies of the sealed original are fine if the seal, signature and date stay clearly recognisable.',
    ],
    where: [
      'Every original set of final plans, specs, reports, drawings and plats: at least the cover or title sheet carries the original seal, signature and date.',
      'Sheets after the cover of a specification need not be sealed.',
      'Senawave / Ogden bore plans: Ogden requires the plans stamped, signed and dated by a PE (Ogden directional-bore requirements A.4). Seal every plan sheet or the cover per the Senawave title-block standard.',
    ],
    electronic: [
      'A seal may be a wet stamp, embossed, or electronically produced. Electronically generated signatures are acceptable.',
      'You must provide adequate security for documents carrying electronic seals and signatures (a certificate-based digital signature in Acrobat or Bluebeam, then lock the file).',
    ],
    other: [
      'Only you may use your seal, and only on work you prepared, supervised, or fully reviewed and corrected (Utah Code 58-22-603).',
      'An engineer intern may not use a seal.',
    ],
    sources: [
      { label: 'Utah Admin. Code R156-22-601, Seal Requirements (Utah rules site)', url: 'https://adminrules.utah.gov/public/rule/R156-22/Current%20Rules' },
      { label: 'R156-22-601 (Cornell LII mirror)', url: 'https://www.law.cornell.edu/regulations/utah/Utah-Admin-Code-R156-22-601', note: 'Mirror; may lag the current rule.' },
      { label: 'Utah Code 58-22-603, Seal: authorized use', url: 'https://law.justia.com/codes/utah/title-58/chapter-22/part-6/section-603/' },
      { label: 'DOPL Engineering FAQ', url: 'https://commerce.utah.gov/dopl/engineering/frequently-asked-questions/' },
    ],
    lookup: {
      label: 'Utah DOPL Licensee Lookup & Verification',
      url: 'https://secure.utah.gov/llv/search/index.html',
      how: 'Search by name (Barkey) or license number, profession "Professional Engineer". The record shows number, status and expiry. A $5 official verification can be emailed from the same site.',
    },
    renewal: 'Utah PE licenses expire 31 March of odd years (next: 31 Mar 2027); 30 hours of continuing education per 2-year cycle.',
    vendors: [
      { label: 'Salt Lake Stamp: Utah PE stamps, seals and embossers', url: 'https://www.saltlakestamp.com/category/professional-engineer-seal-stamp-utah', note: 'Local; wet stamp, embosser, and digital seal files.' },
      { label: 'ProStamps: Utah PE stamp and seal', url: 'https://prostamps.com/products/utah', note: 'Ships stamp plus digital seal (PNG/vector).' },
    ],
  },
  {
    state: 'CO',
    name: 'Colorado',
    summary: 'Two concentric circles, 1-5/8" outer and 15/16" inner. Signature and date through the seal.',
    shape: 'Two concentric circles. The license number is centred in the inner circle; the name sits in the band between the circles.',
    size: 'Outer circle nominally 1-5/8 inch (41 mm); inner circle nominally 15/16 inch (24 mm).',
    wording: ["The licensee's name", 'The license number (centred in the inner circle)', '"Colorado Licensed" / "Professional Engineer" around the outer band'],
    arcs: { top: 'COLORADO LICENSED', bottom: 'PROFESSIONAL ENGINEER' },
    centre: ['License number in the inner circle', 'Licensee name in the band around it'],
    signing: [
      'The manual or electronic signature of the licensee and the date of signature are affixed to the document.',
      'The signature and date appear through the seal.',
    ],
    where: [
      'Each sheet of engineering drawings, or an electronic seal on the cover page of a drawing set.',
      'A cover-page electronic seal must meet all Board rules, including a statement of the scope of work and, if relevant, the page numbers it covers.',
      'Unfinished documents must be marked preliminary.',
    ],
    electronic: [
      'The seal may be a crimp type, rubber stamp type, or computer-generated.',
      'An electronic signature carries the same weight as a manual one.',
      'If you seal electronically on the cover page(s), the rule calls for "Signature Dynamic Technology" (a certificate-based digital signature that locks the file).',
    ],
    other: [
      'Only you may use your seal, and you are personally responsible for its custody and use.',
      'Do not use a seal or a reproduction of it to promote yourself.',
    ],
    sources: [
      { label: '4 CCR 730-1, Board rules (Colorado Secretary of State PDF)', url: 'https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=7074&fileName=4+CCR+730-1' },
      { label: '4 CCR 730-1.5, Rules of Professional Engineering Practice (Cornell LII mirror)', url: 'https://www.law.cornell.edu/regulations/colorado/4-CCR-730-1.5', note: 'Mirror; section numbers differ from the SOS PDF.' },
      { label: 'Colorado PE seal rules summary (Acorn Sales)', url: 'https://acornsales.com/blogs/acorn-sales-blog/colorado-pe-seal-the-key-to-professional-engineering', note: 'Vendor summary of the arc wording; secondary source.' },
    ],
    lookup: {
      label: 'Colorado DORA: Verify a Professional or Business License',
      url: 'https://apps2.colorado.gov/dora/licensing/lookup/licenselookup.aspx',
      how: 'Enter first and last name only for best results (Brandon Barkey), or the license number. Profession: Professional Engineer. Detail shows status and expiry.',
    },
    renewal: 'Colorado PE licenses renew every two years on 31 October of odd years (next: 31 Oct 2027). Confirm the current continuing-education hours on the DPO site.',
    vendors: [
      { label: 'Rubber Stamp Warehouse: Colorado Professional Engineer Rubber Stamp', url: 'https://www.rubberstampwarehouse.com/', note: 'SKU COLORADO-PROFESSIONAL-ENGINEER, 1-5/8" impression, self-inking / pre-inked / traditional, $25.95 when you looked.' },
    ],
  },
];

/** Your licenses, as last recorded (from your résumé). Edit them on the page; the lookup is the source of truth. */
export const DEFAULT_PE_LICENSES = [
  { state: 'UT', number: '11173891-2202', expires: '2027-03-31' },
  { state: 'CO', number: '0062812', expires: '2027-10-31' },
];

/** Certification and seal are two different things; a grant office wants both. */
export const CERT_VS_SEAL = [
  { term: 'Certification', means: 'Your written professional opinion: what you reviewed, what it covers, what you conclude. It is the content.' },
  { term: 'Seal (stamp)', means: 'The mark Utah law puts on final engineering work: name, license number, signature and date. It says who is responsible (Utah Code 58-22-602, -603).' },
  { term: 'Both together', means: 'A certification statement that is signed, sealed and dated is what "PE-certified" or "stamped PDF" means to UBC and NTIA. A seal alone says nothing; a statement alone is not sealed work.' },
];

/**
 * Certifying a report or grant package (BEAD) instead of a plan set.
 * Summarised from the BEAD NOFO, NTIA's PE waiver notice, the Utah Broadband Center draft subgrant agreement
 * and R156-22-601; check the current text before a submittal.
 */
export const BEAD_CERT = {
  summary: 'One signed, sealed certification page per subgrant project, attached to the final package. Not per location.',
  rule: [
    'BEAD NOFO §IV.D.2.c: before the first disbursement the subgrantee submits a network design, diagram, project costs, build-out timeline and milestones, "all certified by a professional engineer, stating that the proposed network can deliver broadband service that meets the requisite performance requirements to all locations served by the Project."',
    'NTIA waived only the capital investment schedule element; a PE must still certify the rest. The PE may be licensed in any state (NTIA waiver and clarification, March 2024; FAQ).',
    'Performance to certify: 100/20 Mbps and latency of 100 ms or less to every BEAD location served; build-out and service within four years of the subgrant date.',
  ],
  utah: [
    'Utah Broadband Center: technical materials "certified by a professional engineer"; the draft subgrant agreement wants "Project plans stamped/sealed by a Professional Engineer" before any disbursement, tied to the 10% initial milestone. UBC accepts stamped PDFs.',
    'Utah Code 58-22-602: a final plan, specification or report prepared by or under a PE must bear the seal when submitted to a client or filed with a public authority. A network design report counts.',
    'R156-22-601(d): seal, sign and date the cover or title sheet of each original set; later sheets need not be sealed. 58-22-603: seal only work you prepared, supervised, or fully reviewed and corrected.',
  ],
  form: [
    'Seal the cover (title, date, revision, page count: "This report consists of N pages") and the certification page. Signature and date across the face of each seal, date in mm/dd/yy.',
    'The certification page names the document title, date and revision, the project IDs, what was reviewed, the standard met (100/20 Mbps, ≤100 ms, four years), the basis (whose designs, what you checked), and any exclusion (capital investment schedule; preliminary areas).',
    'Seal a final document only. A working draft with OPEN items is not sealable; close them or cut them out first. Then certify the PDF digitally and lock it.',
  ],
  scope: [
    'Scope follows the subgrant: "all locations served by the Project" means one certification per project ID. Two subgrants (VAI38, VAI39) need two statements; they can sit in one sealed package.',
    'Never per location. "All locations" is made auditable by an appendix listing every BSL (FCC Fabric ID) with its assigned splice point, so the sealed package defines what you certified.',
    'The BEAD certification does not replace permit plan sets. Each build area still needs sealed plan sheets for the city, county or UDOT permit, the way Fluence does.',
  ],
  steps: [
    'Get the final package: every build area designed, every OPEN item closed, the internal checklist removed, a revision date on the cover.',
    'Check what the statement claims: loss budget per area against the optic datasheet, split ratios, uplink capacity at peak, latency path, the BSL list against the award, the four-year timeline against the execution date.',
    'Check costs for consistency with the design quantities and unit rates; do not certify a budget that was back-solved to the award amount.',
    'Write one certification page per project ID; add license number and state; put the seal on the cover and on each certification page; sign and date across the seal.',
    'Certify the PDF with a certificate-based digital signature, keep the sealed copy, and send only that. Re-issue with a new date if the design or timeline changes.',
  ],
  sources: [
    { label: 'NTIA: Conditional limited waiver and clarification of the PE certification (BEAD)', url: 'https://broadbandusa.ntia.gov/funding-programs/policies-waivers/BEAD_-_Conditional_Limited_Programmatic_Waiver_and_Clarification_of_Professional_Engineer_Certification' },
    { label: 'NTIA BEAD FAQs (search "professional engineer")', url: 'https://broadbandusa.ntia.gov/sites/default/files/2026-06/BEAD_FAQs_v22.pdf' },
    { label: 'Utah Broadband Center: draft BIG BEAD subgrant agreement (public comment 2025)', url: 'https://connecting.utah.gov/wp-content/uploads/Public-Comment-BIG-BEAD-Subgrant-Agreement-Draft-2025.pdf' },
    { label: 'Utah Broadband Center: BEAD Final Proposal (cured)', url: 'https://connecting.utah.gov/wp-content/uploads/Cured-UBO_BEAD-Final-Proposal-1.pdf' },
    { label: 'Utah Code 58-22-602, documents to be sealed', url: 'https://le.utah.gov/xcode/Title58/Chapter22/58-22-S602.html' },
    { label: 'Example state templates: Connecticut PE certification; New York PE certification', url: 'https://broadband.ny.gov/pe-certification-template-connectall-deployment-program' },
  ],
};

/** Applying the seal to a PDF set: the order that keeps it compliant and secure. */
export const SEALING_STEPS = [
  'Fix every review comment first. Seal the final set only, never a set marked preliminary.',
  'Use a seal file bought from a stamp vendor or exported from your wet stamp (the vendor proof is checked against the rule).',
  'Place the seal at the same title-block spot on each sheet (or the cover, per the rule above). Keep it at full size: 1-1/2" minimum in Utah, 1-5/8" in Colorado.',
  'Sign and date across the face of the seal.',
  'Apply a certificate-based digital signature (Acrobat Certify, or Bluebeam Digital Signature) so the file is locked and tamper-evident.',
  'Keep the signed PDF and your seal file to yourself. Share the locked PDF only.',
];
