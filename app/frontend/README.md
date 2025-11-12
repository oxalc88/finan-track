# FinanTrack Frontend

Financial dashboard built with React, Vite, Tailwind CSS, and TanStack Query.

## Features

- **Overview Cards**: Display cash balance, investments, debt, and net worth
- **Accounts Summary**: List all bank and cash accounts
- **Investments Summary**: Track stocks, bonds, real estate, and crypto with pie chart visualization
- **Debt Overview**: Monitor short-term and long-term debts with trend graphs
- **Credit Card Tracker**: Payment due dates, utilization, and recommendations
- **Cash Flow Insights**: Income vs expenses with category breakdown
- **Notifications & Alerts**: Bill reminders and payment alerts

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and caching
- **Recharts** - Charts and visualizations
- **TypeScript** - Type safety
- **Playwright** - End-to-end testing

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will run on http://localhost:3000

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Testing

### Run Playwright Tests

```bash
npm test
```

### Run Tests in UI Mode

```bash
npm run test:ui
```

## Project Structure

```
src/
├── components/          # React components
│   ├── DashboardHeader.tsx
│   ├── OverviewCards.tsx
│   ├── AccountsSummary.tsx
│   ├── InvestmentsSummary.tsx
│   ├── DebtOverview.tsx
│   ├── CreditCardTracker.tsx
│   ├── CashFlowInsights.tsx
│   └── NotificationsAlerts.tsx
├── pages/              # Page components
│   └── Dashboard.tsx
├── hooks/              # Custom React hooks
│   └── useDashboard.ts
├── lib/                # Utilities and API
│   ├── api.ts
│   └── formatters.ts
├── types/              # TypeScript types
│   └── index.ts
├── styles/             # Global styles
│   └── index.css
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Theme Configuration

The dashboard uses a customizable theme defined in `../../theme.config.json`. Colors can be modified there and will automatically apply to the entire dashboard.

## API Integration

Currently using mock data from `src/lib/api.ts`. To connect to a real backend:

1. Update the `API_BASE_URL` in `src/lib/api.ts`
2. Replace the `getMockDashboardData()` function with actual API calls
3. Ensure the backend returns data matching the `DashboardData` interface in `src/types/index.ts`

## Responsive Design

The dashboard is fully responsive and works on:
- Mobile devices (375px and up)
- Tablets (768px and up)
- Desktop (1024px and up)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
