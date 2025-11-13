import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '../lib/formatters'
import type { Notification } from '../types'

interface NotificationsAlertsProps {
  notifications: Notification[]
}

export default function NotificationsAlerts({
  notifications,
}: NotificationsAlertsProps): JSX.Element {
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

  const getPriorityVariant = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'error' as const
      case 'medium':
        return 'warning' as const
      case 'low':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  const getBorderClass = (priority: Notification['priority']): string => {
    switch (priority) {
      case 'high':
        return 'border-l-error-500 bg-error-50/50'
      case 'medium':
        return 'border-l-warning-500 bg-warning-50/50'
      case 'low':
        return 'border-l-primary bg-primary/5'
      default:
        return 'border-l-border bg-muted/50'
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notifications & Alerts</CardTitle>
          {unreadNotifications.length > 0 && (
            <Badge variant="error">{unreadNotifications.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {unreadNotifications.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-foreground">Unread</h3>
              {unreadNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-l-4 ${getBorderClass(notification.priority)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{notification.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={getPriorityVariant(notification.priority)}
                              className="text-xs"
                            >
                              {notification.priority.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(notification.date)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {readNotifications.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-foreground mt-6">Read</h3>
              {readNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="border-l-4 border-l-border bg-muted/50 opacity-60"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-foreground">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.date)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
