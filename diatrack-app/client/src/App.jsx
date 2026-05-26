import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MobileNavProvider } from './context/MobileNavContext'
import Login from './pages/Login'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import './index.css'

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Role-aware dashboard redirector
function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (user.role === 'Patient') {
    return <PatientDashboard />
  } else if (user.role === 'Doctor' || user.role === 'Caretaker') {
    return <DoctorDashboard />
  }
  
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <MobileNavProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/readings" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </MobileNavProvider>
    </AuthProvider>
  )
}
