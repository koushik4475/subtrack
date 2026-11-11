import { z } from 'zod';
import { db } from './db';
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const [year, month, day] = value.split('-').map(Number); const parsed = new Date(Date.UTC(year, month - 1, day)); return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day; }, 'Invalid calendar date');
const subscription = z.object({ id:z.string(), name:z.string().min(1).max(100), category:z.string(), amountMinor:z.number().int().nonnegative().refine(Number.isSafeInteger, 'Amount exceeds the supported integer range'), currency:z.string().length(3), frequency:z.enum(['weekly','monthly','quarterly','half-yearly','yearly','custom']), intervalCount:z.number().int().positive(), billingDay:z.number().int().min(1).max(31).optional(), nextRenewalOn:date, startedOn:date, trialEndsOn:date.optional(), paymentMethod:z.string().optional(), websiteUrl:z.string().url().refine((value) => new URL(value).protocol === 'https:', 'Only HTTPS links are allowed').optional().or(z.literal('')), notes:z.string().max(2000).optional(), status:z.enum(['active','paused','cancelled','archived']), createdAt:z.string(), updatedAt:z.string() });
const backupSchema = z.object({ schemaVersion:z.literal(1), exportedAt:z.string(), subscriptions:z.array(subscription), priceChanges:z.array(z.object({id:z.string(),subscriptionId:z.string(),amountMinor:z.number().int().nonnegative().refine(Number.isSafeInteger, 'Amount exceeds the supported integer range'),currency:z.string().length(3),effectiveOn:date,createdAt:z.string()})), paymentEvents:z.array(z.object({id:z.string(),subscriptionId:z.string(),paidOn:date,amountMinor:z.number().int().nonnegative().refine(Number.isSafeInteger, 'Amount exceeds the supported integer range'),currency:z.string().length(3),note:z.string().optional(),createdAt:z.string()})) });
export async function exportBackup() { const data = { schemaVersion:1 as const, exportedAt:new Date().toISOString(), subscriptions:await db.subscriptions.toArray(), priceChanges:await db.priceChanges.toArray(), paymentEvents:await db.paymentEvents.toArray() }; return JSON.stringify(data,null,2); }
export function validateBackup(raw: unknown) {
  const data = backupSchema.parse(raw);
  const subscriptionIds = new Set(data.subscriptions.map((item) => item.id));
  for (const entry of [...data.priceChanges, ...data.paymentEvents]) {
    if (!subscriptionIds.has(entry.subscriptionId)) {
      throw new Error(`Backup contains a record linked to missing subscription ${entry.subscriptionId}`);
    }
  }
  return data;
}
export async function importBackup(data: z.infer<typeof backupSchema>, mode:'merge'|'replace') {
  await db.transaction('rw', db.subscriptions, db.priceChanges, db.paymentEvents, async () => {
    if (mode === 'replace') { await db.subscriptions.clear(); await db.priceChanges.clear(); await db.paymentEvents.clear(); }
    await db.subscriptions.bulkPut(data.subscriptions); await db.priceChanges.bulkPut(data.priceChanges); await db.paymentEvents.bulkPut(data.paymentEvents);
  });
}
