import { useEffect, useMemo, useRef, useState } from 'react'
import { AtSign, Info, Sparkles, X } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../lib/utils'
import { FILTER_SCHEMA, formatChipValueLabel, mentionableMatches } from './bulkChangeUtils'
import { AI_SUGGESTIONS, parseAiPrompt } from './aiParser'

/**
 * Linear-style "Ask AI" popover. Translates a natural-language prompt into
 * filter chips via the deterministic mock parser, shows a live preview, and
 * applies the surviving chips into the existing chip stack on confirm.
 *
 * Two affordances on top of the textarea:
 * - A rotating "Try: …" placeholder that advances every 4s when empty/blurred.
 * - An @ mention autocomplete (Maya → @Maya Pan) so manager references can be
 *   disambiguated when fuzzy first-name matching would over-match.
 */
export default function AskAiPopover({
  open,
  anchorMode = 'left',
  initialPrompt = '',
  parserContext,
  onClose,
  onApplyChips,
}) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [focused, setFocused] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [parsed, setParsed] = useState({ chips: [], unhandled: [], summary: '' })
  const [droppedKeys, setDroppedKeys] = useState(() => new Set())
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionHighlight, setMentionHighlight] = useState(0)
  const containerRef = useRef(null)
  const textareaRef = useRef(null)
  const mentionPopoverRef = useRef(null)

  const employees = parserContext?.employees || []
  const showAnimatedPlaceholder = !prompt.trim() && !focused
  const currentSuggestion = AI_SUGGESTIONS[suggestionIndex]

  const mentionMatches = useMemo(
    () => (mentionOpen ? mentionableMatches(employees, mentionQuery, new Set(), 8) : []),
    [employees, mentionQuery, mentionOpen],
  )

  useEffect(() => {
    if (!open) return
    setPrompt(initialPrompt || '')
    setDroppedKeys(new Set())
    setMentionOpen(false)
    setMentionStart(-1)
    setMentionQuery('')
    setFocused(false)
    const id = window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
      const len = textareaRef.current?.value?.length ?? 0
      try {
        textareaRef.current?.setSelectionRange(len, len)
      } catch {
        /* ignore */
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [open, initialPrompt])

  useEffect(() => {
    if (!showAnimatedPlaceholder) return
    const id = window.setInterval(() => {
      setSuggestionIndex((i) => (i + 1) % AI_SUGGESTIONS.length)
    }, 4000)
    return () => window.clearInterval(id)
  }, [showAnimatedPlaceholder])

  useEffect(() => {
    setMentionHighlight(0)
  }, [mentionQuery, mentionOpen])

  // Debounced re-parse so typing feels live without re-running on every keystroke.
  useEffect(() => {
    if (!open) return
    const handle = window.setTimeout(() => {
      setParsed(parseAiPrompt(prompt, parserContext || {}))
    }, 150)
    return () => window.clearTimeout(handle)
  }, [open, prompt, parserContext])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  const visibleChips = useMemo(
    () => parsed.chips.filter((chip) => !droppedKeys.has(chip.attribute)),
    [parsed.chips, droppedKeys],
  )

  function syncMentionState(next, caret) {
    const before = next.slice(0, caret)
    const at = before.lastIndexOf('@')
    if (at === -1) {
      setMentionOpen(false)
      setMentionStart(-1)
      return
    }
    const charBefore = at === 0 ? '' : before[at - 1]
    const validBoundary = at === 0 || /\s/.test(charBefore)
    const fragment = before.slice(at + 1)
    if (!validBoundary || /\s/.test(fragment)) {
      setMentionOpen(false)
      setMentionStart(-1)
      return
    }
    setMentionStart(at)
    setMentionQuery(fragment)
    setMentionOpen(true)
  }

  function handleChange(event) {
    const next = event.target.value
    const caret = event.target.selectionStart ?? next.length
    setPrompt(next)
    syncMentionState(next, caret)
  }

  function commitMention(employee) {
    if (!employee || mentionStart < 0) return
    const before = prompt.slice(0, mentionStart)
    const after = prompt.slice(mentionStart + 1 + mentionQuery.length)
    const next = `${before}@${employee.fullName}${after}`.replace(/\s{2,}/g, ' ')
    setPrompt(next)
    setMentionOpen(false)
    setMentionStart(-1)
    setMentionQuery('')
    textareaRef.current?.focus()
  }

  function dropChip(attribute) {
    setDroppedKeys((prev) => {
      const next = new Set(prev)
      next.add(attribute)
      return next
    })
  }

  function handleApply() {
    if (visibleChips.length === 0) return
    onApplyChips?.(visibleChips)
  }

  function handleKeyDown(event) {
    if (mentionOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setMentionHighlight((idx) => Math.min(mentionMatches.length - 1, idx + 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setMentionHighlight((idx) => Math.max(0, idx - 1))
        return
      }
      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        const candidate = mentionMatches[mentionHighlight]
        if (candidate) commitMention(candidate)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMentionOpen(false)
        setMentionStart(-1)
        return
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose?.()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleApply()
    }
  }

  if (!open) return null

  const positionClass = anchorMode === 'right' ? 'right-0 top-full mt-2' : 'left-0 top-full mt-2'

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={classNames(
        'absolute z-30 w-[460px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom',
        positionClass,
      )}
    >
      <div className="px-3 pt-3 pb-2 border-b border-rippling-line-2 flex items-center gap-2">
        <span className="h-6 w-6 rounded-md bg-rippling-chip text-rippling-plum flex items-center justify-center">
          <Sparkles size={13} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-rippling-ink leading-tight">Ask AI</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-6 w-6 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink"
          aria-label="Close"
        >
          <X size={13} strokeWidth={1.75} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={2}
            placeholder=""
            aria-label={`Try: ${currentSuggestion}`}
            className="w-full min-h-[60px] max-h-[120px] rounded-md border border-rippling-line bg-white px-2.5 py-2 text-[13px] text-rippling-ink focus:outline-none focus:ring-1 focus:ring-rippling-primary focus:border-rippling-primary transition-colors resize-y"
          />
          {showAnimatedPlaceholder && (
            <div
              aria-hidden
              className="absolute inset-0 flex items-start px-2.5 py-2 text-[13px] pointer-events-none overflow-hidden"
            >
              <span className="shrink-0 text-rippling-muted">Try:&nbsp;</span>
              <span
                key={suggestionIndex}
                className="text-rippling-muted truncate anim-search-word"
              >
                {currentSuggestion}
              </span>
            </div>
          )}

          {mentionOpen && (
            <div
              ref={mentionPopoverRef}
              className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom"
            >
              <div className="px-3 py-2 border-b border-rippling-line-2 text-[11px] uppercase tracking-wide text-rippling-muted font-semibold flex items-center gap-1.5">
                <AtSign size={11} strokeWidth={2} /> Mention an employee
              </div>
              <div className="py-1 max-h-[200px] overflow-y-auto">
                {mentionMatches.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[12px] text-rippling-muted">
                    No employees match.
                  </div>
                ) : (
                  mentionMatches.map((employee, index) => (
                    <button
                      key={employee.id}
                      type="button"
                      onMouseEnter={() => setMentionHighlight(index)}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        commitMention(employee)
                      }}
                      className={classNames(
                        'w-full h-10 px-2.5 flex items-center gap-2.5 text-left rounded-md transition-colors',
                        mentionHighlight === index ? 'bg-rippling-surface-2' : 'bg-transparent',
                      )}
                    >
                      <div
                        className={classNames(
                          'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10.5px] font-semibold shrink-0',
                          avatarClass(employee.fullName),
                        )}
                      >
                        {initials(employee.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-rippling-ink truncate">{employee.fullName}</p>
                        <p className="text-[11.5px] text-rippling-muted truncate">{employee.title}</p>
                      </div>
                      <span className="text-[10.5px] text-rippling-muted">↵</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10.5px] uppercase tracking-wide text-rippling-muted font-semibold mb-1.5">
            Detected filters
          </p>
          {visibleChips.length === 0 ? (
            <div className="rounded-md border border-dashed border-rippling-line px-3 py-3 text-[12px] text-rippling-muted">
              {prompt.trim()
                ? 'No filters detected yet — try mentioning a department, city, @manager, title, or join date.'
                : 'Describe who you want and the parsed filters will show up here.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {visibleChips.map((chip) => {
                const Icon = FILTER_SCHEMA[chip.attribute]?.icon
                return (
                  <span
                    key={chip.attribute}
                    className="inline-flex items-center h-7 rounded-full bg-rippling-chip text-rippling-plum text-[12px] overflow-hidden"
                  >
                    <span className="flex items-center gap-1.5 h-full px-2">
                      {Icon && <Icon size={11} strokeWidth={1.75} />}
                      <span className="text-rippling-plum/70">{chip.attribute}</span>
                      <span className="text-rippling-plum/70">is</span>
                      <span className="font-medium truncate max-w-[180px]">
                        {formatChipValueLabel(chip)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => dropChip(chip.attribute)}
                      className="h-full px-1.5 ui-interactive flex items-center justify-center text-rippling-plum/70 hover:text-rippling-plum border-l border-white/40"
                      aria-label={`Drop ${chip.attribute} filter`}
                    >
                      <X size={11} strokeWidth={2} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {parsed.unhandled.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
            <Info size={13} strokeWidth={1.75} className="text-amber-600 mt-0.5 shrink-0" />
            <ul className="text-[11.5px] text-amber-900 leading-snug space-y-1">
              {parsed.unhandled.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-rippling-line-2 flex items-center justify-between">
        <span className="text-[11px] text-rippling-muted">
          <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10px] text-rippling-ink-2">
            Cmd
          </kbd>
          <span className="mx-0.5">+</span>
          <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10px] text-rippling-ink-2">
            Enter
          </kbd>
          <span className="ml-1">to apply</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="h-7 px-2.5 rounded-md text-[12px] text-rippling-muted ui-interactive"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={visibleChips.length === 0}
            className={classNames(
              'h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors',
              visibleChips.length === 0
                ? 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed'
                : 'bg-rippling-plum text-white hover:bg-rippling-plum-hover',
            )}
          >
            Apply{visibleChips.length > 0 ? ` (${visibleChips.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
