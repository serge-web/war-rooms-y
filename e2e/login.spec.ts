import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to force fresh seed on each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Reload to trigger seeding
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for seeding to complete by checking for the seeded flag
    await page.waitForFunction(
      () => {
        return localStorage.getItem('war-rooms:seeded') === 'true';
      },
      { timeout: 10000 }
    );
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'War Rooms Y' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connect' })).toBeVisible();
  });

  test('should pre-populate username and password', async ({ page }) => {
    await page.goto('/');

    const usernameInput = page.getByLabel('Username');
    const passwordInput = page.getByLabel('Password');

    await expect(usernameInput).toHaveValue('commander.red');
    await expect(passwordInput).toHaveValue('any');
  });

  test.skip('should login successfully', async ({ page }) => {
    // Click connect button (pre-populated credentials)
    await page.getByRole('button', { name: 'Connect' }).click();

    // Wait for network to be idle (all API calls complete)
    await page.waitForLoadState('networkidle');

    // Should see main app interface (username appears in multiple places, use first)
    await expect(page.getByText('commander.red@wargame.local').first()).toBeVisible();

    // Should see Red Force Command room tab label
    await expect(page.getByText('Red Force Command')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Clear and enter invalid credentials
    const usernameInput = page.getByLabel('Username');
    await usernameInput.clear();

    // Try to connect with empty username
    await page.getByRole('button', { name: 'Connect' }).click();

    // Should show error
    await expect(page.getByText('Username and password are required')).toBeVisible();
  });
});
