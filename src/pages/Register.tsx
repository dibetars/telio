import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { TelioLogoFull } from '../components/TelioLogo'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'patient' | 'provider' | 'organization'>('patient')
  const [isLoading, setIsLoading] = useState(false)

  const { user, signUp, error } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await signUp(email, password, name, role)
    setIsLoading(false)
  }

  const nameLabel =
    role === 'organization' ? 'Organization Name' : 'Full Name'
  const namePlaceholder =
    role === 'organization' ? 'e.g. City General Hospital' : 'Enter your full name'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <TelioLogoFull size="lg" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-1 text-sm text-gray-600">
            Join Telio Health to access healthcare services
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role selector — shown first so the name label updates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'patient',      label: 'Patient',      desc: 'Seeking care' },
                  { value: 'provider',     label: 'Doctor',        desc: 'Providing care' },
                  { value: 'organization', label: 'Hospital / Org', desc: 'Managing a team' },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-colors text-center ${
                      role === opt.value
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      checked={role === opt.value}
                      onChange={(e) => setRole(e.target.value as typeof role)}
                      className="sr-only"
                    />
                    <span className={`text-sm font-semibold ${role === opt.value ? 'text-brand-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder={namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-brand-600 hover:text-brand-500">
              Sign in here
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
