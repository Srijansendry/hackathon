import api from './api'

export const loginUser = (email, password) => api.post('/auth/login', { email, password })
export const registerUser = (data) => api.post('/auth/register', data)
