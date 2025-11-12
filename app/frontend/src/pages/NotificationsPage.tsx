import MobileHeader from '../components/MobileHeader'
import NotificationsAlerts from '../components/NotificationsAlerts'
import { useDashboard } from '../hooks/useDashboard'
import { useIsMobile } from '../hooks/useIsMobile'

export default function NotificationsPage(): JSX.Element {
  const { data, isLoading } = useDashboard()
  const isMobile = useIsMobile()

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {isMobile && <MobileHeader title="Notifications" showBack />}
      <div className="p-4">
        <NotificationsAlerts notifications={data.notifications} />
      </div>
    </div>
  )
}
