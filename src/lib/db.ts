import Dexie, { type Table } from 'dexie';
import type { AppSettings, PaymentEvent, PriceChange, Subscription } from '../types';
class SubTrackDB extends Dexie {
  subscriptions!: Table<Subscription, string>; priceChanges!: Table<PriceChange, string>; paymentEvents!: Table<PaymentEvent, string>; settings!: Table<{key:string;value:AppSettings}, string>;
  constructor() { super('subtrack'); this.version(1).stores({ subscriptions: 'id, status, category, frequency, currency, nextRenewalOn, trialEndsOn', priceChanges: 'id, subscriptionId, effectiveOn', paymentEvents: 'id, subscriptionId, paidOn', settings: 'key' }); }
}
export const db = new SubTrackDB();
export const DEFAULT_SETTINGS: AppSettings = { defaultCurrency: 'INR', theme: 'light', dateFormat: 'dd MMM yyyy', reminderWindows: [1,3,7] };
