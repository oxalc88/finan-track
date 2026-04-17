import { expect, test } from '@playwright/test';

// These specs assume the backend is running and the Vite proxy
// forwards `/api` to it. Start with:
//   pnpm db:migrate && pnpm db:seed
//   pnpm dev:api & pnpm dev:web
//   pnpm --filter finan-track-frontend test:e2e

test.describe('Financial Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders the dashboard header', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Financial Dashboard' })
    ).toBeVisible();
  });

  test('renders the three overview cards', async ({ page }) => {
    await expect(page.getByText('Cash Balance')).toBeVisible();
    await expect(page.getByText('Total Debt')).toBeVisible();
    await expect(page.getByText('Net Worth')).toBeVisible();
    // Investments was dropped in Phase 6 — make sure it didn't come back.
    await expect(page.getByText('Total Investments')).toHaveCount(0);
  });

  test('renders accounts, credit cards, and cash flow sections', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Accounts Summary' })
    ).toBeVisible();
    await expect(page.getByText('Credit Card Payment Tracker')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Cash Flow Insights' })
    ).toBeVisible();
  });

  test('formats amounts in PEN by default', async ({ page }) => {
    // `formatCurrency` defaults to `es-PE` + `PEN`, which Intl renders as
    // `S/` — not `$`. Accept either spacing Intl may emit.
    await expect(page.getByText(/S\/\s?[\d.,]+/).first()).toBeVisible();
  });

  test('renders at least one Recharts chart', async ({ page }) => {
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('has the desktop SideNav with all routes', async ({ page }) => {
    const nav = page.getByRole('navigation').first();
    for (const label of [
      'Dashboard',
      'Accounts',
      'Credit Cards',
      'Cash Flow',
      'Documents',
      'Conciliations',
      'Ask',
    ]) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('Mobile dashboard', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('shows the MobileHeader with a hamburger that reveals nav', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Desktop SideNav is hidden via `hidden lg:flex`; MobileHeader is
    // the visible chrome. The hamburger button is aria-labelled so the
    // screen-reader contract is stable even if icons change.
    const toggle = page.getByRole('button', { name: 'Toggle navigation' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.getByRole('link', { name: 'Documents' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Conciliations' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ask' })).toBeVisible();
  });
});

test.describe('Cross-route navigation', () => {
  test('Documents route loads the documents page', async ({ page }) => {
    await page.goto('/documents');
    await expect(
      page.getByRole('heading', { name: 'Documents' })
    ).toBeVisible();
  });

  test('Conciliations route loads the conciliations page', async ({ page }) => {
    await page.goto('/conciliations');
    await expect(
      page.getByRole('heading', { name: 'Conciliations' })
    ).toBeVisible();
  });

  test('Ask route loads the query page', async ({ page }) => {
    await page.goto('/query');
    await expect(page.getByRole('heading', { name: 'Ask' })).toBeVisible();
    await expect(page.getByLabel('Pregunta')).toBeVisible();
  });
});
