'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#dc2626' }}>Something went wrong</h1>
      <p>This usually means your environment variables aren&apos;t set up yet.</p>
      <h2>Quick Fix:</h2>
      <ol>
        <li>Copy <code>.env.example</code> to <code>.env.local</code></li>
        <li>Fill in your Supabase URL, anon key, and service role key</li>
        <li>Run the migration SQL in your Supabase SQL Editor</li>
        <li>Restart the dev server: <code>npm run dev</code></li>
      </ol>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>Error: {error.message}</p>
      <button onClick={reset} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Try Again</button>
    </div>
  )
}
