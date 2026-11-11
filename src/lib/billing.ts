import { addDays, addMonths, addWeeks, format, getDaysInMonth, parseISO, startOfMonth } from 'date-fns';
import type { Frequency } from '../types';

const DAYS_PER_YEAR = 365.2425;
const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;

function currencyDigits(currency: string): number {
  try {
    const digits = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).resolvedOptions().maximumFractionDigits ?? 2;
    if (!Number.isInteger(digits)) throw new Error('Currency precision is unavailable');
    return digits;
  } catch {
    throw new Error('Enter a valid three-letter ISO currency code');
  }
}

function assertAmount(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new Error('Amount must be a non-negative safe integer in minor units');
  }
}

/**
 * Calculate the next date using a stable billing-day anchor for calendar-based
 * frequencies. A billing day of 31 therefore stays on month-end in shorter
 * months and returns to the 31st when possible.
 */
export function nextRenewal(dateISO: string, frequency: Frequency, intervalCount = 1, billingDay?: number): string {
  const date = parseISO(dateISO);
  if (Number.isNaN(date.getTime()) || format(date, 'yyyy-MM-dd') !== dateISO) {
    throw new Error('Invalid renewal date');
  }

  let next: Date;
  const monthSteps: Partial<Record<Frequency, number>> = {
    monthly: 1,
    quarterly: 3,
    'half-yearly': 6,
    yearly: 12,
  };
  const months = monthSteps[frequency];

  if (months !== undefined) {
    if (billingDay !== undefined && (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31)) {
      throw new Error('Billing day must be between 1 and 31');
    }
    const targetMonth = addMonths(startOfMonth(date), months);
    const day = Math.min(billingDay ?? date.getDate(), getDaysInMonth(targetMonth));
    next = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
  } else if (frequency === 'weekly') {
    next = addWeeks(date, 1);
  } else {
    if (!Number.isInteger(intervalCount) || intervalCount < 1) {
      throw new Error('Custom interval must be at least one day');
    }
    next = addDays(date, intervalCount);
  }

  return format(next, 'yyyy-MM-dd');
}

export function monthlyEquivalent(amountMinor: number, frequency: Frequency, intervalCount = 1): number | null {
  assertAmount(amountMinor);
  if (frequency === 'custom') {
    if (!Number.isInteger(intervalCount) || intervalCount < 1) return null;
    const result = Math.round((amountMinor * DAYS_PER_MONTH) / intervalCount);
    if (!Number.isSafeInteger(result)) throw new Error('Estimated monthly amount exceeds the supported range');
    return result;
  }
  const months = ({ weekly: 12 / 52, monthly: 1, quarterly: 3, 'half-yearly': 6, yearly: 12 } as const);
  const result = Math.round(amountMinor / months[frequency]);
  if (!Number.isSafeInteger(result)) throw new Error('Estimated monthly amount exceeds the supported range');
  return result;
}

export function yearlyEquivalent(amountMinor: number, frequency: Frequency, intervalCount = 1): number | null {
  assertAmount(amountMinor);
  if (frequency === 'custom') {
    if (!Number.isInteger(intervalCount) || intervalCount < 1) return null;
    const result = Math.round((amountMinor * DAYS_PER_YEAR) / intervalCount);
    if (!Number.isSafeInteger(result)) throw new Error('Estimated annual amount exceeds the supported range');
    return result;
  }
  const occurrences = ({ weekly: 52, monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 } as const);
  const result = amountMinor * occurrences[frequency];
  if (!Number.isSafeInteger(result)) throw new Error('Estimated annual amount exceeds the supported range');
  return result;
}

export function toMinorUnits(amount: string, currency = 'INR'): number {
  const code = currency.toUpperCase();
  const digits = currencyDigits(code);
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`);
  if (!pattern.test(amount.trim())) {
    throw new Error(`Enter a valid amount with up to ${digits} decimal place${digits === 1 ? '' : 's'}`);
  }
  const value = Number(amount);
  const minor = Math.round(value * (10 ** digits));
  if (!Number.isFinite(value) || !Number.isSafeInteger(minor)) {
    throw new Error('Amount is outside the supported range');
  }
  return minor;
}

export function fromMinorUnits(minor: number, currency = 'INR'): number {
  assertAmount(minor);
  return minor / (10 ** currencyDigits(currency));
}

export function formatMoney(minor: number, currency = 'INR'): string {
  assertAmount(minor);
  const digits = currencyDigits(currency);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minor / (10 ** digits));
}
