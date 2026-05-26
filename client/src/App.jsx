import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MobileNavProvider } from './context/MobileNavContext'
import Login from './pages/Login'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import CaretakerDashboard from './pages/CaretakerDashboard'
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

export default function App() {
  return (
    <AuthProvider>
      <MobileNavProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/readings" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </MobileNavProvider>
    </AuthProvider>
  )
}
