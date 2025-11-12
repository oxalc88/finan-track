import { test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('Dashboard Screenshots', () => {
  test('capture full dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for dashboard to fully load
    await page.waitForSelector('text=Financial Dashboard')
    await page.waitForSelector('text=Cash Balance')

    // Take full page screenshot
    await page.screenshot({
      path: '../../screenshots/01-full-dashboard.png',
      fullPage: true,
    })
  })

  test('capture overview cards section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for overview cards
    await page.waitForSelector('text=Cash Balance')

    // Take screenshot of overview cards area
    const overviewSection = page.locator('section').first()
    await overviewSection.screenshot({
      path: '../../screenshots/02-overview-cards.png',
    })
  })

  test('capture accounts and investments section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for sections to load
    await page.waitForSelector('text=Accounts Summary')
    await page.waitForSelector('text=Investments Summary')

    // Take screenshot of the grid section
    const accountsSection = page.locator('section').nth(1)
    await accountsSection.screenshot({
      path: '../../screenshots/03-accounts-investments.png',
    })
  })

  test('capture debt and credit cards section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for sections to load
    await page.waitForSelector('text=Debt Overview')
    await page.waitForSelector('text=Credit Card Payment Tracker')

    // Take screenshot of debt and credit cards section
    const debtSection = page.locator('section').nth(2)
    await debtSection.screenshot({
      path: '../../screenshots/04-debt-credit-cards.png',
    })
  })

  test('capture cash flow insights', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for cash flow section
    await page.waitForSelector('text=Cash Flow Insights')
    await page.waitForSelector('text=Income vs Expenses')

    // Take screenshot of cash flow section
    const cashFlowSection = page.locator('section').nth(3)
    await cashFlowSection.screenshot({
      path: '../../screenshots/05-cash-flow-insights.png',
    })
  })

  test('capture notifications section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for notifications section
    await page.waitForSelector('text=Notifications & Alerts')

    // Take screenshot of notifications section
    const notificationsSection = page.locator('section').nth(4)
    await notificationsSection.screenshot({
      path: '../../screenshots/06-notifications-alerts.png',
    })
  })

  test('capture mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for dashboard to load
    await page.waitForSelector('text=Financial Dashboard')

    // Take full page screenshot in mobile view
    await page.screenshot({
      path: '../../screenshots/07-mobile-view.png',
      fullPage: true,
    })
  })

  test('capture tablet view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for dashboard to load
    await page.waitForSelector('text=Financial Dashboard')

    // Take full page screenshot in tablet view
    await page.screenshot({
      path: '../../screenshots/08-tablet-view.png',
      fullPage: true,
    })
  })

  test('capture desktop view with hover states', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for dashboard to load
    await page.waitForSelector('text=Financial Dashboard')

    // Hover over export button to show hover state
    await page.hover('button:has-text("Export")')

    // Take screenshot of header with hover state
    const header = page.locator('header')
    await header.screenshot({
      path: '../../screenshots/09-header-hover-state.png',
    })
  })

  test('capture chart visualizations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Wait for charts to render
    await page.waitForSelector('.recharts-wrapper')
    await page.waitForTimeout(1000) // Give charts time to fully render

    // Take screenshot of investments pie chart
    const investmentsCard = page.locator('text=Investments Summary').locator('..')
    await investmentsCard.screenshot({
      path: '../../screenshots/10-investments-pie-chart.png',
    })

    // Take screenshot of debt trend graph
    const debtCard = page.locator('text=Debt Overview').locator('..')
    await debtCard.screenshot({
      path: '../../screenshots/11-debt-trend-graph.png',
    })

    // Take screenshot of cash flow charts
    const cashFlowCard = page.locator('text=Cash Flow Insights').locator('..')
    await cashFlowCard.screenshot({
      path: '../../screenshots/12-cash-flow-charts.png',
    })
  })
})
