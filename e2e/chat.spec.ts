import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByRole('button', { name: 'Connect' }).click();
    await page.waitForTimeout(1000);
  });

  test('should display assigned rooms', async ({ page }) => {
    // Commander.red should see Red Command and All Hands (check headings in room panels)
    await expect(page.getByRole('heading', { name: 'Red Force Command' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'All Hands' })).toBeVisible();

    // Should NOT see Blue Command
    await expect(page.getByRole('heading', { name: 'Blue Force Command' })).not.toBeVisible();
  });

  test('should display messages in All Hands room', async ({ page }) => {
    // Messages should be visible in the All Hands panel
    await expect(page.getByText('Welcome to Winter Exercise 2025')).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    // Find message input in Red Command room
    const messageInput = page.getByPlaceholder('Type a message...').first();
    await messageInput.fill('Test message from commander.red');

    // Send message
    await page.getByRole('button', { name: 'Send' }).first().click();

    // Message should appear in the chat
    await expect(page.getByText('Test message from commander.red')).toBeVisible();
  });
});
