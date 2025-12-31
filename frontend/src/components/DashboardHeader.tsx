import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function DashboardHeader(): JSX.Element {
  const today = new Date();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
            <p className="text-muted-foreground mt-1">{format(today, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">Export</Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                U
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
