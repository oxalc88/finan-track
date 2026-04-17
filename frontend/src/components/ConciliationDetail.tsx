import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useConciliationDiscrepancias,
  useConciliationMatches,
} from '../hooks/useConciliationDetail';
import { ignoreDiscrepancia, resolveDiscrepancia } from '../lib/api';
import type { EstadoDiscrepancia } from '../types/domain';

interface ConciliationDetailProps {
  conciliationId: string;
}

const DISCREPANCIA_VARIANT: Record<
  EstadoDiscrepancia,
  'warning' | 'success' | 'secondary'
> = {
  PENDIENTE: 'warning',
  RESUELTA: 'success',
  IGNORADA: 'secondary',
};

export default function ConciliationDetail({
  conciliationId,
}: ConciliationDetailProps): JSX.Element {
  const matches = useConciliationMatches(conciliationId);
  const discrepancias = useConciliationDiscrepancias(conciliationId);
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({
      queryKey: ['conciliation', conciliationId, 'discrepancias'],
    });
    qc.invalidateQueries({ queryKey: ['conciliations'] });
  };

  const onResolve = async (id: string) => {
    const resolucion = window.prompt('Resolution note:');
    if (!resolucion) return;
    setPendingId(id);
    try {
      await resolveDiscrepancia(id, resolucion);
      invalidate();
    } finally {
      setPendingId(null);
    }
  };

  const onIgnore = async (id: string) => {
    setPendingId(id);
    try {
      await ignoreDiscrepancia(id);
      invalidate();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.isLoading && (
            <p className="text-neutral-600 text-sm">Loading matches…</p>
          )}
          {matches.data && matches.data.length === 0 && (
            <p className="text-neutral-600 text-sm">No matches.</p>
          )}
          {matches.data && matches.data.length > 0 && (
            <ul className="divide-y divide-neutral-200 text-sm">
              {matches.data.map((m) => (
                <li key={m.id} className="py-2 flex items-center gap-3">
                  <code className="text-xs text-neutral-500">{m.id}</code>
                  <span className="text-neutral-700">
                    {m.registro_fuente_a_tipo} ↔ {m.registro_fuente_b_tipo}
                  </span>
                  <span className="ml-auto text-neutral-500">
                    confianza: {(m.confianza * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discrepancies</CardTitle>
        </CardHeader>
        <CardContent>
          {discrepancias.isLoading && (
            <p className="text-neutral-600 text-sm">Loading discrepancies…</p>
          )}
          {discrepancias.data && discrepancias.data.length === 0 && (
            <p className="text-neutral-600 text-sm">No discrepancies.</p>
          )}
          {discrepancias.data && discrepancias.data.length > 0 && (
            <ul className="divide-y divide-neutral-200 text-sm">
              {discrepancias.data.map((d) => (
                <li
                  key={d.id}
                  className="py-3 flex items-center flex-wrap gap-3"
                >
                  <Badge variant={DISCREPANCIA_VARIANT[d.estado]}>
                    {d.estado}
                  </Badge>
                  <span className="text-neutral-700">{d.tipo}</span>
                  <code className="text-xs text-neutral-500">
                    {d.registro_tipo} {d.registro_id}
                  </code>
                  {d.estado === 'PENDIENTE' && (
                    <div className="ml-auto flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={pendingId === d.id}
                        onClick={() => onResolve(d.id)}
                      >
                        Resolve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingId === d.id}
                        onClick={() => onIgnore(d.id)}
                      >
                        Ignore
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
