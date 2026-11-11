import { expect, test } from '@playwright/test';

test('creates a recurring payment, persists it, and supports status and paid transitions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  await page.getByRole('button', { name: /Add recurring/ }).click();
  await expect(page.getByRole('heading', { name: 'Add a subscription' })).toBeVisible();
  await page.getByLabel('Service name').fill('Spotify');
  await page.getByLabel('Amount', { exact: true }).fill('149');
  await page.getByRole('button', { name: 'Add recurring payment' }).click();

  await expect(page.getByText('Spotify', { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('Spotify', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Subscriptions' }).click();
  await page.getByLabel('Status filter').selectOption('all');
  const status = page.getByLabel('Change Spotify status');
  await expect(status).toHaveValue('active');
  await status.selectOption('cancelled');
  await expect(page.locator('.status.cancelled')).toBeVisible();

  await status.selectOption('active');
  await expect(page.locator('.status.active')).toBeVisible();
  await page.getByRole('button', { name: 'Paid' }).click();
  await expect(page.getByText(/Marked paid · next renewal/)).toBeVisible();
});

test('saves appearance and date-format preferences across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();

  await page.getByLabel('Appearance').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Date format').selectOption('yyyy-MM-dd');

  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByLabel('Appearance')).toHaveValue('dark');
  await expect(page.getByLabel('Date format')).toHaveValue('yyyy-MM-dd');
});

test('previews an imported backup before applying it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();

  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    subscriptions: [],
    priceChanges: [],
    paymentEvents: [],
  };
  await page.locator('input[type="file"]').setInputFiles({
    name: 'subtrack-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByRole('heading', { name: 'Review backup contents' })).toBeVisible();
  await expect(page.getByText('0', { exact: true }).first()).toBeVisible();
});
