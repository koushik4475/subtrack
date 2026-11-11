import { describe, expect, it } from 'vitest';
import { validateBackup } from './backup';

const subscription = {
  id: 'sub-1',
  name: 'Broadband',
  category: 'Utilities',
  amountMinor: 99900,
  currency: 'INR',
  frequency: 'monthly',
  intervalCount: 1,
  billingDay: 15,
  nextRenewalOn: '2026-12-15',
  startedOn: '2026-01-15',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const validBackup = () => ({
  schemaVersion: 1,
  exportedAt: '2026-11-11T00:00:00.000Z',
  subscriptions: [{ ...subscription }],
  priceChanges: [{
    id: 'price-1',
    subscriptionId: 'sub-1',
    amountMinor: 89900,
    currency: 'INR',
    effectiveOn: '2026-01-15',
    createdAt: '2026-01-15T00:00:00.000Z',
  }],
  paymentEvents: [{
    id: 'payment-1',
    subscriptionId: 'sub-1',
    paidOn: '2026-10-15',
    amountMinor: 99900,
    currency: 'INR',
    createdAt: '2026-10-15T00:00:00.000Z',
  }],
});

describe('backup validation', () => {
  it('accepts a valid versioned backup with linked price and payment records', () => {
    const parsed = validateBackup(validBackup());
    expect(parsed.subscriptions).toHaveLength(1);
    expect(parsed.priceChanges[0]?.subscriptionId).toBe('sub-1');
    expect(parsed.paymentEvents[0]?.subscriptionId).toBe('sub-1');
  });

  it('accepts an empty backup', () => {
    const backup = validBackup();
    backup.subscriptions = [];
    backup.priceChanges = [];
    backup.paymentEvents = [];
    expect(validateBackup(backup).subscriptions).toEqual([]);
  });

  it('rejects invalid calendar dates instead of normalizing them', () => {
    const backup = validBackup();
    backup.subscriptions[0]!.nextRenewalOn = '2026-02-30';
    expect(() => validateBackup(backup)).toThrow();
  });

  it('rejects categories outside the supported list', () => {
    const backup = validBackup();
    backup.subscriptions[0]!.category = 'Unverified category';
    expect(() => validateBackup(backup)).toThrow();
  });

  it('rejects unsafe integer minor-unit values', () => {
    const backup = validBackup();
    backup.subscriptions[0]!.amountMinor = Number.MAX_SAFE_INTEGER + 1;
    expect(() => validateBackup(backup)).toThrow(/integer range/i);
  });

  it('rejects history records linked to a missing subscription', () => {
    const backup = validBackup();
    backup.paymentEvents[0]!.subscriptionId = 'missing-subscription';
    expect(() => validateBackup(backup)).toThrow(/missing subscription/i);
  });

  it('rejects insecure website links', () => {
    const backup = validBackup();
    backup.subscriptions[0]!.websiteUrl = 'http://example.com';
    expect(() => validateBackup(backup)).toThrow();
  });
});
