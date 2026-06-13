import { createContext, useContext, useState } from 'react'
import { loginUser, registerUser } from '../services/authService'
import { removeFCMToken } from '../services/notificationService'
import { getFCMToken } from '../firebase'
import { saveFCMToken } from '../services/notificationService'
import api from '../services/api'

const AuthContext = createContext()

const STORAGE_KEY = 'glucolyse_fcm_token'
const ASKED_KEY = 'glucolyse_notif_asked'

async function registerPushAfterLogin() {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return
    if (Notification.permission === 'denied') return

    await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    await navigator.serviceWorker.ready

    if (Notification.permission === 'granted') {
      const token = await getFCMToken()
      if (token && token !== localStorage.getItem(STORAGE_KEY)) {
        await saveFCMToken(token)
        localStorage.setItem(STORAGE_KEY, token)
      }
    }
  } catch (err) {
    console.error('Post-login push registration error:', err)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('diatrack_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading] = useState(false)

  const login = async (email, password) => {
    const { data } = await loginUser(email, password)
    localStorage.setItem('diatrack_token', data.token)
    localStorage.setItem('diatrack_user', JSON.stringify(data.user))
    setUser(data.user)
    registerPushAfterLogin()
    return data.user
  }

  const register = async (formData) => {
    const { data } = await registerUser(formData)
    localStorage.setItem('diatrack_token', data.token)
    localStorage.setItem('diatrack_user', JSON.stringify(data.user))
    setUser(data.user)
    registerPushAfterLogin()
    return data.user
  }

  const updateUser = async (updates) => {
    const { data } = await api.put('/auth/profile', updates)
    const updatedUser = { ...user, ...data.user }
    localStorage.setItem('diatrack_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    return updatedUser
  }

  const logout = async () => {
    try {
      await removeFCMToken()
    } catch {
      // Ignore background notification token removal errors
    }
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ASKED_KEY)
    localStorage.removeItem('diatrack_token')
    localStorage.removeItem('diatrack_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
