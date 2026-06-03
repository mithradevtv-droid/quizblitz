'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '../../lib/socket'

export default function PlayPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('join')
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [isLast, setIsLast] = useState(false)
  const [final, setFinal] = useState([])
  const [timeLeft, setTimeLeft] = useState(15)
  const [startTime, setStartTime] = useState(null)
  const [error, setError] = useState('')
  const timerRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const s = getSocket()
    socketRef.current = s
    s.on('joined', () => setStep('waiting'))
    s.on('error', (msg) => setError(msg))
    s.on('new_question', (q) => {
      setQuestion(q); setSelected(null); setResult(null)
      setTimeLeft(15); setStartTime(Date.now()); setStep('question')
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    })
    s.on('answer_result', (res) => { clearInterval(timerRef.current); setResult(res) })
    s.on('leaderboard', ({ leaderboard, isLast }) => { setLeaderboard(leaderboard); setIsLast(isLast); setStep('leaderboard') })
    s.on('game_over', ({ final }) => { setFinal(final); setStep('gameover') })
    s.on('host_left', () => { alert('Host rage-quit. Game over.'); router.push('/') })
    return () => {
      s.off('joined'); s.off('error'); s.off('new_question')
      s.off('answer_result'); s.off('leaderboard'); s.off('game_over'); s.off('host_left')
      clearInterval(timerRef.current)
    }
  }, [router])

  const joinRoom = () => {
    if (!nickname.trim() || !code.trim()) return
    setError('')
    socketRef.current = getSocket()
    socketRef.current.emit('join_room', { code: code.toUpperCase(), nickname })
  }

  const submitAnswer = (index) => {
    if (selected !== null) return
    setSelected(index)
    socketRef.current.emit('submit_answer', { code: code.toUpperCase(), answerIndex: index, timeTaken: Date.now() - startTime })
  }

  const medals = ['🥇', '🥈', '🥉']

  if (step === 'join') return (
    <div className="page">
      <div className="card">
        <div className="logo">☠ QuizBlitz</div>
        <h2>Join a Game</h2>
        <p>Enter the room code. Try to beat people who've been waiting longer.</p>
        {error && <div style={{ color: 'var(--red)', marginBottom: 12, fontSize: 13, fontFamily: 'monospace' }}>☠ {error}</div>}
        <input className="input" placeholder="Your nickname" value={nickname} onChange={e => setNickname(e.target.value)} />
        <input className="input" placeholder="Room code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && joinRoom()} style={{ letterSpacing: 4, fontWeight: 700, fontFamily: 'monospace' }} />
        <button className="btn btn-danger" onClick={joinRoom} disabled={!nickname.trim() || !code.trim()}>Enter the Void</button>
        <button className="btn btn-secondary" onClick={() => router.push('/')}>← Retreat</button>
      </div>
    </div>
  )

  if (step === 'waiting') return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💀</div>
        <h2>You're in, {nickname}.</h2>
        <p className="pulse" style={{ marginBottom: 16 }}>Waiting for the host to start. Contemplate your choices.</p>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace', letterSpacing: 3 }}>ROOM: {code}</div>
      </div>
    </div>
  )

  if (step === 'question') return (
    <div className="page">
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="q-header">
          <span className="q-counter">Q {question.index + 1} / {question.total}</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: timeLeft <= 5 ? 'var(--red)' : 'var(--accent)', fontFamily: 'monospace' }}>{timeLeft}s</span>
        </div>
        <div className="timer-bar"><div className="timer-fill" style={{ width: `${(timeLeft / 15) * 100}%` }} /></div>
        <div className="question-text">{question.question}</div>
        <div className="options-grid">
          {question.options.map((opt, i) => {
            let cls = 'option-btn'
            if (result) {
              if (i === result.correct_index) cls += ' reveal-correct'
              else if (i === selected && !result.correct) cls += ' wrong'
            } else if (selected === i) cls += ' correct'
            return <button key={i} className={cls} onClick={() => submitAnswer(i)} disabled={selected !== null}>{opt}</button>
          })}
        </div>
        {result && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            {result.correct
              ? <div className="badge badge-green">✅ CORRECT. You're not totally hopeless.</div>
              : <div className="badge badge-red">❌ WRONG. Absolutely tragic.</div>
            }
            <p className="pulse" style={{ marginTop: 8, fontSize: 12 }}>Waiting for others to also fail...</p>
          </div>
        )}
      </div>
    </div>
  )

  if (step === 'leaderboard') return (
    <div className="page">
      <h2 style={{ marginBottom: 20, fontSize: 20, letterSpacing: 2 }}>📊 THE DAMAGE SO FAR</h2>
      <div className="leaderboard">
        {leaderboard.map((p, i) => (
          <div key={i} className="lb-row">
            <span className="lb-rank">{medals[i] || `#${i + 1}`}</span>
            <span className="lb-name">{p.nickname}</span>
            <span className="lb-score">{p.score}</span>
          </div>
        ))}
      </div>
      <p className="pulse" style={{ marginTop: 20, fontSize: 12 }}>{isLast ? 'Final results loading...' : 'Next question incoming...'}</p>
    </div>
  )

  if (step === 'gameover') return (
    <div className="page">
      <div className="trophy">🏆</div>
      <h1 style={{ marginBottom: 6 }}>Game Over.</h1>
      <p style={{ marginBottom: 24 }}>Here's how everyone performed. Or didn't.</p>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {final.map((p, i) => (
          <div key={i} className="lb-row">
            <span className="lb-rank">{medals[i] || `#${i + 1}`}</span>
            <span className="lb-name">{p.nickname}</span>
            <span className="lb-score">{p.score} pts</span>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ maxWidth: 300, marginTop: 24 }} onClick={() => router.push('/')}>Try Again</button>
    </div>
  )
}
