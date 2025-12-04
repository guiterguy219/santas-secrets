import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { decodeAssignment } from '../utils'

function RevealPage() {
  const { encoded } = useParams()
  const [revealed, setRevealed] = useState(false)

  const assignment = decodeAssignment(encoded)

  if (!assignment) {
    return (
      <div className="reveal-page error-page">
        <h1>🎅 Oops!</h1>
        <p>This link doesn't seem to be valid.</p>
        <p>Please check that you have the complete URL from your Secret Santa organizer.</p>
        <Link to="/" className="home-link">Go to Home</Link>
      </div>
    )
  }

  return (
    <div className="reveal-page">
      <header className="header">
        <h1>🎅 Santa's Secrets</h1>
      </header>

      <div className="reveal-card">
        <h2>Hello, {assignment.giver}! 👋</h2>

        {!revealed ? (
          <div className="pre-reveal">
            <p>Your Secret Santa assignment is ready!</p>
            <p className="warning">⚠️ Make sure no one else is looking at your screen!</p>
            <button
              onClick={() => setRevealed(true)}
              className="reveal-button"
            >
              🎁 Reveal My Assignment
            </button>
          </div>
        ) : (
          <div className="post-reveal">
            <p>You are buying a gift for:</p>
            <div className="receiver-name">
              🎄 {assignment.receiver} 🎄
            </div>
            <p className="reminder">Remember to keep it a secret! 🤫</p>
          </div>
        )}
      </div>

      <Link to="/" className="home-link">Create your own Secret Santa</Link>
    </div>
  )
}

export default RevealPage
