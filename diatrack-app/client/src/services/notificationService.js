import api from './api'

export const getNotifications = () => api.get('/notifications')
export const getUnreadCount = () => api.get('/notifications/unread')
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`)
export const sendNotification = (data) => api.post('/notifications/send', data)
