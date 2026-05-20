// Deterministic avatar gradient class from a name
const GRADIENTS = [
  'avatar-gradient-a',
  'avatar-gradient-b',
  'avatar-gradient-c',
  'avatar-gradient-d',
  'avatar-gradient-e',
  'avatar-gradient-f',
]

export function avatarClass(name) {
  if (!name) return GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function initials(name) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}
