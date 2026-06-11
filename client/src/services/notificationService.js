import api from './api'

export const getNotifications = () => api.get('/notifications')
export const getUnreadCount = () => api.get('/notifications/unread')
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`)
export const sendNotification = (data) => api.post('/notifications/send', data)
export const saveFCMToken = (token) => api.post('/notifications/save-token', { token })
export const removeFCMToken = () => api.delete('/notifications/remove-token')
export const testPushNotification = (data) => api.post('/notifications/test', data)
