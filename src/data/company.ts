// Company background for the team: the public facts that matter for permitting and planning work, compiled
// 2026-09-29. Every fact carries a source URL and how firmly it was confirmed. Everyone on the shared tracker
// sees this page, so it stays to work-relevant company facts.

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
    { label: 'Roots', value: 'Company site says it was started by two network engineers in fall 2004 (VoIP); ISP/fiber build-out came later', source: 'https://www.senawave.com/about', level: 'partial' },
    { label: 'Headquarters', value: '2075 S Pioneer Rd Ste B, Salt Lake City, UT 84104 · (801) 217-9000 · info@senawave.com (some listings say West Valley City)', source: 'https://ispreports.org/internet-service-providers/senawave-availability/', level: 'partial' },
    { label: 'Network', value: 'AS29844 "Sena Wave LLC"; also lists a Salt Lake City data center; UTOPIA Fiber service provider', source: 'https://bgp.tools/as/29844', level: 'partial' },
    { label: 'BEAD (Utah, Benefit-of-the-Bargain round)', value: 'Provisional award to Vaix, Inc. d.b.a. Senawave: $22,931,272, fiber, 1,935 locations', source: 'https://www.telecompetitor.com/updated-comprehensive-list-bead-benefit-of-the-bargain-provisional-awards/', level: 'verified' },
    { label: 'BEAD area (Box Elder County)', value: 'Company rep told the county commission it was selected by the state for fiber + fixed wireless to rural Box Elder County, Honeyville through Brigham City', source: 'https://citizenportal.ai/articles/9321346/', level: 'partial' },
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
  sourceNote: 'Compiled from public sources on 29 Sep 2026. Some come from search-result excerpts of the cited pages; open the link before relying on one in a submittal.',
};
