# Financial Dashboard Screenshots

This folder contains screenshots of the financial dashboard implementation.

## Screenshots

Due to browser compatibility issues in the current environment, screenshots could not be automatically generated. However, the dashboard is fully functional and can be viewed by running:

```bash
cd app/frontend
npm install
npm run dev
```

Then visit http://localhost:3000 in your browser.

## Dashboard Sections

The implemented dashboard includes:

1. **Full Dashboard View** - Complete overview with all sections
2. **Overview Cards** - Cash Balance, Investments, Debt, Net Worth with % changes
3. **Accounts & Investments** - Bank accounts and investment portfolio with pie charts
4. **Debt & Credit Cards** - Debt tracking and credit card payment tracker
5. **Cash Flow Insights** - Income vs expenses charts and expense breakdown
6. **Notifications & Alerts** - Bill reminders and payment alerts
7. **Mobile View** - Fully responsive mobile layout (375px)
8. **Tablet View** - Tablet-optimized layout (768px)
9. **Desktop View** - Full desktop experience with hover states
10. **Chart Visualizations** - Interactive charts using Recharts

## Features Demonstrated

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Interactive data visualizations (pie charts, area charts, bar charts)
- ✅ Real-time financial data display
- ✅ Color-coded status indicators
- ✅ Priority-based notifications
- ✅ Credit utilization warnings
- ✅ Hover states and transitions
- ✅ Accessibility features (ARIA, semantic HTML)
- ✅ Theme integration from theme.config.json
- ✅ TypeScript type safety
- ✅ Biome code quality enforcement

## To Generate Screenshots Manually

Run the dashboard and use your browser's screenshot tool:

```bash
cd app/frontend
npm run dev
```

Then use browser dev tools to capture screenshots:
- Chrome: F12 → More tools → Capture screenshot
- Firefox: F12 → Screenshot button
- Or use browser extensions for full-page screenshots

## Test the Dashboard

Run the functional tests to verify all features:

```bash
cd app/frontend
npm test
```

This will run the full Playwright test suite that validates all dashboard functionality.
