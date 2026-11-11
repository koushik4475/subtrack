import { describe, expect, it } from 'vitest';
import { formatMoney, fromMinorUnits, monthlyEquivalent, nextRenewal, toMinorUnits, yearlyEquivalent } from './billing';

describe('billing recurrence', () => {
  it('keeps a 31st-of-month billing anchor through shorter months', () => {
    const february = nextRenewal('2026-01-31', 'monthly', 1, 31);
    expect(february).toBe('2026-02-28');
    expect(nextRenewal(february, 'monthly', 1, 31)).toBe('2026-03-31');
  });

  it('keeps a 30th-of-month anchor after February', () => {
    const february = nextRenewal('2026-01-30', 'monthly', 1, 30);
    expect(february).toBe('2026-02-28');
    expect(nextRenewal(february, 'monthly', 1, 30)).toBe('2026-03-30');
  });

  it('handles leap day yearly recurrence predictably', () => {
    expect(nextRenewal('2024-02-29', 'yearly', 1, 29)).toBe('2025-02-28');
    expect(nextRenewal('2025-02-28', 'yearly', 1, 29)).toBe('2026-02-28');
    expect(nextRenewal('2026-02-28', 'yearly', 1, 29)).toBe('2027-02-28');
    expect(nextRenewal('2027-02-28', 'yearly', 1, 29)).toBe('2028-02-29');
  });

  it('handles weekly, quarterly and half-yearly frequencies', () => {
    expect(nextRenewal('2026-01-01', 'weekly')).toBe('2026-01-08');
    expect(nextRenewal('2026-01-31', 'quarterly', 1, 31)).toBe('2026-04-30');
    expect(nextRenewal('2026-01-31', 'half-yearly', 1, 31)).toBe('2026-07-31');
  });

  it('handles custom day intervals and rejects invalid intervals', () => {
    expect(nextRenewal('2026-01-01', 'custom', 45)).toBe('2026-02-15');
    expect(() => nextRenewal('2026-01-01', 'custom', 0)).toThrow();
  });

  it('calculates annual and monthly estimates, including interpretable custom day intervals', () => {
    expect(monthlyEquivalent(12000, 'yearly')).toBe(1000);
    expect(yearlyEquivalent(10000, 'monthly')).toBe(120000);
    expect(monthlyEquivalent(3000, 'custom', 30)).toBeGreaterThan(3000);
    expect(yearlyEquivalent(3000, 'custom', 30)).toBeGreaterThan(36000);
    expect(monthlyEquivalent(3000, 'custom', 0)).toBeNull();
    expect(() => monthlyEquivalent(Number.MAX_SAFE_INTEGER, 'custom', 1)).toThrow();
  });

  it('uses ISO currency precision and integer minor units safely', () => {
    expect(toMinorUnits('499.99', 'INR')).toBe(49999);
    expect(toMinorUnits('500', 'JPY')).toBe(500);
    expect(toMinorUnits('1.234', 'KWD')).toBe(1234);
    expect(fromMinorUnits(49999, 'INR')).toBe(499.99);
    expect(() => toMinorUnits('1.234', 'INR')).toThrow();
    expect(() => toMinorUnits('-1', 'INR')).toThrow();
    expect(formatMoney(49900, 'INR')).toContain('499');
  });
});
