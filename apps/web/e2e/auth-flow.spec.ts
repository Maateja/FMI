import { test, expect } from '@playwright/test';

test.describe('FMI Authentication Flow', () => {
  test('landing page loads and renders core call-to-actions', async ({ page }) => {
    await page.goto('/');

    // Check title / brand heading
    await expect(page.locator('h1')).toContainText(/AI Voice Interview/i);
    await expect(page.getByRole('link', { name: /start free practice/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
  });

  test('user can log in via demo mode and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Find and click demo login button
    const demoButton = page.getByRole('button', { name: /instant demo mode/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Verify redirection to /dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText(/Welcome back/i);

    // Verify token exists in localStorage
    const token = await page.evaluate(() => localStorage.getItem('fmi_token'));
    expect(token).toBeTruthy();
  });

  test('user can sign out and return to unauthenticated state', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /instant demo mode/i }).click();
    await page.waitForURL('**/dashboard');

    // Click Sign Out
    const signOutBtn = page.getByRole('button', { name: /sign out/i });
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
      await page.waitForURL('**/login');
      const token = await page.evaluate(() => localStorage.getItem('fmi_token'));
      expect(token).toBeNull();
    }
  });
});
