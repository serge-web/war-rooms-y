import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.getByRole('button', { name: 'Connect' }).click();

    // Wait for rooms to load - increased to 3s for headless mode
    await page.waitForTimeout(3000);
  });

  test('should display assigned rooms', async ({ page }) => {
    // Commander.red should see Red Command tab label and All Hands messages
    await expect(page.getByText('Red Force Command')).toBeVisible();
    await expect(page.getByText('Welcome to Winter Exercise 2025')).toBeVisible();

    // Should NOT see Blue Command tab label
    await expect(page.getByText('Blue Force Command')).not.toBeVisible();
  });

  test('should verify commander.red sees all 5 assigned rooms', async ({ page }) => {
    // Commander.red should see exactly 5 rooms:
    // 1. All Hands (public) - appears in OutOfGamePanel, not as tab
    // 2-5. Four Red Force rooms (force-red restricted) - appear as tabs

    // Check All Hands room in OutOfGamePanel
    await expect(page.getByText('Welcome to Winter Exercise 2025')).toBeVisible();

    // Check all 4 Red Force room tab labels
    await expect(page.getByText('Red Force Command')).toBeVisible();
    await expect(page.getByText('Red Force Media')).toBeVisible();
    await expect(page.getByText('Red Force Logistics')).toBeVisible();
    await expect(page.getByText('Red Force HQ')).toBeVisible();

    // Should NOT see any Blue Force rooms
    await expect(page.getByText('Blue Force Command')).not.toBeVisible();
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
