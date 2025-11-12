import { formatCurrency } from '../lib/formatters'
import type { Account } from '../types'

interface AccountsSummaryProps {
  accounts: Account[]
}

export default function AccountsSummary({ accounts }: AccountsSummaryProps): JSX.Element {
  const total = accounts.reduce((sum, account) => sum + account.balance, 0)

  const getAccountIcon = (type: Account['type']): string => {
    switch (type) {
      case 'checking':
        return '💳'
      case 'savings':
        return '🏦'
      case 'investment':
        return '📈'
      default:
        return '💰'
    }
  }

  return (
    <div className="card">
      <h2 className="card-header">Accounts Summary</h2>
      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getAccountIcon(account.type)}</span>
              <div>
                <p className="font-medium text-neutral-900">{account.name}</p>
                <p className="text-sm text-neutral-500 capitalize">{account.type}</p>
              </div>
            </div>
            <p className="font-semibold text-neutral-900">{formatCurrency(account.balance)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-neutral-900">Total</p>
          <p className="text-xl font-bold text-primary-600">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  )
}
