import { formatCurrency, getDaysUntil } from '../lib/formatters'
import type { Account, CreditCard, Notification } from '../types'

interface MobileDashboardProps {
  accounts: Account[]
  creditCards: CreditCard[]
  notifications: Notification[]
  onNavigate: (section: string) => void
}

interface PriorityCard {
  id: string
  title: string
  subtitle: string
  value?: string
  status: 'urgent' | 'warning' | 'normal'
  icon: string
  section: string
}

export default function MobileDashboard({
  accounts,
  creditCards,
  notifications,
  onNavigate,
}: MobileDashboardProps): JSX.Element {
  // Calculate total cash
  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  // Find urgent payments (within 3 days)
  const urgentPayments = creditCards
    .filter((card) => getDaysUntil(card.dueDate) <= 3)
    .map((card) => ({
      id: card.id,
      title: card.name,
      subtitle: `Due ${getDaysUntil(card.dueDate) === 0 ? 'today' : `in ${getDaysUntil(card.dueDate)} days`}`,
      value: formatCurrency(card.minimumPayment),
      status: getDaysUntil(card.dueDate) === 0 ? ('urgent' as const) : ('warning' as const),
      icon: '💳',
      section: 'credit-cards',
    }))

  // Find high utilization cards
  const highUtilizationCards = creditCards
    .filter((card) => card.utilizationPercentage >= 30)
    .map((card) => ({
      id: `util-${card.id}`,
      title: `${card.name} - High Usage`,
      subtitle: `${card.utilizationPercentage.toFixed(0)}% utilized`,
      value: formatCurrency(card.balance),
      status: 'warning' as const,
      icon: '⚠️',
      section: 'credit-cards',
    }))

  // Priority cards to show
  const priorityCards: PriorityCard[] = [
    {
      id: 'cash',
      title: 'Available Cash',
      subtitle: `${accounts.length} accounts`,
      value: formatCurrency(totalCash),
      status: 'normal',
      icon: '💰',
      section: 'accounts',
    },
    ...urgentPayments,
    ...highUtilizationCards,
  ]

  const getStatusColor = (status: PriorityCard['status']) => {
    switch (status) {
      case 'urgent':
        return 'border-error-500 bg-error-50'
      case 'warning':
        return 'border-warning-500 bg-warning-50'
      default:
        return 'border-neutral-200 bg-white'
    }
  }

  const getStatusTextColor = (status: PriorityCard['status']) => {
    switch (status) {
      case 'urgent':
        return 'text-error-900'
      case 'warning':
        return 'text-warning-900'
      default:
        return 'text-neutral-900'
    }
  }

  return (
    <div className="pb-20">
      {/* Priority Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-3 px-4">Priority</h2>
        <div className="space-y-3 px-4">
          {priorityCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.section)}
              className={`w-full text-left p-4 rounded-lg border-2 ${getStatusColor(card.status)} active:scale-98 transition-transform`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-3xl">{card.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${getStatusTextColor(card.status)}`}>
                      {card.title}
                    </h3>
                    <p className="text-sm text-neutral-600 mt-1">{card.subtitle}</p>
                  </div>
                </div>
                {card.value && (
                  <p className={`text-lg font-bold ${getStatusTextColor(card.status)} ml-2`}>
                    {card.value}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-3 px-4">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3 px-4">
          <button
            type="button"
            onClick={() => onNavigate('investments')}
            className="p-4 bg-white rounded-lg border border-neutral-200 active:bg-neutral-50 transition-colors"
          >
            <div className="text-3xl mb-2">📈</div>
            <p className="font-semibold text-neutral-900">Investments</p>
            <p className="text-xs text-neutral-500 mt-1">Portfolio</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('debt')}
            className="p-4 bg-white rounded-lg border border-neutral-200 active:bg-neutral-50 transition-colors"
          >
            <div className="text-3xl mb-2">📊</div>
            <p className="font-semibold text-neutral-900">Debt</p>
            <p className="text-xs text-neutral-500 mt-1">Overview</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('cash-flow')}
            className="p-4 bg-white rounded-lg border border-neutral-200 active:bg-neutral-50 transition-colors"
          >
            <div className="text-3xl mb-2">💸</div>
            <p className="font-semibold text-neutral-900">Cash Flow</p>
            <p className="text-xs text-neutral-500 mt-1">Insights</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="p-4 bg-white rounded-lg border border-neutral-200 active:bg-neutral-50 transition-colors relative"
          >
            <div className="text-3xl mb-2">🔔</div>
            <p className="font-semibold text-neutral-900">Alerts</p>
            <p className="text-xs text-neutral-500 mt-1">Notifications</p>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
