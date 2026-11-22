import { z } from 'zod';
import { db } from './db';
import type { Category } from '../types';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}, 'Invalid calendar date');

const category = z.enum([
  'Entertainment', 'Music', 'Productivity', 'Cloud/Software', 'Shopping',
  'Fitness', 'Education', 'Utilities', 'Housing', 'Insurance', 'Other',
] as [Category, ...Category[]]);

const currencyCode = z.string().length(3).refine((value) => {
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: value.toUpperCase() }).format(0);
    return true;
  } catch {
    return false;
  }
}, 'Invalid ISO currency code');

const safeMinorUnits = z.number().int().nonnegative().refine(
  Number.isSafeInteger,
  'Amount exceeds the supported integer range',
);

const subscription = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  category,
  amountMinor: safeMinorUnits,
  currency: currencyCode,
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'half-yearly', 'yearly', 'custom']),
  intervalCount: z.number().int().positive(),
  billingDay: z.number().int().min(1).max(31).optional(),
  nextRenewalOn: date,
  startedOn: date,
  trialEndsOn: date.optional(),
  paymentMethod: z.string().optional(),
  websiteUrl: z.string().url().refine((value) => new URL(value).protocol === 'https:', 'Only HTTPS links are allowed').optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
  status: z.enum(['active', 'paused', 'cancelled', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const backupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  subscriptions: z.array(subscription),
  priceChanges: z.array(z.object({
    id: z.string(),
    subscriptionId: z.string(),
    amountMinor: safeMinorUnits,
    currency: z.string().length(3),
    effectiveOn: date,
    createdAt: z.string(),
  })),
  paymentEvents: z.array(z.object({
    id: z.string(),
    subscriptionId: z.string(),
    paidOn: date,
    amountMinor: safeMinorUnits,
    currency: z.string().length(3),
    note: z.string().optional(),
    createdAt: z.string(),
  })),
});

export async function exportBackup() {
  const data = {
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
    subscriptions: await db.subscriptions.toArray(),
    priceChanges: await db.priceChanges.toArray(),
    paymentEvents: await db.paymentEvents.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export function validateBackup(raw: unknown) {
  const data = backupSchema.parse(raw);
  const subscriptionIds = new Set(data.subscriptions.map((item) => item.id));
  if (subscriptionIds.size !== data.subscriptions.length) throw new Error('Backup contains duplicate subscription IDs');
  for (const [label, entries] of [['price change', data.priceChanges], ['payment event', data.paymentEvents]] as const) {
    const ids = entries.map((entry) => entry.id);
    if (new Set(ids).size !== ids.length) throw new Error(`Backup contains duplicate ${label} IDs`);
  }

  for (const entry of [...data.priceChanges, ...data.paymentEvents]) {
    if (!subscriptionIds.has(entry.subscriptionId)) {
      throw new Error(`Backup contains a record linked to missing subscription ${entry.subscriptionId}`);
    }
  }

  return data;
}

export async function importBackup(data: z.infer<typeof backupSchema>, mode: 'merge' | 'replace') {
  const validated = validateBackup(data);
  await db.transaction('rw', db.subscriptions, db.priceChanges, db.paymentEvents, async () => {
    if (mode === 'replace') {
      await db.subscriptions.clear();
      await db.priceChanges.clear();
      await db.paymentEvents.clear();
      await db.subscriptions.bulkPut(validated.subscriptions);
      await db.priceChanges.bulkPut(validated.priceChanges);
      await db.paymentEvents.bulkPut(validated.paymentEvents);
      return;
    }

    // Keep current records intact when imported IDs collide. Remap each imported
    // subscription and its history IDs before writing, preserving relationships.
    const existingSubscriptionIds = new Set(await db.subscriptions.toCollection().primaryKeys());
    const existingPriceIds = new Set(await db.priceChanges.toCollection().primaryKeys());
    const existingPaymentIds = new Set(await db.paymentEvents.toCollection().primaryKeys());
    const subscriptionIdMap = new Map<string, string>();
    for (const item of validated.subscriptions) {
      subscriptionIdMap.set(item.id, existingSubscriptionIds.has(item.id) ? crypto.randomUUID() : item.id);
    }
    const subscriptions = validated.subscriptions.map((item) => ({ ...item, id: subscriptionIdMap.get(item.id)! }));
    const priceChanges = validated.priceChanges.map((item) => ({
      ...item,
      id: existingPriceIds.has(item.id) ? crypto.randomUUID() : item.id,
      subscriptionId: subscriptionIdMap.get(item.subscriptionId)!,
    }));
    const paymentEvents = validated.paymentEvents.map((item) => ({
      ...item,
      id: existingPaymentIds.has(item.id) ? crypto.randomUUID() : item.id,
      subscriptionId: subscriptionIdMap.get(item.subscriptionId)!,
    }));
    await db.subscriptions.bulkPut(subscriptions);
    await db.priceChanges.bulkPut(priceChanges);
    await db.paymentEvents.bulkPut(paymentEvents);
  });
}
