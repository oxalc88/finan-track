import { formatCurrency, getDaysUntil } from '../lib/formatters'
import type { CreditCard } from '../types'

interface CreditCardTrackerProps {
  creditCards: CreditCard[]
}

export default function CreditCardTracker({ creditCards }: CreditCardTrackerProps): JSX.Element {
  const sortedCards = [...creditCards].sort((a, b) => {
    const daysA = getDaysUntil(a.dueDate)
    const daysB = getDaysUntil(b.dueDate)
    return daysA - daysB
  })

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 30) return 'text-error-600 bg-error-50 border-error-200'
    if (utilization >= 20) return 'text-warning-600 bg-warning-50 border-warning-200'
    return 'text-success-600 bg-success-50 border-success-200'
  }

  const getDueDateColor = (dueDate: string): string => {
    const days = getDaysUntil(dueDate)
    if (days <= 3) return 'text-error-600'
    if (days <= 7) return 'text-warning-600'
    return 'text-neutral-600'
  }

  return (
    <div className="card">
      <h2 className="card-header">Credit Card Payment Tracker</h2>

      <div className="space-y-4">
        {sortedCards.map((card) => {
          const daysUntilDue = getDaysUntil(card.dueDate)
          const availableCredit = card.creditLimit - card.balance

          return (
            <div
              key={card.id}
              className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{card.name}</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Balance: <span className="font-medium">{formatCurrency(card.balance)}</span>
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-md border text-sm font-medium ${getUtilizationColor(card.utilizationPercentage)}`}>
                  {card.utilizationPercentage.toFixed(1)}% Used
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-neutral-500">Credit Limit</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatCurrency(card.creditLimit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Available Credit</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatCurrency(availableCredit)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <div>
                  <p className="text-xs text-neutral-500">Minimum Payment</p>
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(card.minimumPayment)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Due Date</p>
                  <p className={`text-sm font-semibold ${getDueDateColor(card.dueDate)}`}>
                    {daysUntilDue <= 0
                      ? 'Due today'
                      : daysUntilDue === 1
                        ? 'Due tomorrow'
                        : `${daysUntilDue} days`}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-sm font-medium text-primary-900">
          💡 Tip: Pay off {sortedCards[0]?.name} first - due in {getDaysUntil(sortedCards[0]?.dueDate)} days
        </p>
      </div>
    </div>
  )
}
