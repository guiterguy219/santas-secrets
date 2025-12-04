/**
 * Encodes assignment data into a URL-safe base64 string
 * @param {string} giverName - The name of the person giving the gift
 * @param {string} receiverName - The name of the person receiving the gift
 * @returns {string} URL-safe base64 encoded string
 */
export function encodeAssignment(giverName, receiverName) {
  const data = JSON.stringify({ giver: giverName, receiver: receiverName })
  const base64 = btoa(unescape(encodeURIComponent(data)))
  // Make URL-safe by replacing + with -, / with _, and removing =
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decodes a URL-safe base64 string back into assignment data
 * @param {string} encoded - The URL-safe base64 encoded string
 * @returns {{ giver: string, receiver: string } | null} The decoded assignment or null if invalid
 */
export function decodeAssignment(encoded) {
  try {
    // Restore standard base64 format
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    // Add back padding if needed
    while (base64.length % 4) {
      base64 += '='
    }
    const data = decodeURIComponent(escape(atob(base64)))
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * Checks if a giver can be assigned to a receiver given exclusions
 * @param {string} giver - The giver's name
 * @param {string} receiver - The receiver's name
 * @param {Array<[string, string]>} exclusions - Array of [name1, name2] pairs that can't be matched
 * @returns {boolean} True if the assignment is allowed
 */
function isAllowedAssignment(giver, receiver, exclusions) {
  if (giver === receiver) return false

  for (const [name1, name2] of exclusions) {
    if ((giver === name1 && receiver === name2) || (giver === name2 && receiver === name1)) {
      return false
    }
  }
  return true
}

/**
 * Uses backtracking to find a valid derangement respecting exclusions
 * @param {string[]} names - Array of participant names
 * @param {Array<[string, string]>} exclusions - Array of exclusion pairs
 * @returns {Map<string, string> | null} Map from giver to receiver, or null if impossible
 */
function findValidAssignment(names, exclusions) {
  const n = names.length
  const assignments = new Map()
  const usedReceivers = new Set()

  // Shuffle names to get random assignments each time
  const shuffledNames = [...names]
  for (let i = shuffledNames.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]]
  }

  function backtrack(giverIndex) {
    if (giverIndex === n) {
      return true // All assignments made successfully
    }

    const giver = shuffledNames[giverIndex]

    // Try each possible receiver in random order
    const possibleReceivers = [...names].sort(() => Math.random() - 0.5)

    for (const receiver of possibleReceivers) {
      if (usedReceivers.has(receiver)) continue
      if (!isAllowedAssignment(giver, receiver, exclusions)) continue

      // Try this assignment
      assignments.set(giver, receiver)
      usedReceivers.add(receiver)

      if (backtrack(giverIndex + 1)) {
        return true
      }

      // Backtrack
      assignments.delete(giver)
      usedReceivers.delete(receiver)
    }

    return false
  }

  if (backtrack(0)) {
    return assignments
  }
  return null
}

/**
 * Validates if a valid assignment is possible given the constraints
 * @param {string[]} names - Array of participant names
 * @param {Array<[string, string]>} exclusions - Array of exclusion pairs
 * @returns {{ valid: boolean, reason?: string }} Validation result
 */
export function validateAssignmentPossible(names, exclusions) {
  if (names.length < 2) {
    return { valid: false, reason: 'Need at least 2 participants' }
  }

  // Check if any person has too many exclusions
  for (const name of names) {
    let excludedCount = 0
    for (const [name1, name2] of exclusions) {
      if (name === name1 || name === name2) {
        excludedCount++
      }
    }
    // A person can give to (n-1) people (everyone except themselves)
    // With exclusions, they can give to (n-1-excludedCount) people
    // If that's 0 or less, it's impossible
    if (excludedCount >= names.length - 1) {
      return {
        valid: false,
        reason: `${name} has too many exclusions and cannot be assigned to anyone`
      }
    }
  }

  // Try to find a valid assignment
  const result = findValidAssignment(names, exclusions)
  if (!result) {
    return {
      valid: false,
      reason: 'No valid assignment exists with the current exclusions. Try removing some exclusions.'
    }
  }

  return { valid: true }
}

/**
 * Creates a derangement (permutation where no element appears in its original position)
 * This ensures no one is assigned to themselves and respects exclusion pairs
 * @param {string[]} names - Array of participant names
 * @param {Array<[string, string]>} exclusions - Array of [name1, name2] pairs that can't be matched
 * @returns {Map<string, string>} Map from giver to receiver
 */
export function createDerangement(names, exclusions = []) {
  if (names.length < 2) {
    throw new Error('Need at least 2 participants')
  }

  const result = findValidAssignment(names, exclusions)

  if (!result) {
    throw new Error('No valid assignment exists with the current exclusions. Try removing some exclusions.')
  }

  return result
}

/**
 * Generates the full URL for a participant's reveal page
 * @param {string} giverName - The name of the person giving the gift
 * @param {string} receiverName - The name of the person receiving the gift
 * @returns {string} The full URL to the reveal page
 */
export function generateRevealUrl(giverName, receiverName) {
  const encoded = encodeAssignment(giverName, receiverName)
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}#/reveal/${encoded}`
}
