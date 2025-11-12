import { useQuery } from '@tanstack/react-query'
import { fetchDashboardData } from '../lib/api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  })
}
