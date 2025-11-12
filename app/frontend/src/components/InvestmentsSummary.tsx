import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency, formatPercentage } from '../lib/formatters'
import type { Investment } from '../types'

interface InvestmentsSummaryProps {
  investments: Investment[]
}

const COLORS = {
  stocks: '#3b82f6',
  bonds: '#22c55e',
  real_estate: '#f59e0b',
  crypto: '#d946ef',
}

export default function InvestmentsSummary({ investments }: InvestmentsSummaryProps): JSX.Element {
  const total = investments.reduce((sum, inv) => sum + inv.value, 0)
  const totalGain = investments.reduce((sum, inv) => sum + inv.gain, 0)

  const chartData = investments.map((inv) => ({
    name: inv.name,
    value: inv.value,
    type: inv.type,
  }))

  return (
    <div className="card">
      <h2 className="card-header">Investments Summary</h2>

      <div className="mb-6">
        {investments.map((investment) => (
          <div
            key={investment.id}
            className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[investment.type] }}
              />
              <div>
                <p className="font-medium text-neutral-900">{investment.name}</p>
                <p className="text-sm text-neutral-500 capitalize">
                  {investment.type.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-neutral-900">
                {formatCurrency(investment.value)}
              </p>
              <p className={`text-sm ${investment.gain >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatPercentage(investment.gainPercentage)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">Total Value</p>
            <p className="text-xl font-bold text-neutral-900">{formatCurrency(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Total Gain/Loss</p>
            <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {formatCurrency(totalGain)}
            </p>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.type]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
