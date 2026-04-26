import { formatEventDate } from '@/core/utils/date';

describe('formatEventDate', () => {
  it('returns the original value for an invalid ISO string', () => {
    expect(formatEventDate('not-a-date', 'hr')).toBe('not-a-date');
  });

  it('formats a valid ISO string for the requested locale', () => {
    const formatted = formatEventDate('2026-04-24T18:05:00Z', 'en');

    expect(formatted).toContain('04/24/2026');
    expect(formatted).toContain('06:05');
  });
});
