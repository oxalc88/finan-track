import type {
  ConciliationMatch,
  ConciliationRow,
  DashboardData,
  DiscrepancyRow,
  DocumentPipelineRow,
  QueryResult,
} from '@finanzas/shared-types';

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
  estado?: string;
  limit?: number;
  offset?: number;
}

export function fetchDocuments(
  filter?: DocumentsFilter
): Promise<DocumentPipelineRow[]> {
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
  return request<DocumentPipelineRow[]>(`/documents${qs ? `?${qs}` : ''}`);
}

export interface PresignedUrl {
  url: string;
  tier: 'HOT' | 'ARCHIVE';
}

export function fetchDocumentUrl(id: string): Promise<PresignedUrl> {
  return request<PresignedUrl>(`/documents/${encodeURIComponent(id)}/url`);
}

export function fetchConciliations(): Promise<ConciliationRow[]> {
  return request<ConciliationRow[]>('/conciliations');
}

export function fetchConciliationMatches(
  id: string
): Promise<ConciliationMatch[]> {
  return request<ConciliationMatch[]>(
    `/conciliations/${encodeURIComponent(id)}/matches`
  );
}

export function fetchConciliationDiscrepancias(
  id: string
): Promise<DiscrepancyRow[]> {
  return request<DiscrepancyRow[]>(
    `/conciliations/${encodeURIComponent(id)}/discrepancias`
  );
}

export function fetchDiscrepanciasPending(): Promise<DiscrepancyRow[]> {
  return request<DiscrepancyRow[]>('/conciliations/discrepancias/pending');
}

export function resolveDiscrepancia(
  id: string,
  resolucion: string
): Promise<DiscrepancyRow> {
  return request<DiscrepancyRow>(
    `/conciliations/discrepancias/${encodeURIComponent(id)}/resolve`,
    {
      method: 'PATCH',
      body: JSON.stringify({ resolucion }),
    }
  );
}

export function ignoreDiscrepancia(id: string): Promise<DiscrepancyRow> {
  return request<DiscrepancyRow>(
    `/conciliations/discrepancias/${encodeURIComponent(id)}/ignore`,
    { method: 'PATCH' }
  );
}

export function postQuery(question: string): Promise<QueryResult> {
  return request<QueryResult>('/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
