import { describe, expect, it } from 'vitest';
import { BEAD_CERT, CERT_VS_SEAL, DEFAULT_PE_LICENSES, SEAL_SPECS } from './peStamp';
import { PRIVATE_SETTING_KEYS } from '@/lib/types';
import { seedData } from '@/store/seed';

describe('PE stamp reference', () => {
  it('covers Utah first, then Colorado, each with a lookup and https sources', () => {
    expect(SEAL_SPECS.map((s) => s.state)).toEqual(['UT', 'CO']);
    for (const s of SEAL_SPECS) {
      expect(s.lookup.url).toMatch(/^https:\/\//);
      expect(s.sources.length).toBeGreaterThan(0);
      for (const l of [...s.sources, ...s.vendors]) expect(l.url).toMatch(/^https:\/\//);
    }
  });

  it('records the rule sizes', () => {
    expect(SEAL_SPECS[0].size).toContain('1-1/2 inch minimum');
    expect(SEAL_SPECS[1].size).toContain('1-5/8 inch');
    expect(SEAL_SPECS[0].wording).toContain('"State of Utah"');
  });

  it('explains grant certification as per project, with https sources', () => {
    expect(CERT_VS_SEAL.map((c) => c.term)).toEqual(['Certification', 'Seal (stamp)', 'Both together']);
    expect(BEAD_CERT.summary).toMatch(/per subgrant project/);
    expect(BEAD_CERT.scope.join(' ')).toMatch(/Never per location/);
    expect(BEAD_CERT.steps.length).toBeGreaterThanOrEqual(5);
    expect(BEAD_CERT.review.length).toBeGreaterThanOrEqual(10);
    expect(BEAD_CERT.review[0]).toMatch(/Final document/);
    expect(BEAD_CERT.lessons.join(' ')).toMatch(/optical length/);
    for (const s of BEAD_CERT.sources) expect(s.url).toMatch(/^https:\/\//);
  });

  it('keeps your licenses with the private settings, seeded from the defaults', () => {
    expect(PRIVATE_SETTING_KEYS).toContain('peLicenses');
    expect(seedData().settings.peLicenses).toEqual(DEFAULT_PE_LICENSES);
  });
});
