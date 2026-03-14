import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useTourStore } from './stores/tourStore'
import ProtectedRoute from './components/ProtectedRoute'
import WalkthroughTour from './components/WalkthroughTour'

// Public pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

// Feature pages
import Dashboard from './pages/Dashboard'
import Doctors from './pages/Doctors'
import DoctorProfile from './pages/DoctorProfile'
import Appointments from './pages/Appointments'
import BookAppointment from './pages/BookAppointment'
import AppointmentDetail from './pages/AppointmentDetail'
import Consultation from './pages/Consultation'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import MedicalRecords from './pages/MedicalRecords'
import Availability from './pages/Availability'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'

/** Reads ?tour=1 from the URL and auto-starts the tour after auth resolves */
function TourAutoStart() {
  const { startTour } = useTourStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tour') === '1') {
      const t = setTimeout(() => startTour(), 800)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function App() {
  const { checkUser } = useAuthStore()

  useEffect(() => {
    checkUser()
  }, [])

  return (
    <Router>
      {/* Tour overlay — needs to be inside Router for useNavigate */}
      <TourAutoStart />
      <WalkthroughTour />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — all roles */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/appointments/book" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
        <Route path="/appointments/:id" element={<ProtectedRoute><AppointmentDetail /></ProtectedRoute>} />
        <Route path="/consultation/:id" element={<ProtectedRoute><Consultation /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Patient-only */}
        <Route path="/doctors" element={<ProtectedRoute allowedRoles={['patient']}><Doctors /></ProtectedRoute>} />
        <Route path="/doctors/:id" element={<ProtectedRoute allowedRoles={['patient']}><DoctorProfile /></ProtectedRoute>} />
        <Route path="/medical-records" element={<ProtectedRoute allowedRoles={['patient']}><MedicalRecords /></ProtectedRoute>} />

        {/* Provider-only */}
        <Route path="/availability" element={<ProtectedRoute allowedRoles={['provider']}><Availability /></ProtectedRoute>} />

        {/* Admin-only */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
