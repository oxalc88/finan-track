import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '../lib/formatters';

interface OverviewCardsProps {
  overview: {
    cashBalance: number;
    totalInvestments: number;
    totalDebt: number;
    netWorth: number;
    changes: {
      cashBalance: number;
      totalInvestments: number;
      totalDebt: number;
      netWorth: number;
    };
  };
}

interface StatCardProps {
  label: string;
  value: number;
  change: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, change, variant = 'default' }: StatCardProps): JSX.Element {
  const isPositive = change > 0;
  const isInverted = variant === 'danger'; // For debt, decrease is good

  const getBadgeVariant = () => {
    if (isInverted) {
      return isPositive ? 'error' : 'success';
    }
    return isPositive ? 'success' : 'error';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground mb-2">{formatCurrency(value)}</p>
        <Badge variant={getBadgeVariant()} className="text-xs">
          {isPositive ? '↑' : '↓'} {formatPercentage(Math.abs(change))}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function OverviewCards({ overview }: OverviewCardsProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Cash Balance"
        value={overview.cashBalance}
        change={overview.changes.cashBalance}
      />
      <StatCard
        label="Total Investments"
        value={overview.totalInvestments}
        change={overview.changes.totalInvestments}
      />
      <StatCard
        label="Total Debt"
        value={overview.totalDebt}
        change={overview.changes.totalDebt}
        variant="danger"
      />
      <StatCard
        label="Net Worth"
        value={overview.netWorth}
        change={overview.changes.netWorth}
        variant="success"
      />
    </div>
  );
}
