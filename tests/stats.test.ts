import { describe, it, expect } from 'vitest';
import { companyStats } from '~/data/stats';

describe('companyStats', () => {
  it('has the three expected fields', () => {
    expect(companyStats).toMatchObject({
      yearsActive: expect.any(Number),
      productCodes: expect.any(Number),
      countries: expect.any(Number)
    });
  });
  it('values are positive', () => {
    expect(companyStats.yearsActive).toBeGreaterThan(0);
    expect(companyStats.productCodes).toBeGreaterThan(0);
    expect(companyStats.countries).toBeGreaterThan(0);
  });
});
