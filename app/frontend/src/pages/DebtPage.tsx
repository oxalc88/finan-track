import DebtOverview from '../components/DebtOverview';
import MobileHeader from '../components/MobileHeader';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';

export default function DebtPage(): JSX.Element {
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
      {isMobile && <MobileHeader title="Debt Overview" showBack />}
      <div className="p-4">
        <DebtOverview debts={data.debts} />
      </div>
    </div>
  );
}
