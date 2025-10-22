/**
 * E2E Tests for Admin Workflow
 * Tests admin panel functionality end-to-end
 */

import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173/admin';
const ADMIN_CREDENTIALS = {
  username: 'gamemaster',
  password: 'gamemaster',
};

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
  });

  test('should display admin login page', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin#?\/?(login)?/);
    await expect(page.getByRole('heading', { name: /war rooms.*admin/i })).toBeVisible();
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/War Rooms/i)).toBeVisible({ timeout: 10000 });
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill('invalid');
    await page.getByLabel(/password/i).fill('wrongpass');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error notification
    await page.waitForTimeout(1000);

    // Should show error notification
    await expect(page.getByText(/not authenticated/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe.skip('Admin User Management', () => {
  // Users resource not implemented - manage users via Forces instead
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
  });

  test('should list users', async ({ page }) => {
    await page.getByRole('link', { name: /users/i }).click();
    await expect(page).toHaveURL(/\/admin.*users/);

    // Should see admin user in list
    await expect(page.getByText('admin')).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    await page.getByRole('link', { name: /users/i }).click();
    await page.getByRole('link', { name: /create/i }).click();

    // Fill user form
    const timestamp = Date.now();
    await page.getByLabel(/username/i).fill(`testuser${timestamp}`);
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(`test${timestamp}@wargame.local`);
    await page.getByLabel(/password/i).fill('testpass');

    await page.getByRole('button', { name: /save/i }).click();

    // Should show success message
    await expect(page.getByText(/created|success/i)).toBeVisible();
  });

  test('should edit an existing user', async ({ page }) => {
    await page.getByRole('link', { name: /users/i }).click();

    // Click on admin user to edit
    await page.getByText('admin').first().click();

    // Update name
    const nameField = page.getByLabel(/^name/i);
    await nameField.clear();
    await nameField.fill('Updated Admin');

    await page.getByRole('button', { name: /save/i }).click();

    // Should show success
    await expect(page.getByText(/updated|success/i)).toBeVisible();
  });
});

test.describe('Admin Force Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
  });

  test('should list forces', async ({ page }) => {
    await page.getByRole('menuitem', { name: /forces/i }).click();
    await expect(page).toHaveURL(/\/admin.*forces/);
  });

  test('should create a new force', async ({ page }) => {
    await page.getByRole('menuitem', { name: /forces/i }).click();
    await page.getByRole('link', { name: /create/i }).click();
    await page.waitForURL(/.*forces\/create/);

    const timestamp = Date.now();
    await page.getByLabel(/force name/i).fill(`Force${timestamp}`);
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Test force description');

    // Set metadata
    await page.getByLabel(/force color/i).fill('#FF5722');
    await page.getByLabel(/icon name/i).fill('shield');

    // Add objective
    await page.getByRole('button', { name: /add/i }).click();
    await page.getByLabel(/objective/i).fill('Test objective');

    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(/created|success/i)).toBeVisible();
  });

  test('should edit force metadata', async ({ page }) => {
    // First create a force
    await page.getByRole('menuitem', { name: /forces/i }).click();
    await page.getByRole('link', { name: /create/i }).click();
    await page.waitForURL(/.*forces\/create/);

    const timestamp = Date.now();
    const forceName = `EditForce${timestamp}`;
    await page.getByLabel(/force name/i).fill(forceName);
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Original description');

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible();

    // Now edit it
    await page.getByText(forceName).first().click();

    // Update color
    await page.getByLabel(/force color/i).fill('#4CAF50');

    // Switch to Members tab
    await page.getByRole('tab', { name: /members/i }).click();
    await expect(page.getByText(/group membership/i)).toBeVisible();

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/updated|success/i)).toBeVisible();
  });

  test('should manage force members', async ({ page }) => {
    // Create test force
    await page.getByRole('menuitem', { name: /forces/i }).click();
    await page.getByRole('link', { name: /create/i }).click();
    await page.waitForURL(/.*forces\/create/);

    const timestamp = Date.now();
    const forceName = `MemberForce${timestamp}`;
    await page.getByLabel(/force name/i).fill(forceName);
    await page
      .getByLabel(/description/i)
      .first()
      .fill('For member testing');

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(500);

    // Edit to add members
    await page.getByText(forceName).first().click();
    await page.getByRole('tab', { name: /members/i }).click();

    // Add a member (admin user)
    await page.getByLabel(/username/i).fill('admin');
    await page.getByRole('button', { name: /add/i }).click();

    // Check for success message
    await expect(page.getByText(/added admin to/i)).toBeVisible();
  });
});

