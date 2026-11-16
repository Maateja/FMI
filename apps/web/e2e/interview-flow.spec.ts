import { test, expect } from '@playwright/test';

test.describe('FMI Interview & Report Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via demo mode
    await page.goto('/login');
    await page.getByRole('button', { name: /instant demo mode/i }).click();
    await page.waitForURL('**/dashboard');
  });

  test('questions repository renders with category filtering', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.locator('h1')).toContainText(/Question Bank/i);

    // Verify filter categories
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
  });

  test('interview room renders Aurora orb, controls, and telemetry gauges', async ({ page }) => {
    // Navigate directly to a simulated interview session
    await page.goto('/interview/mock-session-001');

    // Verify room layout renders
    await expect(page.locator('header')).toBeVisible();

    // Verify Live Telemetry / Vision gauges panel is mounted
    await expect(page.getByText(/Live Vision Telemetry/i)).toBeVisible();
    await expect(page.getByText(/Eye Contact/i)).toBeVisible();
    await expect(page.getByText(/Posture/i)).toBeVisible();

    // Verify control toolbar (Mic, Cam, End Interview)
    await expect(page.getByRole('button', { name: /end interview/i })).toBeVisible();
  });

  test('evaluation report page displays scorecard and metric breakdowns', async ({ page }) => {
    await page.goto('/interview/mock-session-001/report');

    // Check report header & action buttons
    await expect(page.locator('h1')).toContainText(/Performance Evaluation/i);
    await expect(page.getByRole('button', { name: /download pdf/i })).toBeVisible();

    // Check performance pillars (Technical Accuracy, Communication, etc.)
    await expect(page.getByText(/Technical Accuracy/i)).toBeVisible();
    await expect(page.getByText(/Communication & Clarity/i)).toBeVisible();

    // Check speech and body language analytics cards
    await expect(page.getByText(/Speech Analytics/i)).toBeVisible();
    await expect(page.getByText(/Body Language & Composure/i)).toBeVisible();
  });
});
