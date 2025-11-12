import { formatDate } from '../lib/formatters'
import type { Notification } from '../types'

interface NotificationsAlertsProps {
  notifications: Notification[]
}

export default function NotificationsAlerts({ notifications }: NotificationsAlertsProps): JSX.Element {
  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'bill':
        return '📄'
      case 'payment':
        return '✅'
      case 'alert':
        return '⚠️'
      default:
        return '📢'
    }
  }

  const getPriorityColor = (priority: Notification['priority']): string => {
    switch (priority) {
      case 'high':
        return 'border-l-error-500 bg-error-50'
      case 'medium':
        return 'border-l-warning-500 bg-warning-50'
      case 'low':
        return 'border-l-primary-500 bg-primary-50'
      default:
        return 'border-l-neutral-300 bg-neutral-50'
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-header mb-0">Notifications & Alerts</h2>
        {unreadNotifications.length > 0 && (
          <span className="px-2 py-1 text-xs font-semibold text-white bg-error-500 rounded-full">
            {unreadNotifications.length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {unreadNotifications.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-neutral-700">Unread</h3>
            {unreadNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 rounded-md ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-neutral-900">{notification.title}</h4>
                      <span className="text-xs text-neutral-500">
                        {formatDate(notification.date)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {readNotifications.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-neutral-700 mt-6">Read</h3>
            {readNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 border-l-4 border-l-neutral-200 bg-neutral-50 rounded-md opacity-60"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-neutral-900">{notification.title}</h4>
                      <span className="text-xs text-neutral-500">
                        {formatDate(notification.date)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
