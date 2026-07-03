/**
 * Formats milliseconds into HH:MM:SS or MM:SS string
 * @param {number} ms Milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`
  }
  return `${minutes}:${paddedSeconds}`
}
