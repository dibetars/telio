import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface Props {
  children: React.ReactNode
  allowedRoles?: ('patient' | 'provider' | 'admin' | 'organization')[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading, checkUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    } else if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate, allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
