import { useQuery } from '@tanstack/react-query';
import {
  fetchConciliationDiscrepancias,
  fetchConciliationMatches,
} from '../lib/api';

export function useConciliationMatches(id: string | null) {
  return useQuery({
    queryKey: ['conciliation', id, 'matches'],
    queryFn: () => fetchConciliationMatches(id as string),
    enabled: !!id,
  });
}

export function useConciliationDiscrepancias(id: string | null) {
  return useQuery({
    queryKey: ['conciliation', id, 'discrepancias'],
    queryFn: () => fetchConciliationDiscrepancias(id as string),
    enabled: !!id,
  });
}
