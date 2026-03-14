export default function SimpleTest() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f8ff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#2563eb', fontSize: '2rem', marginBottom: '1rem' }}>
          Telio Health is Working! 🎉
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          React application is successfully rendering
        </p>
        <button 
          onClick={() => window.location.href = '/home'}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Go to Home Page
        </button>
      </div>
    </div>
  )
}