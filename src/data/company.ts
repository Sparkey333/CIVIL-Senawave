// Company and people background, compiled 2026-09-29 from public sources.
// Every fact carries a source URL and a verification level. Items the research could not confirm are
// marked as such rather than guessed — edit these entries in the Team page once you learn more.
// Full write-up: docs/research-senawave.md

export type Verification = 'verified' | 'partial' | 'unverified';

export interface Fact {
  label: string;
  value: string;
  source?: string; // URL
  level: Verification;
}

export const COMPANY = {
  name: 'Senawave',
  legalName: 'VAIX, Inc. dba Senawave Communications',
  aka: ['Senawave Communications', 'Sena Wave, LLC (holding company, formed 2012)', 'SenaWave', 'Coordinated Telecom, Inc. (dba)'],
  tagline: 'Utah-based telecom and internet service provider building fiber across northern Utah, including BEAD-funded routes.',
  hq: '2075 S Pioneer Rd Ste B, Salt Lake City, UT 84104',
  phone: '(801) 217-9000',
  email: 'info@senawave.com',
  website: 'https://www.senawave.com/',
  linkedin: 'https://www.linkedin.com/company/senawave-llc',
  facts: [
    { label: 'Operating entity', value: 'VAIX, Inc. dba Senawave Communications (also dba Coordinated Telecom, Inc.); holding company SENAWAVE LLC', source: 'https://apps.fcc.gov/cgb/form499/499detail.cfm?FilerNum=829516', level: 'verified' },
    { label: 'FCC Form 499 filer / FRN', value: 'Filer 829516, FRN 0022205454 — interconnected VoIP, USF contributor, states GA/ID/OR/UT/WY', source: 'https://apps.fcc.gov/cgb/form499/499detail.cfm?FilerNum=829516', level: 'verified' },
    { label: 'Sena Wave, LLC', value: 'Incorporated 18 Sep 2012; alt name Senawave Communications; current principal David Bradshaw (Member)', source: 'https://www.bbb.org/us/ut/salt-lake-city/profile/internet-service/sena-wave-llc-1166-22337799', level: 'partial' },
    { label: 'Roots', value: 'Company site says it was started by two network engineers in fall 2004 (VoIP); ISP/fiber build-out came later', source: 'https://www.senawave.com/about', level: 'partial' },
    { label: 'Headquarters', value: '2075 S Pioneer Rd Ste B, Salt Lake City, UT 84104 · (801) 217-9000 · info@senawave.com (Indeed/Glassdoor list West Valley City)', source: 'https://ispreports.org/internet-service-providers/senawave-availability/', level: 'partial' },
    { label: 'Size', value: 'Indeed: 11–50 employees; ZoomInfo: ~23 employees, ~$4.1M revenue; LinkedIn: 2–10', source: 'https://www.indeed.com/cmp/Senawave-1', level: 'partial' },
    { label: 'Network', value: 'AS29844 "Sena Wave LLC"; also lists a Salt Lake City data center; UTOPIA Fiber service provider', source: 'https://bgp.tools/as/29844', level: 'partial' },
    { label: 'BEAD (Utah, Benefit-of-the-Bargain round)', value: 'Provisional award to Vaix, Inc. d.b.a. Senawave: $22,931,272, fiber, 1,935 locations', source: 'https://www.telecompetitor.com/updated-comprehensive-list-bead-benefit-of-the-bargain-provisional-awards/', level: 'verified' },
    { label: 'BEAD area (Box Elder County)', value: 'Company rep told the county commission it was selected by the state for fiber + fixed wireless to rural Box Elder County, Honeyville through Brigham City', source: 'https://citizenportal.ai/articles/9321346/', level: 'partial' },
    { label: 'Utah Broadband Access Grant', value: 'No Senawave award found in the 2022 recipient list', source: 'https://connecting.utah.gov/broadband/utah-broadband-center-announces-2022-grant-recipients/', level: 'verified' },
    { label: 'Utah PSC', value: 'Docket 17-2598-01 (ETC / Lifeline petition, 2017) dismissed 16 Feb 2018; no active PSC certificate found', source: 'https://psc.utah.gov/?p=31763', level: 'partial' },
    { label: 'Indeed rating', value: '2.6 / 5 (6 reviews); job security 2.0, management 2.3, work-life balance 3.5, compensation 2.0; CEO approval 72%', source: 'https://www.indeed.com/cmp/Senawave-1', level: 'verified' },
    { label: 'Glassdoor rating', value: '2.3 / 5 (5 reviews), 30% recommend', source: 'https://www.glassdoor.com/Reviews/SenaWave-Reviews-E1555707.htm', level: 'partial' },
    { label: 'Trademark', value: 'USPTO "SENA WAVE" (serial 85840070, filed 2013, cancelled 2020): "SENA" in blue, "WAVE" in black, three blue wave lines', source: 'https://www.trademarkia.com/owners/Sena%20Wave%20LLC', level: 'partial' },
    { label: 'Utah Division of Corporations record', value: 'Entity number, registered agent and officers could not be retrieved (registry blocked during research) — look up at corporations.utah.gov', level: 'unverified' },
  ] as Fact[],
  serviceArea: [
    'Wasatch Front: Orem, Lindon, Murray, Midvale, West Valley City, Centerville, Layton, Cottonwood Heights, Riverton',
    'Northern Utah: Brigham City, Tremonton, Perry, Corinne / Bear River City (fixed wireless), Honeyville, Willard, Farr West, Ogden, South Ogden, West Haven',
    'Cache Valley: Logan, Providence, Cache County (about 2,900 fiber locations reported)',
  ],
  franchises: [
    { where: 'Box Elder County', what: 'Ordinance No. 643 — ROW telecom franchise to VAIX, Inc. dba Senawave Communications, 10-year term + two 5-year renewals', when: '2026-01-28', source: 'https://www.hjnews.com/classifieds/legals/legals/ordinance-no-643-on-this-28th-day/pdfdisplayad_8d62b243-7d8a-51a8-818c-f3ed4a3e76b7.html', level: 'verified' as Verification },
    { where: 'Willard City', what: 'SenaWave telecommunications franchise agreement on 11 Dec 2025 agenda; names David Bradshaw as the Provider\'s representative; later reported "tabled"', when: '2025-12-11', source: 'https://www.willardcityut.gov/uploads/2/3/0/7/23075090/council_packet_12-11-2025.pdf', level: 'partial' as Verification },
    { where: 'South Ogden', what: 'Resolution 23-02 approving franchise agreement with VAIX', when: '2023-01-03', source: 'https://cms7files.revize.com/southogdennew/document_center/Resolutions/2023/Resolution%2023-02%20-%20Approving%20Franchise%20Agreement%20with%20VAIX%20-%2003%20Jan%2023.pdf', level: 'verified' as Verification },
    { where: 'Riverton', what: 'Resolution 22-31 franchise agreement (Vaix Inc. dba SenaWave)', when: '2022-04-19', source: 'https://granicus_production_attachments.s3.amazonaws.com/rivertoncity/f9a2188db9198758ab207e437e6cb66a0.pdf', level: 'verified' as Verification },
    { where: 'Cottonwood Heights', what: 'Ordinance 376 franchise (Mar 2022); city news quotes "SenaWave CEO David Bradshaw"', when: '2022-03', source: 'https://www.cottonwoodheights.utah.gov/Home/Components/News/News/2308/115?arch=1', level: 'partial' as Verification },
    { where: 'Farr West', what: 'David Bradshaw presented for "Senawave Fiber" (service Tremonton to southern Utah County; directional-boring FTTH); council voted to continue franchise negotiations', when: '2020-03-05', source: 'https://www.utah.gov/pmn/files/593539.pdf', level: 'partial' as Verification },
  ],
  otherPeople: [
    { name: 'Ladd Marshall', role: 'Chief Revenue Officer (SVP Sales 2014–2020)', source: 'https://www.crunchbase.com/person/ladd-marshall-879e' },
    { name: 'Chris Brown', role: 'CTO', source: 'https://www.linkedin.com/in/chris-brown-75b4339/' },
    { name: 'Brian Papworth', role: 'Represented the company at Box Elder County Commission, Jan 2026 (title unknown)', source: 'https://citizenportal.ai/articles/9321028/' },
    { name: 'Mickel Thorsen', role: 'Technical Specialist', source: 'https://www.linkedin.com/in/mickel-thorsen-715a23116/' },
  ],
  researchDate: '2026-09-29',
  researchCaveat:
    'Research ran from a sandbox that could not open senawave.com, utah.gov, LinkedIn, Crunchbase or Glassdoor directly; those facts come from search-engine snippets of the cited pages and should be confirmed by opening the links.',
};

export const OTHER_ENTITIES = [
  { name: 'Ansom Outdoor LLC', finding: 'No web presence, news or registration found. Appears in your working folder path ("Ansom Outdoor LLC__1 Senawave - UT Light"), so it is most likely your own or a subcontractor entity, not a Senawave company.', level: 'unverified' as Verification },
  { name: '"UT Light" / "Utah Light"', finding: 'No company, product or project by that name found connected to Senawave or UDOT. Possibly an internal project or client nickname.', level: 'unverified' as Verification },
  { name: 'Utah Fiber, LLC', finding: 'A Boston Omaha Broadband (Utah Broadband) subsidiary registered in Omaha, NE — unrelated to Senawave. Your "Utah Fiber - Jesse" folder is probably not this company.', level: 'partial' as Verification },
];
