import React, { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MobileNavProvider } from './context/MobileNavContext'
import Login from './pages/Login'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import CaretakerDashboard from './pages/CaretakerDashboard'
import ForegroundNotificationToast from './components/ForegroundNotificationToast'
import FCMTestPanel from './components/FCMTestPanel'
import { usePushNotifications } from './hooks/usePushNotifications'
import './index.css'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'Patient') return <PatientDashboard />
  if (user.role === 'Doctor') return <DoctorDashboard />
  if (user.role === 'Caretaker') return <CaretakerDashboard />
  return <Navigate to="/login" replace />
}

function PushNotificationManager() {
  const { user } = useAuth()
  const [foregroundNotif, setForegroundNotif] = useState(null)

  const handleForeground = useCallback((payload) => {
    setForegroundNotif(payload)
  }, [])

  usePushNotifications({
    onForegroundNotification: user ? handleForeground : undefined
  })

  return (
    <ForegroundNotificationToast
      notification={foregroundNotif}
      onClose={() => setForegroundNotif(null)}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MobileNavProvider>
        <BrowserRouter>
          <PushNotificationManager />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/readings" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/fcm-test" element={<FCMTestPanel />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </MobileNavProvider>
    </AuthProvider>
  )
}
