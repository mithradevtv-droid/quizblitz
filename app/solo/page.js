'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, getQuestions } from '../../lib/questions'

const ROASTS = [
  "Wow. Just… wow.", "Did you even try?", "My goldfish scores higher.",
  "You should probably stick to Netflix.", "At least you showed up. That's something.",
  "Have you considered a different hobby? Like sleeping?",
  "The bar was on the floor and you still tripped.",
  "Not all heroes pass quizzes. You're definitely not a hero.",
]

const PRAISE = [
  "Suspiciously good. Did you cheat?", "Okay fine, you're not a complete disappointment.",
  "Nerd alert. 🚨", "Your parents might actually be proud. For once.",
  "Look at you, functioning like a real human being!",
]

export default function SoloPage() {
  const router = useRouter()
  const [step, setStep] = useState('category') // category | playing | result
  const [selectedCat, setSelectedCat] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [streak, setStreak] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [timerInterval, setTimerInterval] = useState(null)
  const [answers, setAnswers] = useState([])

  const startQuiz = (catId) => {
    const qs = getQuestions(catId, 8)
    setQuestions(qs)
    setSelectedCat(catId)
    setCurrent(0)
    setScore(0)
    setStreak(0)
    setAnswers([])
    setStep('playing')
    setSelected(null)
    setShowResult(false)
    startTimer()
  }

  const startTimer = () => {
    setTimeLeft(15)
    setStartTime(Date.now())
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(iv)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    setTimerInterval(iv)
  }

  const handleTimeout = () => {
    setSelected(-1)
    setShowResult(true)
    setStreak(0)
  }

  const submitAnswer = (index) => {
    if (selected !== null) return
    clearInterval(timerInterval)
    const timeTaken = Date.now() - startTime
    const q = questions[current]
    const correct = index === q.answer
    const speedBonus = correct ? Math.max(0, Math.floor((15000 - timeTaken) / 150)) : 0
    const points = correct ? 100 + speedBonus : 0
    const newStreak = correct ? streak + 1 : 0
    const streakBonus = newStreak >= 3 ? 50 : 0

    setSelected(index)
    setShowResult(true)
    setStreak(newStreak)
    if (correct) setScore(s => s + points + streakBonus)
    setAnswers(a => [...a, { correct, points: points + streakBonus }])
  }

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setStep('result')
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowResult(false)
      startTimer()
    }
  }

  const q = questions[current]
  const pct = questions.length ? Math.round((score / (questions.length * 150)) * 100) : 0
  const roast = pct >= 70 ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : ROASTS[Math.floor(Math.random() * ROASTS.length)]
  const correctCount = answers.filter(a => a.correct).length

  if (step === 'category') return (
    <div className="page">
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="logo">☠ QuizBlitz</div>
        <h2>Pick Your Poison</h2>
        <p>Choose a category. Try not to embarrass yourself.</p>
        <div className="cat-grid">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className={`cat-card ${selectedCat === cat.id ? 'selected' : ''}`} onClick={() => setSelectedCat(cat.id)}>
              <div className="cat-icon">{cat.label.split(' ')[0]}</div>
              <div className="cat-name">{cat.label.split(' ').slice(1).join(' ')}</div>
              <div className="cat-desc">{cat.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => selectedCat && startQuiz(selectedCat)} disabled={!selectedCat}>
          ☠ Begin the Suffering
        </button>
        <button className="btn btn-secondary" onClick={() => router.push('/')}>← Escape</button>
      </div>
    </div>
  )

  if (step === 'playing' && q) return (
    <div className="page">
      <div className="card" style={{ maxWidth: 580 }}>
        <div className="score-bar">
          <div>
            <div className="score-label">Score</div>
            <div className="score-val">{score}</div>
          </div>
          {streak >= 3 && <div style={{ color: 'var(--yellow)', fontSize: 12, fontWeight: 800 }}>🔥 {streak} STREAK</div>}
          <div style={{ textAlign: 'right' }}>
            <div className="score-label">Time</div>
            <div className="score-val" style={{ color: timeLeft <= 5 ? 'var(--red)' : 'var(--accent)' }}>{timeLeft}s</div>
          </div>
        </div>

        <div className="q-header">
          <span className="q-counter">Q {current + 1} / {questions.length}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>{CATEGORIES.find(c => c.id === selectedCat)?.label}</span>
        </div>
        <div className="timer-bar">
          <div className="timer-fill" style={{ width: `${(timeLeft / 15) * 100}%` }} />
        </div>

        <div className="question-text">{q.q}</div>

        <div className="options-grid">
          {q.options.map((opt, i) => {
            let cls = 'option-btn'
            if (showResult) {
              if (i === q.answer) cls += ' reveal-correct'
              else if (i === selected && selected !== q.answer) cls += ' wrong'
            }
            return (
              <button key={i} className={cls} onClick={() => submitAnswer(i)} disabled={showResult}>
                {opt}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            {selected === q.answer
              ? <div className="badge badge-green">✅ CORRECT {streak >= 3 ? `· 🔥 STREAK BONUS` : ''}</div>
              : selected === -1
              ? <div className="badge badge-red">⏰ TIME'S UP, DUMMY</div>
              : <div className="badge badge-red">❌ WRONG. THE ANSWER WAS RIGHT THERE.</div>
            }
            <br />
            <button className="btn btn-primary" style={{ maxWidth: 240, marginTop: 12 }} onClick={nextQuestion}>
              {current + 1 >= questions.length ? '📊 See Results' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (step === 'result') return (
    <div className="page">
      <div className="card result-screen">
        <div className="result-big">{pct >= 70 ? '🏆' : pct >= 40 ? '😬' : '💀'}</div>
        <div className="result-label">Final Score</div>
        <div className="result-score">{score}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0', fontFamily: 'monospace' }}>
          {correctCount} / {questions.length} correct · {pct}% accuracy
        </div>
        <div className="result-msg">"{roast}"</div>
        <button className="btn btn-primary" onClick={() => startQuiz(selectedCat)}>🔄 Try Again (It won't help)</button>
        <button className="btn btn-secondary" onClick={() => setStep('category')}>Change Category</button>
        <button className="btn btn-secondary" onClick={() => router.push('/')}>← Home</button>
      </div>
    </div>
  )
}
