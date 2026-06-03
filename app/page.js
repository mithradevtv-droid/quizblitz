'use client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  return (
    <div className="page">
      <div className="card">
        <div className="logo">☠ QuizBlitz</div>
        <div className="tagline">Test your brain. Fail publicly.</div>
        <p>A quiz game for people who enjoy suffering and trivia. Pick your poison.</p>

        <div className="mode-grid">
          <div className="mode-card" onClick={() => router.push('/solo')}>
            <div className="mode-icon">💀</div>
            <div className="mode-name">Solo Mode</div>
            <div className="mode-desc">Fail alone. No witnesses.</div>
          </div>
          <div className="mode-card" onClick={() => router.push('/host')}>
            <div className="mode-icon">👑</div>
            <div className="mode-name">Host Game</div>
            <div className="mode-desc">Humiliate friends live.</div>
          </div>
        </div>

        <button className="btn btn-danger" onClick={() => router.push('/play')}>
          🙋 Join a Game (enter code)
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--muted)', letterSpacing: 2, fontFamily: 'monospace' }}>
          NO REFUNDS · NO MERCY · NO LIFELINES
        </div>
      </div>
    </div>
  )
}
