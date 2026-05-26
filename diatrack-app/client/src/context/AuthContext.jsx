import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, registerUser } from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('diatrack_user')
    if (saved) setUser(JSON.parse(saved))
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await loginUser(email, password)
    localStorage.setItem('diatrack_token', data.token)
    localStorage.setItem('diatrack_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await registerUser(formData)
    localStorage.setItem('diatrack_token', data.token)
    localStorage.setItem('diatrack_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('diatrack_token')
    localStorage.removeItem('diatrack_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
