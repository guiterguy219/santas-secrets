import { useState } from 'react'
import { createDerangement, generateRevealUrl, validateAssignmentPossible } from '../utils'

function HomePage() {
  const [names, setNames] = useState([])
  const [currentName, setCurrentName] = useState('')
  const [assignments, setAssignments] = useState(null)
  const [error, setError] = useState('')
  const [exclusions, setExclusions] = useState([]) // Array of [name1, name2] pairs
  const [selectedForExclusion, setSelectedForExclusion] = useState(null)

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
    // Remove any exclusions involving this name
    setExclusions(exclusions.filter(([n1, n2]) => n1 !== nameToRemove && n2 !== nameToRemove))
    // Clear selection if the removed name was selected
    if (selectedForExclusion === nameToRemove) {
      setSelectedForExclusion(null)
    }
    setAssignments(null)
  }

  const handleNameClick = (name, event) => {
    if (!event.shiftKey) {
      // Regular click - clear selection
      setSelectedForExclusion(null)
      return
    }

    // Shift+click for exclusion handling
    if (selectedForExclusion === null) {
      // First selection
      setSelectedForExclusion(name)
    } else if (selectedForExclusion === name) {
      // Clicked same name - deselect
      setSelectedForExclusion(null)
    } else {
      // Second selection - toggle exclusion
      toggleExclusion(selectedForExclusion, name)
      setSelectedForExclusion(null)
    }
  }

  const toggleExclusion = (name1, name2) => {
    // Sort names to ensure consistent ordering
    const pair = [name1, name2].sort()
    const existingIndex = exclusions.findIndex(
      ([n1, n2]) => n1 === pair[0] && n2 === pair[1]
    )

    if (existingIndex >= 0) {
      // Remove existing exclusion
      setExclusions(exclusions.filter((_, i) => i !== existingIndex))
    } else {
      // Add new exclusion
      setExclusions([...exclusions, pair])
    }
    setAssignments(null)
  }

  const removeExclusion = (index) => {
    setExclusions(exclusions.filter((_, i) => i !== index))
    setAssignments(null)
  }

  const getExclusionPartners = (name) => {
    const partners = []
    for (const [n1, n2] of exclusions) {
      if (n1 === name) partners.push(n2)
      else if (n2 === name) partners.push(n1)
    }
    return partners
  }

  const generateAssignments = () => {
    if (names.length < 2) {
      setError('You need at least 2 people to create a Secret Santa!')
      return
    }

    // Validate that assignments are possible with current exclusions
    const validation = validateAssignmentPossible(names, exclusions)
    if (!validation.valid) {
      setError(validation.reason)
      return
    }

    try {
      const assignmentMap = createDerangement(names, exclusions)
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
              {names.length >= 2 && (
                <p className="exclusion-hint">
                  💡 <strong>Tip:</strong> Hold <kbd>Shift</kbd> and click two names to exclude them from being assigned to each other (e.g., spouses).
                </p>
              )}
              {selectedForExclusion && (
                <p className="selection-status">
                  🔗 <strong>{selectedForExclusion}</strong> selected — Shift+click another name to create an exclusion pair
                </p>
              )}
              <ul>
                {names.map((name, index) => {
                  const isSelected = selectedForExclusion === name
                  const partners = getExclusionPartners(name)
                  const hasPartners = partners.length > 0

                  return (
                    <li
                      key={index}
                      className={`name-item ${isSelected ? 'name-item-selected' : ''} ${hasPartners ? 'name-item-excluded' : ''}`}
                      onClick={(e) => handleNameClick(name, e)}
                    >
                      <div className="name-info">
                        <span className="name-text">{name}</span>
                        {hasPartners && (
                          <span className="exclusion-badge" title={`Won't be paired with: ${partners.join(', ')}`}>
                            🚫 {partners.join(', ')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeName(name)
                        }}
                        className="remove-button"
                        aria-label={`Remove ${name}`}
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {exclusions.length > 0 && (
            <div className="exclusions-list">
              <h3>Exclusion Pairs ({exclusions.length})</h3>
              <p className="exclusions-description">
                These pairs won't be assigned to give gifts to each other:
              </p>
              <ul>
                {exclusions.map(([name1, name2], index) => (
                  <li key={index} className="exclusion-item">
                    <span>{name1} ↔ {name2}</span>
                    <button
                      onClick={() => removeExclusion(index)}
                      className="remove-exclusion-button"
                      aria-label={`Remove exclusion between ${name1} and ${name2}`}
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
