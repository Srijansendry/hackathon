import api from './api'

export const getMessages = (receiverId) => api.get(`/messages/${receiverId}`)
export const sendMessage = (receiverId, text) => api.post('/messages/send', { receiverId, text })
