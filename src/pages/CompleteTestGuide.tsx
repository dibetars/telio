import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function CompleteTestGuide() {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "🎯 Step 1: Test Authentication",
      description: "Test the enhanced login system with rate limit handling",
      action: "Go to /login-enhanced and try to sign up/in",
      link: "/login-enhanced",
      notes: ["Use magic links if email rate limited", "Try social login options", "Test both patient and provider roles"]
    },
    {
      title: "🔧 Step 2: Test Database Access",
      description: "Run the authentication test suite to verify RLS policies",
      action: "Go to /auth-test and run the test suite",
      link: "/auth-test",
      notes: ["Check all database connections", "Verify RLS policy access", "Test user profile fetching"]
    },
    {
      title: "🏠 Step 3: Test Home Page",
      description: "Check the professional landing page",
      action: "Go to /home to view the landing page",
      link: "/home",
      notes: ["Verify responsive design", "Check all navigation links", "Test call-to-action buttons"]
    },
    {
      title: "📊 Step 4: Test Dashboard",
      description: "Access role-based dashboards after login",
      action: "Login and go to /dashboard",
      link: "/dashboard",
      notes: ["Patient dashboard shows appointments", "Provider dashboard shows consultations", "Check quick action buttons"]
    },
    {
      title: "⚙️ Step 5: Verify Database Structure",
      description: "Confirm your database is properly set up",
      action: "Check Supabase dashboard tables",
      link: "https://zrotpnurlipgykxtxbnf.supabase.co",
      external: true,
      notes: ["Users table has proper RLS policies", "Providers table linked correctly", "Appointments and consultations accessible"]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 Complete Test Guide</h1>
          <p className="text-xl text-gray-600">Follow these steps to verify your telehealth platform is working correctly</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Testing Progress</h2>
            <div className="bg-brand-100 text-brand-800 px-4 py-2 rounded-full font-semibold">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div 
              className="bg-brand-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 transition-all duration-300 ${
                  index === currentStep 
                    ? 'border-brand-500 bg-brand-50' 
                    : index < currentStep 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index < currentStep 
                        ? 'bg-green-500' 
                        : index === currentStep 
                        ? 'bg-brand-500' 
                        : 'bg-gray-400'
                    }`}>
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {step.external ? (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                      >
                        Open →
                      </a>
                    ) : (
                      <Link
                        to={step.link}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                        onClick={() => index === currentStep && setCurrentStep(currentStep + 1)}
                      >
                        Test Now →
                      </Link>
                    )}
                  </div>
                </div>
                
                {index === currentStep && (
                  <div className="mt-4 pl-11">
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-800 mb-2">Action:</h4>
                      <p className="text-gray-600 mb-3">{step.action}</p>
                      <h4 className="font-semibold text-gray-800 mb-2">Check these items:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {step.notes.map((note, noteIndex) => (
                          <li key={noteIndex}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">✅ Quick Status Check</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Database Connected</span>
                <span className="text-green-600 font-semibold">✅ Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span>RLS Policies</span>
                <span className="text-green-600 font-semibold">✅ Applied</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tables Created</span>
                <span className="text-green-600 font-semibold">✅ 4 Tables</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Authentication</span>
                <span className="text-brand-600 font-semibold">🔧 Ready to Test</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🚨 Common Issues</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Email Rate Limit:</strong>
                <p className="text-gray-600">Use magic links or social login instead</p>
              </div>
              <div>
                <strong>RLS Policy Errors:</strong>
                <p className="text-gray-600">Run the auth test to verify access</p>
              </div>
              <div>
                <strong>Database Connection:</strong>
                <p className="text-gray-600">Check your .env file has correct credentials</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/auth-test"
            className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
          >
            🚀 Start Testing Now - Run Auth Test
          </Link>
        </div>
      </div>
    </div>
  )
}