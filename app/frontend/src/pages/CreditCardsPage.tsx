import CreditCardTracker from '../components/CreditCardTracker';
import MobileHeader from '../components/MobileHeader';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';

export default function CreditCardsPage(): JSX.Element {
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
      {isMobile && <MobileHeader title="Credit Cards" showBack />}
      <div className="p-4">
        <CreditCardTracker creditCards={data.creditCards} />
      </div>
    </div>
  );
}
