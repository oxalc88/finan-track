import AccountsSummary from '../components/AccountsSummary';
import MobileHeader from '../components/MobileHeader';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';

export default function AccountsPage(): JSX.Element {
  const { data, isLoading } = useDashboard();
  const isMobile = useIsMobile();

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {isMobile && <MobileHeader title="Accounts" showBack />}
      <div className="p-4">
        <AccountsSummary accounts={data.accounts} />
      </div>
    </div>
  );
}
