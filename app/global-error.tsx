'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#EDEFEB', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: 32 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#121511', marginBottom: 8 }}>Something went wrong</h2>
          <pre style={{ fontSize: 12, color: '#6A6C6A', background: '#fff', padding: 16, borderRadius: 12, textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: 16 }}>
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
          <button onClick={reset} style={{ background: '#163300', color: '#9FE870', fontWeight: 700, fontSize: 14, padding: '10px 24px', borderRadius: 100, border: 'none', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
