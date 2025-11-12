# Financial Dashboard Screenshots

This folder contains screenshots of the financial dashboard implementation captured using Playwright.

## Available Screenshots

All screenshots have been successfully captured and are available in this directory:

### Desktop Views (1920x1080)

1. **01-full-dashboard.png** (295KB)
   - Complete dashboard overview with all sections
   - Shows header, overview cards, accounts, investments, debt, credit cards, cash flow, and notifications

2. **02-overview-cards.png** (11KB)
   - Overview cards section displaying Cash Balance, Total Investments, Total Debt, and Net Worth
   - Shows percentage changes for each metric

3. **03-accounts-investments.png** (70KB)
   - Side-by-side view of Accounts Summary and Investments Summary
   - Includes investment pie chart showing asset allocation

4. **04-debt-credit-cards.png** (89KB)
   - Debt Overview with trend graph and Credit Card Payment Tracker
   - Shows short-term and long-term debt breakdown
   - Credit card utilization and due dates

5. **05-cash-flow-insights.png** (61KB)
   - Cash Flow Insights with Income vs Expenses chart
   - Expense category breakdown pie chart
   - Detailed category listing with percentages

6. **06-notifications-alerts.png** (41KB)
   - Notifications & Alerts section
   - Unread and read notifications with priority indicators
   - Bill reminders and payment confirmations

### Responsive Views

7. **07-mobile-view.png** (260KB)
   - Full mobile view (375px width)
   - Demonstrates responsive design for mobile devices
   - All sections adapt to narrow viewport

8. **08-tablet-view.png** (258KB)
   - Full tablet view (768px width)
   - Shows tablet-optimized layout
   - Grid adjustments for medium screens

## Features Demonstrated

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Interactive data visualizations (pie charts, area charts, bar charts)
- ✅ Real-time financial data display
- ✅ Color-coded status indicators
- ✅ Priority-based notifications
- ✅ Credit utilization warnings
- ✅ Accessibility features (ARIA, semantic HTML)
- ✅ Theme integration from theme.config.json
- ✅ TypeScript type safety
- ✅ Biome code quality enforcement

## Regenerating Screenshots

To regenerate screenshots, run:

```bash
cd app/frontend
npm run dev &
node capture-screenshots.mjs
```

The script will automatically capture all dashboard views and save them to this directory.

## Viewing the Live Dashboard

To view the dashboard interactively:

```bash
cd app/frontend
npm install
npm run dev
```

Then visit http://localhost:3000 in your browser.

## Testing

Run the full Playwright test suite:

```bash
cd app/frontend
npm test
```

This validates all dashboard functionality including data display, charts, and responsive behavior.
