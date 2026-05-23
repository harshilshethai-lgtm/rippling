import { useEffect } from 'react'

type KeyboardActions = {
  onOpenCommandPalette: () => void
  onFocusSearch: () => void
  onOpenFilters: () => void
  onSelectAllVisible: () => void
  onToggleHovered: () => void
  onHoverNext: () => void
  onHoverPrevious: () => void
  onClearSelection: () => void
  onToggleCheatsheet: () => void
}

function isTypingTarget(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'
}

export function useKeyboardShortcuts(actions: KeyboardActions) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const metaOrCtrl = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      const typing = isTypingTarget(event.target)

      if (metaOrCtrl && key === 'k') {
        event.preventDefault()
        actions.onOpenCommandPalette()
        return
      }

      if (event.key === '?' && !metaOrCtrl) {
        event.preventDefault()
        actions.onToggleCheatsheet()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        actions.onClearSelection()
        return
      }

      if (typing) return

      if (event.key === '/') {
        event.preventDefault()
        actions.onFocusSearch()
      } else if (key === 'f') {
        event.preventDefault()
        actions.onOpenFilters()
      } else if (metaOrCtrl && key === 'a') {
        event.preventDefault()
        actions.onSelectAllVisible()
      } else if (key === 'x') {
        event.preventDefault()
        actions.onToggleHovered()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        actions.onHoverNext()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        actions.onHoverPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actions])
}
