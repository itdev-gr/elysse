import { describe, it, expect } from 'vitest';
import { formatDN, formatPN, formatSectorList } from '~/scripts/catalog/format';

describe('format', () => {
  it('formatDN renders range', () => {
    expect(formatDN([20, 110])).toBe('DN 20–110');
  });
  it('formatDN renders single when min === max', () => {
    expect(formatDN([50, 50])).toBe('DN 50');
  });
  it('formatPN renders bar suffix', () => {
    expect(formatPN(16)).toBe('PN 16');
  });
  it('formatSectorList capitalizes and joins', () => {
    expect(formatSectorList(['agriculture', 'building'])).toBe('Agriculture · Building');
  });
});