test.describe('Admin Room Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
  });

  test('should list rooms', async ({ page }) => {
    await page.getByRole('menuitem', { name: /rooms/i }).click();
    await expect(page).toHaveURL(/\/admin.*rooms/);
  });

  test('should create a new room', async ({ page }) => {
    await page.getByRole('menuitem', { name: /rooms/i }).click();
    await page.getByRole('link', { name: /create/i }).click();
    await page.waitForURL(/.*rooms\/create/);

    const timestamp = Date.now();
    await page.getByLabel(/^room name/i).fill(`room${timestamp}`);
    await page.getByLabel(/display name/i).fill(`Test Room ${timestamp}`);
    await page
      .getByLabel(/^description/i)
      .first()
      .fill('Test room description');

    // Set room options
    await page.getByLabel(/persistent/i).check();
    await page.getByLabel(/members only/i).check();

    // Set metadata
    await page.getByLabel(/extended description/i).fill('Extended metadata description');
    await page.getByLabel(/primary theme color/i).fill('#1976D2');

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible();
  });

  test('should edit room configuration', async ({ page }) => {
    // Create room first
    await page.getByRole('menuitem', { name: /rooms/i }).click();
    await page.getByRole('link', { name: /create/i }).click();
    await page.waitForURL(/.*rooms\/create/);

    const timestamp = Date.now();
    const roomName = `editroom${timestamp}`;
    await page.getByLabel(/^room name/i).fill(roomName);
    await page.getByLabel(/display name/i).fill(`Edit Room ${timestamp}`);
    await page
      .getByLabel(/^description/i)
      .first()
      .fill('Original description');

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible();

    // Edit it
    await page.getByText(roomName).first().click();

    // Update subject
    await page.getByLabel(/subject/i).fill('Updated subject line');

    // Update max users
    await page.getByLabel(/max users/i).fill('100');

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/updated|success/i)).toBeVisible();
  });

  test('should set room allowed groups from dynamic list', async ({ page }) => {
    // First create a force to appear in the list
    await page.getByRole('menuitem', { name: /forces/i }).click();
    await page.getByRole('link', { name: /create/i }).click();
    await page.waitForURL(/.*forces\/create/);

    const timestamp = Date.now();
    const forceName = `TestForce${timestamp}`;
    await page.getByLabel(/force name/i).fill(forceName);
    await page
      .getByLabel(/description/i)
      .first()
      .fill('Test force');

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible();

    // Now create a room and select the force
    await page.getByRole('menuitem', { name: /rooms/i }).click();
    await page.getByRole('link', { name: /create/i }).click();
    await page.waitForURL(/.*rooms\/create/);

    await page.getByLabel(/^room name/i).fill(`room${timestamp}`);
    await page.getByLabel(/display name/i).fill(`Room ${timestamp}`);

    // Select allowed groups - should include our newly created force
    const groupSelect = page.getByLabel(/allowed groups/i);
    await groupSelect.click();

    // The dropdown should contain our force
    await expect(page.getByText(forceName)).toBeVisible();
  });
});

test.describe('Admin Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);
    // Wait for dashboard to load
    await page.waitForTimeout(1000);
  });

  test('should display overview page', async ({ page }) => {
    await page.getByRole('menuitem', { name: /overview/i }).click();
    await expect(page).toHaveURL(/\/admin.*overview/);
  });
});

test.describe('Admin Logout', () => {
  test('should logout successfully', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);
    // Wait for dashboard to load
    await page.waitForTimeout(1000);

    // Click profile button to open menu
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);

    // Click logout from the menu
    await page.getByRole('menuitem', { name: /logout|sign out/i }).click();

    // Should redirect to login
    await expect(page.getByRole('heading', { name: /war rooms.*admin/i })).toBeVisible();
  });
});
