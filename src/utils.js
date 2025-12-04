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
 * Creates a derangement (permutation where no element appears in its original position)
 * This ensures no one is assigned to themselves
 * @param {string[]} names - Array of participant names
 * @returns {Map<string, string>} Map from giver to receiver
 */
export function createDerangement(names) {
  if (names.length < 2) {
    throw new Error('Need at least 2 participants')
  }

  // Use Fisher-Yates shuffle to create a random derangement
  // We'll keep shuffling until we get a valid derangement
  let shuffled
  let isValid = false
  let attempts = 0
  const maxAttempts = 1000

  while (!isValid && attempts < maxAttempts) {
    shuffled = [...names]

    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Check if it's a valid derangement (no one in original position)
    isValid = names.every((name, index) => name !== shuffled[index])
    attempts++
  }

  if (!isValid) {
    // Fallback: create a simple rotation (always a valid derangement for n >= 2)
    shuffled = [...names.slice(1), names[0]]
  }

  // Create the mapping
  const assignments = new Map()
  names.forEach((name, index) => {
    assignments.set(name, shuffled[index])
  })

  return assignments
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
