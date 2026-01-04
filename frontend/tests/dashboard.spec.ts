import { expect, test } from '@playwright/test';

test.describe('Financial Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the dashboard header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Financial Dashboard' })).toBeVisible();
  });

  test('should display overview cards', async ({ page }) => {
    await expect(page.getByText('Cash Balance')).toBeVisible();
    await expect(page.getByText('Total Investments')).toBeVisible();
    await expect(page.getByText('Total Debt')).toBeVisible();
    await expect(page.getByText('Net Worth')).toBeVisible();
  });

  test('should display accounts summary section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Accounts Summary' })).toBeVisible();
    await expect(page.getByText('Chase Checking')).toBeVisible();
    await expect(page.getByText('Ally Savings')).toBeVisible();
  });

  test('should display investments summary section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Investments Summary' })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Stock Portfolio' })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Treasury Bonds' })).toBeVisible();
  });

  test('should display debt overview section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Debt Overview' })).toBeVisible();
    await expect(page.getByText('Short-Term Debt')).toBeVisible();
    await expect(page.getByText('Long-Term Debt')).toBeVisible();
  });

  test('should display credit card tracker section', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Credit Card Payment Tracker')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chase Sapphire' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Amex Gold' })).toBeVisible();
  });

  test('should display cash flow insights section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Cash Flow Insights' })).toBeVisible();
    await expect(page.getByText('Income vs Expenses')).toBeVisible();
    await expect(page.getByText('Expense Breakdown')).toBeVisible();
  });

  test('should display notifications and alerts section', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Notifications & Alerts')).toBeVisible();
    await expect(page.getByText('Credit Card Payment Due')).toBeVisible();
  });

  test('should highlight high utilization credit cards', async ({ page }) => {
    const utilizationBadge = page.getByText(/24.5% Used/);
    await expect(utilizationBadge).toBeVisible();
  });

  test('should show unread notifications count', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    // Check if there's a badge showing unread count (look for badge with numbers)
    const unreadBadge = page.getByText(/^\d+$/).first();
    await expect(unreadBadge).toBeVisible();
  });

  test('should display cash flow chart', async ({ page }) => {
    // Check for the presence of recharts elements (use first since there are multiple charts)
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('should display investment pie chart', async ({ page }) => {
    // Check for pie chart in investments section
    const investmentsSection = page.locator('text=Investments Summary').locator('..');
    await expect(investmentsSection.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should show currency formatting', async ({ page }) => {
    // Check that dollar amounts are properly formatted (use first since there are many)
    await expect(page.getByText(/\$[\d,]+/).first()).toBeVisible();
  });

  test('should display percentage changes in overview cards', async ({ page }) => {
    // Check for percentage indicators (use first since there are many)
    await expect(page.getByText(/[+-]?\d+\.\d+%/).first()).toBeVisible();
  });

  test('should show expense categories', async ({ page }) => {
    await expect(page.getByText('Housing')).toBeVisible();
    await expect(page.getByText('Food')).toBeVisible();
    await expect(page.getByText('Transportation')).toBeVisible();
  });

  test('should display due date warnings for credit cards', async ({ page }) => {
    // Look for text indicating days until payment (use first since there may be multiple)
    await expect(page.getByText(/\d+ days/).first()).toBeVisible();
  });
});

test.describe('Dashboard Responsiveness', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that the dashboard loads on mobile (look for any dashboard content)
    const hasDashboardContent = await page.locator('text=Cash Balance, text=Financial Dashboard').count();
    expect(hasDashboardContent).toBeGreaterThan(0);
  });

  test('should be tablet responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that key content is visible on tablet
    await expect(page.getByText('Financial Dashboard')).toBeVisible();
    await expect(page.getByText('Cash Balance')).toBeVisible();
  });
});

test.describe('Dashboard Interactions', () => {
  test('should have export button in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });

  test('should load without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});
