import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getDaysUntil } from '../lib/formatters';
import type { CreditCard } from '../types';

interface CreditCardTrackerProps {
  creditCards: CreditCard[];
}

export default function CreditCardTracker({ creditCards }: CreditCardTrackerProps): JSX.Element {
  const sortedCards = [...creditCards].sort((a, b) => {
    const daysA = getDaysUntil(a.dueDate);
    const daysB = getDaysUntil(b.dueDate);
    return daysA - daysB;
  });

  const getUtilizationVariant = (utilization: number) => {
    if (utilization >= 30) return 'error' as const;
    if (utilization >= 20) return 'warning' as const;
    return 'success' as const;
  };

  const getDueDateVariant = (dueDate: string) => {
    const days = getDaysUntil(dueDate);
    if (days <= 3) return 'error' as const;
    if (days <= 7) return 'warning' as const;
    return 'secondary' as const;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Payment Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCards.map((card) => {
            const daysUntilDue = getDaysUntil(card.dueDate);
            const availableCredit = card.creditLimit - card.balance;

            return (
              <Card key={card.id} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{card.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Balance: <span className="font-medium">{formatCurrency(card.balance)}</span>
                      </p>
                    </div>
                    <Badge variant={getUtilizationVariant(card.utilizationPercentage)}>
                      {card.utilizationPercentage.toFixed(1)}% Used
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Credit Limit</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(card.creditLimit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Available Credit</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(availableCredit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Minimum Payment</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(card.minimumPayment)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                      <Badge variant={getDueDateVariant(card.dueDate)}>
                        {daysUntilDue <= 0
                          ? 'Due today'
                          : daysUntilDue === 1
                            ? 'Due tomorrow'
                            : `${daysUntilDue} days`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4 bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <p className="text-sm font-medium text-foreground">
              💡 Tip: Pay off {sortedCards[0]?.name} first - due in{' '}
              {getDaysUntil(sortedCards[0]?.dueDate)} days
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
