'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '../../lib/socket'
import { CATEGORIES } from '../../lib/questions'

export default function HostPage() {
  const router = useRouter()
  const [step, setStep] = useState('setup')
  const [nickname, setNickname] = useState('')
  const [category, setCategory] = useState('general')
  const [roomCode, setRoomCode] = useState('')
  const [players, setPlayers] = useState([])
  const [question, setQuestion] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [isLast, setIsLast] = useState(false)
  const [final, setFinal] = useState([])
  const [answerCount, setAnswerCount] = useState({ answeredCount: 0, total: 0 })
  const [timeLeft, setTimeLeft] = useState(15)
  const timerRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const s = getSocket()
    socketRef.current = s
    s.on('room_created', ({ code }) => { setRoomCode(code); setStep('lobby') })
    s.on('players_update', (list) => setPlayers(list))
    s.on('new_question', (q) => {
      setQuestion(q); setAnswerCount({ answeredCount: 0, total: players.length })
      setTimeLeft(15); setStep('question')
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    })
    s.on('answer_count', (data) => setAnswerCount(data))
    s.on('leaderboard', ({ leaderboard, isLast }) => {
      clearInterval(timerRef.current); setLeaderboard(leaderboard); setIsLast(isLast); setStep('leaderboard')
    })
    s.on('game_over', ({ final }) => { setFinal(final); setStep('gameover') })
    return () => {
      s.off('room_created'); s.off('players_update'); s.off('new_question')
      s.off('answer_count'); s.off('leaderboard'); s.off('game_over')
      clearInterval(timerRef.current)
    }
  }, [players.length])

  const createRoom = () => {
    if (!nickname.trim()) return
    socketRef.current = getSocket()
    socketRef.current.emit('create_room', { nickname, category })
  }

  const medals = ['🥇', '🥈', '🥉']

  if (step === 'setup') return (
    <div className="page">
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="logo">☠ QuizBlitz</div>
        <h2>Host a Game</h2>
        <p>Pick a category. Create a room. Watch your friends suffer.</p>
        <input className="input" placeholder="Your nickname (be creative)" value={nickname} onChange={e => setNickname(e.target.value)} />
        <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'monospace' }}>Select Category</div>
        <div className="cat-grid">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className={`cat-card ${category === cat.id ? 'selected' : ''}`} onClick={() => setCategory(cat.id)}>
              <div className="cat-icon">{cat.label.split(' ')[0]}</div>
              <div className="cat-name">{cat.label.split(' ').slice(1).join(' ')}</div>
              <div className="cat-desc">{cat.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={createRoom} disabled={!nickname.trim()}>👑 Create Room</button>
        <button className="btn btn-secondary" onClick={() => router.push('/')}>← Back to Safety</button>
      </div>
    </div>
  )

  if (step === 'lobby') return (
    <div className="page">
      <div className="card">
        <div className="logo">☠ QuizBlitz</div>
        <p style={{ marginBottom: 4, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'monospace' }}>Room Code</p>
        <div className="code-display">{roomCode}</div>
        <p>Share this code. Or don't. Your call.</p>
        <div className="player-list">
          {players.length === 0
            ? <div className="waiting pulse">Waiting for victims to join...</div>
            : players.map(p => <span key={p.id} className="player-chip">💀 {p.nickname}</span>)
          }
        </div>
        <button className="btn btn-danger" onClick={() => socketRef.current.emit('start_game', { code: roomCode })} disabled={players.length === 0}>
          ☠ Start Game ({players.length} player{players.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  )

  if (step === 'question') return (
    <div className="page">
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="q-header">
          <span className="q-counter">Q {question.index + 1} / {question.total}</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: timeLeft <= 5 ? 'var(--red)' : 'var(--accent)', fontFamily: 'monospace' }}>{timeLeft}s</span>
        </div>
        <div className="timer-bar"><div className="timer-fill" style={{ width: `${(timeLeft / 15) * 100}%` }} /></div>
        <div className="question-text">{question.question}</div>
        <div className="options-grid">
          {question.options.map((opt, i) => <div key={i} className="option-btn" style={{ cursor: 'default' }}>{opt}</div>)}
        </div>
        <div className="answer-count">☠ {answerCount.answeredCount} / {answerCount.total} have answered (or given up)</div>
      </div>
    </div>
  )

  if (step === 'leaderboard') return (
    <div className="page">
      <h2 style={{ marginBottom: 20, fontSize: 22, letterSpacing: 2 }}>📊 WHO'S WINNING</h2>
      <div className="leaderboard">
        {leaderboard.map((p, i) => (
          <div key={i} className="lb-row">
            <span className="lb-rank">{medals[i] || `#${i + 1}`}</span>
            <span className="lb-name">{p.nickname}</span>
            <span className="lb-score">{p.score}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        {isLast
          ? <button className="btn btn-danger" style={{ maxWidth: 300 }} onClick={() => socketRef.current.emit('next_question', { code: roomCode })}>🏁 End Their Misery</button>
          : <button className="btn btn-primary" style={{ maxWidth: 300 }} onClick={() => socketRef.current.emit('next_question', { code: roomCode })}>➡️ Next Question</button>
        }
      </div>
    </div>
  )

  if (step === 'gameover') return (
    <div className="page">
      <div className="trophy">🏆</div>
      <h1 style={{ marginBottom: 6 }}>It's Over.</h1>
      <p style={{ marginBottom: 24 }}>Someone had to win. The rest of you should reflect.</p>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {final.map((p, i) => (
          <div key={i} className="lb-row">
            <span className="lb-rank">{medals[i] || `#${i + 1}`}</span>
            <span className="lb-name">{p.nickname}</span>
            <span className="lb-score">{p.score} pts</span>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ maxWidth: 300, marginTop: 24 }} onClick={() => router.push('/')}>Do It Again</button>
    </div>
  )
}
