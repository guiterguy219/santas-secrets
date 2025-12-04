import { useState } from 'react'
import { createDerangement, generateRevealUrl } from '../utils'

function HomePage() {
  const [names, setNames] = useState([])
  const [currentName, setCurrentName] = useState('')
  const [assignments, setAssignments] = useState(null)
  const [error, setError] = useState('')

  const addName = (e) => {
    e.preventDefault()
    const trimmedName = currentName.trim()

    if (!trimmedName) {
      setError('Please enter a name')
      return
    }

    if (names.includes(trimmedName)) {
      setError('This name is already in the list')
      return
    }

    setNames([...names, trimmedName])
    setCurrentName('')
    setError('')
  }

  const removeName = (nameToRemove) => {
    setNames(names.filter(name => name !== nameToRemove))
    setAssignments(null)
  }

  const generateAssignments = () => {
    if (names.length < 2) {
      setError('You need at least 2 people to create a Secret Santa!')
      return
    }

    try {
      const assignmentMap = createDerangement(names)
      const assignmentList = names.map(name => ({
        giver: name,
        receiver: assignmentMap.get(name),
        url: generateRevealUrl(name, assignmentMap.get(name))
      }))
      setAssignments(assignmentList)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const resetAll = () => {
    setAssignments(null)
  }

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="home-page">
      <header className="header">
        <h1>🎅 Santa's Secrets</h1>
        <p>Create your Secret Santa gift exchange!</p>
      </header>

      {!assignments ? (
        <div className="setup-section">
          <form onSubmit={addName} className="name-form">
            <input
              type="text"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              placeholder="Enter a participant's name"
              className="name-input"
            />
            <button type="submit" className="add-button">
              Add Name
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}

          {names.length > 0 && (
            <div className="names-list">
              <h2>Participants ({names.length})</h2>
              <ul>
                {names.map((name, index) => (
                  <li key={index} className="name-item">
                    <span>{name}</span>
                    <button
                      onClick={() => removeName(name)}
                      className="remove-button"
                      aria-label={`Remove ${name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={generateAssignments}
            disabled={names.length < 2}
            className="generate-button"
          >
            🎁 Generate Secret Santa Assignments
          </button>

          {names.length < 2 && names.length > 0 && (
            <p className="hint">Add at least {2 - names.length} more {2 - names.length === 1 ? 'person' : 'people'} to get started!</p>
          )}
        </div>
      ) : (
        <div className="assignments-section">
          <h2>🎄 Assignments Ready!</h2>
          <p className="instructions">
            Share each person's unique link with them. When they open it, they'll see who they're buying a gift for!
          </p>

          <div className="assignments-list">
            {assignments.map((assignment, index) => (
              <div key={index} className="assignment-card">
                <span className="giver-name">{assignment.giver}</span>
                <div className="link-section">
                  <input
                    type="text"
                    value={assignment.url}
                    readOnly
                    className="url-input"
                  />
                  <button
                    onClick={() => copyToClipboard(assignment.url)}
                    className="copy-button"
                    title="Copy link"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={resetAll} className="reset-button">
            ← Back to Edit Names
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage
