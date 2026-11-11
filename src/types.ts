export type Frequency = 'weekly'|'monthly'|'quarterly'|'half-yearly'|'yearly'|'custom';
export type Status = 'active'|'paused'|'cancelled'|'archived';
export type Category = 'Entertainment'|'Music'|'Productivity'|'Cloud/Software'|'Shopping'|'Fitness'|'Education'|'Utilities'|'Housing'|'Insurance'|'Other';
export interface Subscription { id: string; name: string; category: Category; amountMinor: number; currency: string; frequency: Frequency; intervalCount: number; billingDay?: number; nextRenewalOn: string; startedOn: string; trialEndsOn?: string; paymentMethod?: string; websiteUrl?: string; notes?: string; status: Status; createdAt: string; updatedAt: string; }
export interface PriceChange { id: string; subscriptionId: string; amountMinor: number; currency: string; effectiveOn: string; createdAt: string; }
export interface PaymentEvent { id: string; subscriptionId: string; paidOn: string; amountMinor: number; currency: string; note?: string; createdAt: string; }
export interface AppSettings { defaultCurrency: string; theme: 'light'|'dark'|'system'; dateFormat: 'dd MMM yyyy'|'yyyy-MM-dd'; reminderWindows: number[]; }
