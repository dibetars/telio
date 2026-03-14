import { useAuthStore } from '../stores/authStore'
import Layout from '../components/Layout'
import PatientDashboard from '../components/PatientDashboard'
import ProviderDashboard from '../components/ProviderDashboard'
import OrgDashboard from '../components/OrgDashboard'

export default function Dashboard() {
  const { user } = useAuthStore()

  return (
    <Layout>
      {user?.role === 'patient' ? (
        <PatientDashboard />
      ) : user?.role === 'provider' ? (
        <ProviderDashboard />
      ) : user?.role === 'organization' ? (
        <OrgDashboard />
      ) : (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Admin functionality coming soon.</p>
        </div>
      )}
    </Layout>
  )
}
