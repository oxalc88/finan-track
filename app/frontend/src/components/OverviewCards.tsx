import { formatCurrency, formatPercentage } from '../lib/formatters'

interface OverviewCardsProps {
  overview: {
    cashBalance: number
    totalInvestments: number
    totalDebt: number
    netWorth: number
    changes: {
      cashBalance: number
      totalInvestments: number
      totalDebt: number
      netWorth: number
    }
  }
}

interface StatCardProps {
  label: string
  value: number
  change: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

function StatCard({ label, value, change, variant = 'default' }: StatCardProps): JSX.Element {
  const isPositive = change > 0
  const changeColor = variant === 'danger'
    ? (isPositive ? 'text-error-600' : 'text-success-600')
    : (isPositive ? 'text-success-600' : 'text-error-600')

  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{formatCurrency(value)}</p>
      <p className={`stat-change ${changeColor}`}>
        {formatPercentage(change)}
      </p>
    </div>
  )
}

export default function OverviewCards({ overview }: OverviewCardsProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Cash Balance"
        value={overview.cashBalance}
        change={overview.changes.cashBalance}
      />
      <StatCard
        label="Total Investments"
        value={overview.totalInvestments}
        change={overview.changes.totalInvestments}
      />
      <StatCard
        label="Total Debt"
        value={overview.totalDebt}
        change={overview.changes.totalDebt}
        variant="danger"
      />
      <StatCard
        label="Net Worth"
        value={overview.netWorth}
        change={overview.changes.netWorth}
        variant="success"
      />
    </div>
  )
}
