export default function Test() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand-800 mb-4">Telio Health Test Page</h1>
        <p className="text-lg text-gray-700 mb-6">
          If you can see this page, the application is working correctly!
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">✅ React is working</p>
          <p className="text-sm text-gray-600">✅ Tailwind CSS is loaded</p>
          <p className="text-sm text-gray-600">✅ Routing is functional</p>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Go to Home Page
        </button>
      </div>
    </div>
  )
}