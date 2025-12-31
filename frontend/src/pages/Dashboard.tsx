import AccountsSummary from '../components/AccountsSummary';
import CashFlowInsights from '../components/CashFlowInsights';
import CreditCardTracker from '../components/CreditCardTracker';
import DashboardHeader from '../components/DashboardHeader';
import DebtOverview from '../components/DebtOverview';
import InvestmentsSummary from '../components/InvestmentsSummary';
import NotificationsAlerts from '../components/NotificationsAlerts';
import OverviewCards from '../components/OverviewCards';
import { useDashboard } from '../hooks/useDashboard';

export default function Dashboard(): JSX.Element {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 font-semibold mb-2">Error loading dashboard</p>
          <p className="text-neutral-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="max-w-container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <section className="mb-8">
          <OverviewCards overview={data.overview} />
        </section>

        {/* Accounts and Investments */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <AccountsSummary accounts={data.accounts} />
          <InvestmentsSummary investments={data.investments} />
        </section>

        {/* Debt and Credit Cards */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <DebtOverview debts={data.debts} />
          <CreditCardTracker creditCards={data.creditCards} />
        </section>

        {/* Cash Flow Insights */}
        <section className="mb-8">
          <CashFlowInsights cashFlow={data.cashFlow} expenseCategories={data.expenseCategories} />
        </section>

        {/* Notifications and Alerts */}
        <section>
          <NotificationsAlerts notifications={data.notifications} />
        </section>
      </main>
    </div>
  );
}
