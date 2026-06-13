import api from './api'

export const loginUser = (email, password) => api.post('/auth/login', { email, password })
export const registerUser = (data) => api.post('/auth/register', data)
export const forgotPasswordService = (email) => api.post('/auth/forgot-password', { email })
export const resetPasswordService = (token, password) => api.post('/auth/reset-password', { token, password })
