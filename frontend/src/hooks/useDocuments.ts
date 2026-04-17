import { useQuery } from '@tanstack/react-query';
import { type DocumentsFilter, fetchDocuments } from '../lib/api';

export function useDocuments(filter?: DocumentsFilter) {
  return useQuery({
    queryKey: ['documents', filter ?? {}],
    queryFn: () => fetchDocuments(filter),
  });
}
