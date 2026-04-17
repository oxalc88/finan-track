import type { DashboardData } from '@finanzas/shared-types';
import type {
  Conciliacion,
  Discrepancia,
  DocumentoFuente,
  EstadoDocumento,
  MatchConciliacion,
  QueryAnswer,
} from '../types/domain';

const API_BASE_URL = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

export function fetchDashboardData(): Promise<DashboardData> {
  return request<DashboardData>('/dashboard');
}

export interface DocumentsFilter {
  estado?: EstadoDocumento;
  limit?: number;
  offset?: number;
}

export function fetchDocuments(
  filter?: DocumentsFilter
): Promise<DocumentoFuente[]> {
  const params = new URLSearchParams();
  if (filter?.estado) {
    params.set('estado', filter.estado);
  }
  if (filter?.limit !== undefined) {
    params.set('limit', String(filter.limit));
  }
  if (filter?.offset !== undefined) {
    params.set('offset', String(filter.offset));
  }
  const qs = params.toString();
  return request<DocumentoFuente[]>(`/documents${qs ? `?${qs}` : ''}`);
}

export interface PresignedUrl {
  url: string;
  tier: 'HOT' | 'ARCHIVE';
}

export function fetchDocumentUrl(id: string): Promise<PresignedUrl> {
  return request<PresignedUrl>(`/documents/${encodeURIComponent(id)}/url`);
}

export function fetchConciliations(): Promise<Conciliacion[]> {
  return request<Conciliacion[]>('/conciliations');
}

export function fetchConciliationMatches(
  id: string
): Promise<MatchConciliacion[]> {
  return request<MatchConciliacion[]>(
    `/conciliations/${encodeURIComponent(id)}/matches`
  );
}

export function fetchConciliationDiscrepancias(
  id: string
): Promise<Discrepancia[]> {
  return request<Discrepancia[]>(
    `/conciliations/${encodeURIComponent(id)}/discrepancias`
  );
}

export function fetchDiscrepanciasPending(): Promise<Discrepancia[]> {
  return request<Discrepancia[]>('/conciliations/discrepancias/pending');
}

export function resolveDiscrepancia(
  id: string,
  resolucion: string
): Promise<Discrepancia> {
  return request<Discrepancia>(
    `/conciliations/discrepancias/${encodeURIComponent(id)}/resolve`,
    {
      method: 'PATCH',
      body: JSON.stringify({ resolucion }),
    }
  );
}

export function ignoreDiscrepancia(id: string): Promise<Discrepancia> {
  return request<Discrepancia>(
    `/conciliations/discrepancias/${encodeURIComponent(id)}/ignore`,
    { method: 'PATCH' }
  );
}

export function postQuery(question: string): Promise<QueryAnswer> {
  return request<QueryAnswer>('/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
