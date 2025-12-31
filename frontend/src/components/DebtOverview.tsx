import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../lib/formatters';
import type { Debt } from '../types';

interface DebtOverviewProps {
  debts: Debt[];
}

// Mock historical data for trend graph
const trendData = [
  { month: 'May', shortTerm: 3200, longTerm: 32000 },
  { month: 'Jun', shortTerm: 2900, longTerm: 31500 },
  { month: 'Jul', shortTerm: 2650, longTerm: 31000 },
  { month: 'Aug', shortTerm: 2500, longTerm: 30500 },
  { month: 'Sep', shortTerm: 2450, longTerm: 30000 },
  { month: 'Oct', shortTerm: 2450, longTerm: 30000 },
];

export default function DebtOverview({ debts }: DebtOverviewProps): JSX.Element {
  const shortTermDebt = debts
    .filter((d) => d.type === 'short_term')
    .reduce((sum, d) => sum + d.balance, 0);

  const longTermDebt = debts
    .filter((d) => d.type === 'long_term')
    .reduce((sum, d) => sum + d.balance, 0);

  return (
    <div className="card">
      <h2 className="card-header">Debt Overview</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <p className="text-sm font-medium text-warning-800 mb-1">Short-Term Debt</p>
          <p className="text-2xl font-bold text-warning-900">{formatCurrency(shortTermDebt)}</p>
        </div>
        <div className="p-4 bg-error-50 rounded-lg border border-error-200">
          <p className="text-sm font-medium text-error-800 mb-1">Long-Term Debt</p>
          <p className="text-2xl font-bold text-error-900">{formatCurrency(longTermDebt)}</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Debt Trend (Last 6 Months)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area
                type="monotone"
                dataKey="shortTerm"
                stackId="1"
                stroke="#f59e0b"
                fill="#fbbf24"
                name="Short-Term"
              />
              <Area
                type="monotone"
                dataKey="longTerm"
                stackId="1"
                stroke="#dc2626"
                fill="#ef4444"
                name="Long-Term"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Debt Details</h3>
        {debts.map((debt) => (
          <div key={debt.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-neutral-900">{debt.name}</p>
              <p className="font-semibold text-neutral-900">{formatCurrency(debt.balance)}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span>APR: {debt.interestRate}%</span>
              <span>Min Payment: {formatCurrency(debt.minimumPayment)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
