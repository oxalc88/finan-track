import { useQuery } from '@tanstack/react-query';
import { fetchConciliations } from '../lib/api';

export function useConciliations() {
  return useQuery({
    queryKey: ['conciliations'],
    queryFn: fetchConciliations,
  });
}
