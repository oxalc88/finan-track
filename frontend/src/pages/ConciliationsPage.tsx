import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ConciliationDetail from '../components/ConciliationDetail';
import MobileHeader from '../components/MobileHeader';
import { useConciliations } from '../hooks/useConciliations';
import { useIsMobile } from '../hooks/useIsMobile';
import type { EstadoConciliacion } from '../types/domain';

const STATE_VARIANT: Record<
  EstadoConciliacion,
  'warning' | 'success' | 'error'
> = {
  EN_PROCESO: 'warning',
  COMPLETADA: 'success',
  COMPLETADA_CON_DISCREPANCIAS: 'error',
};

export default function ConciliationsPage(): JSX.Element {
  const { data, isLoading, error } = useConciliations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-neutral-50">
      {isMobile ? (
        <MobileHeader title="Conciliations" />
      ) : (
        <header className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="max-w-container mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-neutral-900">
              Conciliations
            </h1>
            <p className="text-neutral-600 mt-1">
              Cross-reference runs and their discrepancies.
            </p>
          </div>
        </header>
      )}

      <main className="max-w-container mx-auto px-6 py-8 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Runs</h2>
          {isLoading && <p className="text-neutral-600">Loading…</p>}
          {error && (
            <p className="text-error-600">
              {(error as Error).message}
            </p>
          )}
          {data && data.length === 0 && (
            <p className="text-neutral-600">No conciliation runs yet.</p>
          )}
          {data && data.length > 0 && (
            <ul className="space-y-3">
              {data.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className="w-full text-left"
                  >
                    <Card
                      className={
                        selectedId === c.id
                          ? 'ring-2 ring-primary-500'
                          : 'hover:shadow-md transition-shadow'
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-medium text-foreground">
                            {c.tipo}
                          </span>
                          <Badge variant={STATE_VARIANT[c.estado]}>
                            {c.estado}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Periodo: {c.periodo}
                        </p>
                        <p className="text-sm text-neutral-600">
                          matches: {c.total_matches} · discrepancias:{' '}
                          {c.total_discrepancias}
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          {selectedId ? (
            <ConciliationDetail conciliationId={selectedId} />
          ) : (
            <p className="text-neutral-600">Select a run to see details.</p>
          )}
        </section>
      </main>
    </div>
  );
}
