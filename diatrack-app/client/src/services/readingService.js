import api from './api'

export const addReading = (data) => api.post('/readings/add', data)
export const getReadings = (patientId, filter = 'monthly') => api.get(`/readings/${patientId}?filter=${filter}`)
export const getStats = (patientId) => api.get(`/readings/stats/${patientId}`)
export const getMealAverages = (patientId) => api.get(`/readings/meals/${patientId}`)
