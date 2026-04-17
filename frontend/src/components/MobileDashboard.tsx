import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, getDaysUntil } from '../lib/formatters';
import type { Account, CreditCard } from '../types';

interface MobileDashboardProps {
  accounts: Account[];
  creditCards: CreditCard[];
  onNavigate: (section: string) => void;
}

interface PriorityCard {
  id: string;
  title: string;
  subtitle: string;
  value?: string;
  status: 'urgent' | 'warning' | 'normal';
  icon: string;
  section: string;
}

export default function MobileDashboard({
  accounts,
  creditCards,
  onNavigate,
}: MobileDashboardProps): JSX.Element {
  // Calculate total cash
  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);

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
    }));

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
    }));

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
  ];

  const getStatusVariant = (status: PriorityCard['status']) => {
    switch (status) {
      case 'urgent':
        return 'error' as const;
      case 'warning':
        return 'warning' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getCardClassName = (status: PriorityCard['status']) => {
    switch (status) {
      case 'urgent':
        return 'border-error-300 bg-error-50/50';
      case 'warning':
        return 'border-warning-300 bg-warning-50/50';
      default:
        return '';
    }
  };

  return (
    <div className="pb-20">
      {/* Priority Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3 px-4">Priority</h2>
        <div className="space-y-3 px-4">
          {priorityCards.map((card) => (
            <Card
              key={card.id}
              className={`cursor-pointer active:scale-98 transition-transform hover:shadow-md ${getCardClassName(card.status)}`}
              onClick={() => onNavigate(card.section)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl">{card.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{card.title}</h3>
                        {card.status !== 'normal' && (
                          <Badge variant={getStatusVariant(card.status)} className="text-xs">
                            {card.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                    </div>
                  </div>
                  {card.value && (
                    <p className="text-lg font-bold text-foreground ml-2">{card.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3 px-4">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3 px-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow active:bg-accent"
            onClick={() => onNavigate('accounts')}
          >
            <CardContent className="p-4">
              <div className="text-3xl mb-2">🏦</div>
              <p className="font-semibold text-foreground">Accounts</p>
              <p className="text-xs text-muted-foreground mt-1">Deposits</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow active:bg-accent"
            onClick={() => onNavigate('credit-cards')}
          >
            <CardContent className="p-4">
              <div className="text-3xl mb-2">💳</div>
              <p className="font-semibold text-foreground">Cards</p>
              <p className="text-xs text-muted-foreground mt-1">Credit</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow active:bg-accent"
            onClick={() => onNavigate('cash-flow')}
          >
            <CardContent className="p-4">
              <div className="text-3xl mb-2">💸</div>
              <p className="font-semibold text-foreground">Cash Flow</p>
              <p className="text-xs text-muted-foreground mt-1">Insights</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
