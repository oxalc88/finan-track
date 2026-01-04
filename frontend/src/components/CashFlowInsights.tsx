import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../lib/formatters';
import type { CashFlowData, ExpenseCategory } from '../types';

interface CashFlowInsightsProps {
  cashFlow: CashFlowData[];
  expenseCategories: ExpenseCategory[];
}

const EXPENSE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#d946ef',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
];

export default function CashFlowInsights({
  cashFlow,
  expenseCategories,
}: CashFlowInsightsProps): JSX.Element {
  return (
    <div className="card">
      <h2 className="card-header">Cash Flow Insights</h2>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Income vs Expenses</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Expense Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                >
                  {expenseCategories.map((category, index) => (
                    <Cell
                      key={category.category}
                      fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Categories</h3>
          <div className="space-y-2">
            {expenseCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                  />
                  <span className="text-sm text-neutral-700">{category.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-xs text-neutral-500 w-12 text-right">
                    {category.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
