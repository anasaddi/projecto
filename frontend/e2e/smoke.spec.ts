import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'PROJECTO' })).toBeVisible();
});

test('dashboard redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('home page loads for guests', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
