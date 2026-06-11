import api from './api'

// Notification history
export const getNotifications     = ()     => api.get('/notifications')
export const getUnreadCount       = ()     => api.get('/notifications/unread')
export const markAsRead           = (id)   => api.patch(`/notifications/${id}/read`)
export const markAllRead          = ()     => api.post('/notifications/mark-all-read')

// Legacy direct insert
export const sendNotification     = (data) => api.post('/notifications/send', data)

// FCM token lifecycle
export const saveFCMToken         = (token) => api.post('/notifications/save-token', { token })
export const removeFCMToken       = ()       => api.delete('/notifications/remove-token')

// Push delivery
export const testPushNotification = (data)  => api.post('/notifications/test', data)

/**
 * Send a push notification to a specific user.
 * Used by doctors/caretakers to alert patients.
 * type: 'Medicine' | 'High Sugar' | 'Low Sugar' | 'Appointment' | 'Emergency' | 'Alert'
 */
export const sendPushToUser = (userId, title, body, type = 'Alert') =>
  api.post('/notifications/push', { userId, title, body, type })
