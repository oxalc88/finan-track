import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import AccountsSummary from '../components/AccountsSummary'
import CashFlowInsights from '../components/CashFlowInsights'
import CreditCardTracker from '../components/CreditCardTracker'
import DebtOverview from '../components/DebtOverview'
import InvestmentsSummary from '../components/InvestmentsSummary'
import MobileDashboard from '../components/MobileDashboard'
import NotificationsAlerts from '../components/NotificationsAlerts'
import OverviewCards from '../components/OverviewCards'
import { useDashboard } from '../hooks/useDashboard'
import { useIsMobile } from '../hooks/useIsMobile'

export default function DashboardHome(): JSX.Element {
  const { data, isLoading, error } = useDashboard()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 font-semibold mb-2">Error loading dashboard</p>
          <p className="text-neutral-600">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div />
  }

  const handleNavigate = (section: string) => {
    navigate(`/${section}`)
  }

  // Mobile view - card-based interface
  if (isMobile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-neutral-900">FinanTrack</h1>
            <p className="text-sm text-neutral-600">{format(new Date(), 'EEEE, MMM d')}</p>
          </div>
        </header>

        <main className="pt-4">
          <MobileDashboard
            accounts={data.accounts}
            creditCards={data.creditCards}
            notifications={data.notifications}
            onNavigate={handleNavigate}
          />
        </main>
      </div>
    )
  }

  // Desktop view - full dashboard
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Financial Dashboard</h1>
              <p className="text-neutral-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
              >
                Export
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                  U
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-container mx-auto px-6 py-8">
        <section className="mb-8">
          <OverviewCards overview={data.overview} />
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <AccountsSummary accounts={data.accounts} />
          <InvestmentsSummary investments={data.investments} />
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <DebtOverview debts={data.debts} />
          <CreditCardTracker creditCards={data.creditCards} />
        </section>

        <section className="mb-8">
          <CashFlowInsights cashFlow={data.cashFlow} expenseCategories={data.expenseCategories} />
        </section>

        <section>
          <NotificationsAlerts notifications={data.notifications} />
        </section>
      </main>
    </div>
  )
}
