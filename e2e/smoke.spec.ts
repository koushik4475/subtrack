import { test, expect } from '@playwright/test';
test('loads dashboard and opens add form',async({page})=>{await page.goto('/');await expect(page.getByRole('heading',{name:'Overview'})).toBeVisible();await page.getByRole('button',{name:/Add recurring/}).click();await expect(page.getByRole('heading',{name:'Add a subscription'})).toBeVisible();});
