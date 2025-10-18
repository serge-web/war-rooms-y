import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
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

  test('should login successfully', async ({ page }) => {
    await page.goto('/');
    
    // Click connect button (pre-populated credentials)
    await page.getByRole('button', { name: 'Connect' }).click();
    
    // Wait for login to complete
    await page.waitForTimeout(500);
    
    // Should see main app interface
    await expect(page.getByText('commander.red@wargame.local')).toBeVisible();
    
    // Should see Red Force Command room
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
