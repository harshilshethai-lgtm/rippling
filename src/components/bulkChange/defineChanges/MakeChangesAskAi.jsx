import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, AtSign, Info, Sparkles, X } from 'lucide-react'
import { avatarClass, classNames, initials } from '../../../lib/utils'
import { applyFilters, FILTER_SCHEMA, mentionableMatches } from '../bulkChangeUtils'
import { parseChangePrompt, CHANGE_SUGGESTIONS } from './changeParser'

/**
 * "Ask AI" affordance for the Make Changes step.
 *
 * Parses prompts that combine a *scope* (which subset of the finalized
 * worklist to affect) with one or more *changes* (field + new value), then
 * lets the user pick whether to apply them per-row (Unique mode) or as a
 * single bulk value (Uniform mode), and emits the parsed payload through
 * `onApply`.
 *
 * The owner (MakeChangesStep) is responsible for translating the payload
 * into calls on the existing `onAddFields` / `onChangeBulkValue` /
 * `onChangeCell` / `onToggleUniform` handlers.
 */
export default function MakeChangesAskAi({
  parserContext,
  /** The finalized worklist (an array of employee objects from EMPLOYEES). */
  selectedEmployees = [],
  onApply,
  anchorMode = 'left',
  popoverAnchorRef,
}) {
  const totalCount = selectedEmployees.length
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [focused, setFocused] = useState(false)
  const [droppedFieldKeys, setDroppedFieldKeys] = useState(() => new Set())
  const [droppedScopeKeys, setDroppedScopeKeys] = useState(() => new Set())
  const [parsed, setParsed] = useState({
    scopeChips: [],
    changes: [],
    unhandled: [],
    summary: '',
  })
  const [applyMode, setApplyMode] = useState(null) // null = auto

  // @-mention state for the textarea
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionHighlight, setMentionHighlight] = useState(0)

  const containerRef = useRef(null)
  const popoverRef = useRef(null)
  const textareaRef = useRef(null)

  const employees = parserContext?.employees || []

  // ── Debounced parse ────────────────────────────────────────────────────
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setParsed(parseChangePrompt(prompt, parserContext || {}))
      setDroppedFieldKeys(new Set())
      setDroppedScopeKeys(new Set())
      setApplyMode(null)
    }, 180)
    return () => window.clearTimeout(handle)
  }, [prompt, parserContext])

  // ── Close on outside click / Escape ────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function onMouseDown(event) {
      if (containerRef.current?.contains(event.target)) return
      if (popoverRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setPrompt('')
      setDroppedFieldKeys(new Set())
      setDroppedScopeKeys(new Set())
      setFocused(false)
      setMentionOpen(false)
      setMentionStart(-1)
      setApplyMode(null)
    }
  }, [open])

  useEffect(() => {
    setMentionHighlight(0)
  }, [mentionQuery, mentionOpen])

  const mentionMatches = useMemo(
    () => (mentionOpen ? mentionableMatches(employees, mentionQuery, new Set(), 8) : []),
    [employees, mentionQuery, mentionOpen],
  )

  const visibleChanges = useMemo(
    () => parsed.changes.filter((c) => !droppedFieldKeys.has(c.fieldKey)),
    [parsed.changes, droppedFieldKeys],
  )

  const visibleScopeChips = useMemo(
    () => parsed.scopeChips.filter((c) => !droppedScopeKeys.has(c.attribute)),
    [parsed.scopeChips, droppedScopeKeys],
  )

  // ── In-scope coverage for the live worklist. ───────────────────────────
  // Re-run applyFilters against the worklist whenever the visible scope
  // chips change so the preview count updates live as the user drops chips.
  const hasScope = visibleScopeChips.length > 0
  const effectiveInScope = useMemo(() => {
    if (!hasScope) return totalCount
    return applyFilters(selectedEmployees, visibleScopeChips).length
  }, [hasScope, visibleScopeChips, selectedEmployees, totalCount])
  const isFullCoverage = !hasScope || effectiveInScope === totalCount

  // ── Default mode: Uniform when full coverage, Unique otherwise. ────────
  const effectiveMode =
    applyMode ?? (isFullCoverage ? 'uniform' : 'unique')

  const canApply = visibleChanges.length > 0

  // ── @-mention autocomplete plumbing for the textarea ───────────────────
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

  function pickExample(examplePrompt) {
    setPrompt(examplePrompt)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function dropChange(fieldKey) {
    setDroppedFieldKeys((prev) => {
      const next = new Set(prev)
      next.add(fieldKey)
      return next
    })
  }

  function dropScopeChip(attribute) {
    setDroppedScopeKeys((prev) => {
      const next = new Set(prev)
      next.add(attribute)
      return next
    })
  }

  function applySuggestion() {
    if (!canApply) return
    onApply?.({
      scopeChips: visibleScopeChips,
      changes: visibleChanges,
      applyMode: effectiveMode,
    })
    setOpen(false)
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
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      applySuggestion()
    }
  }

  // ── Popover positioning ────────────────────────────────────────────────
  const sharedAnchorEl =
    anchorMode === 'center' && popoverAnchorRef?.current ? popoverAnchorRef.current : null
  const positionClass = sharedAnchorEl
    ? 'left-1/2 -translate-x-1/2'
    : anchorMode === 'right'
      ? 'right-0'
      : 'left-0'

  const popover = open ? (
    <div
      ref={popoverRef}
      className={classNames(
        'absolute z-30 top-full mt-1.5 w-[540px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom overflow-hidden',
        positionClass,
      )}
      style={{
        background: 'linear-gradient(160deg, rgb(247 244 250 / 0.6) 0%, #ffffff 40%)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-rippling-line-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Sparkles size={14} strokeWidth={1.9} className="text-rippling-primary" />
          <span className="text-[13.5px] font-semibold text-rippling-ink">Ask AI</span>
          <span className="text-[11.5px] text-rippling-muted">
            · scoped to {totalCount} {totalCount === 1 ? 'employee' : 'employees'} in your worklist
          </span>
        </div>
        <p className="text-[12px] text-rippling-muted">
          Describe a bulk change, or pick an example. Use{' '}
          <span className="font-medium text-rippling-ink-2">@</span> to reference a person.
        </p>
      </div>

      {/* Example chips */}
      <div className="px-4 py-3 border-b border-rippling-line-2">
        <p className="text-[11px] font-medium text-rippling-muted uppercase tracking-wide mb-2">
          Examples
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {CHANGE_SUGGESTIONS.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => pickExample(ex.prompt)}
              title={ex.prompt}
              className={classNames(
                'text-left px-2.5 py-1.5 rounded-lg border text-[12px] transition-colors',
                prompt === ex.prompt
                  ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-plum'
                  : 'border-rippling-line bg-white text-rippling-ink-2 hover:border-rippling-plum/30 hover:bg-rippling-chip/30',
              )}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="p-4">
        <div
          className={classNames(
            'relative rounded-lg border bg-white transition-colors',
            focused
              ? 'border-rippling-primary/60 shadow-[0_0_0_3px_rgb(124_58_237/0.08)]'
              : 'border-rippling-line',
          )}
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={3}
            placeholder='e.g. "Move all Austin employees to San Francisco"'
            aria-label="Describe the change you want to make"
            className="w-full resize-none bg-transparent rounded-lg focus:outline-none text-rippling-ink min-h-[72px] px-3 py-2.5 text-[13px] placeholder:text-rippling-muted"
          />

          {mentionOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom">
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

        {/* Preview */}
        {(visibleScopeChips.length > 0 || visibleChanges.length > 0) && (
          <div className="mt-3 space-y-3 anim-slide-in-bottom">
            {/* Scope row */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10.5px] uppercase tracking-wide font-semibold text-rippling-muted">
                  Scope
                </span>
                <span className="text-[11.5px] text-rippling-ink-2 tabular-nums">
                  {hasScope
                    ? `${effectiveInScope} of ${totalCount} in worklist`
                    : `All ${totalCount} in worklist`}
                </span>
              </div>
              {hasScope ? (
                <div className="flex flex-wrap gap-1.5">
                  {visibleScopeChips.map((chip) => {
                    const Icon = FILTER_SCHEMA[chip.attribute]?.icon
                    const valueLabel =
                      chip.kind === 'date_range'
                        ? chip.range?.label || ''
                        : (chip.values || []).join(', ')
                    return (
                      <span
                        key={chip.attribute}
                        className="inline-flex items-center h-7 rounded-full bg-rippling-chip text-rippling-plum text-[12px] overflow-hidden"
                      >
                        <span className="flex items-center gap-1.5 h-full px-2">
                          {Icon && <Icon size={11} strokeWidth={1.75} />}
                          <span className="text-rippling-plum/70">{chip.attribute}</span>
                          <span className="text-rippling-plum/70">is</span>
                          <span className="font-medium truncate max-w-[180px]">{valueLabel}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => dropScopeChip(chip.attribute)}
                          className="h-full px-1.5 ui-interactive flex items-center justify-center text-rippling-plum/70 hover:text-rippling-plum border-l border-white/40"
                          aria-label={`Drop ${chip.attribute} scope`}
                        >
                          <X size={11} strokeWidth={2} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[11.5px] text-rippling-muted italic">
                  No scope filter — change applies to everyone in the worklist.
                </p>
              )}
            </div>

            {/* Changes row */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10.5px] uppercase tracking-wide font-semibold text-rippling-muted">
                  Changes
                </span>
              </div>
              {visibleChanges.length === 0 ? (
                <div className="rounded-md border border-dashed border-rippling-line px-3 py-2 text-[12px] text-rippling-muted">
                  No changes detected.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {visibleChanges.map((change) => {
                    const Icon = change.field?.sectionIcon
                    const label = change.field?.label || change.fieldKey
                    return (
                      <div
                        key={change.fieldKey}
                        className="flex items-center gap-2 h-9 px-2.5 rounded-md border border-rippling-line bg-white text-[12.5px]"
                      >
                        {Icon && (
                          <Icon size={12} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
                        )}
                        <span className="text-rippling-ink-2 shrink-0">{label}</span>
                        <ArrowRight
                          size={11}
                          strokeWidth={1.75}
                          className="text-rippling-muted shrink-0"
                          aria-hidden
                        />
                        <span className="text-rippling-plum font-medium truncate flex-1">
                          {change.displayValue}
                        </span>
                        <button
                          type="button"
                          onClick={() => dropChange(change.fieldKey)}
                          className="h-6 w-6 rounded ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink shrink-0"
                          aria-label={`Drop ${label} change`}
                        >
                          <X size={11} strokeWidth={2} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Apply-mode toggle */}
            {visibleChanges.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10.5px] uppercase tracking-wide font-semibold text-rippling-muted">
                    How to apply
                  </span>
                </div>
                <div className="inline-flex rounded-md border border-rippling-line p-0.5 bg-rippling-surface">
                  <ModeButton
                    active={effectiveMode === 'unique'}
                    onClick={() => setApplyMode('unique')}
                    label="In-scope only"
                    sub="Unique"
                  />
                  <ModeButton
                    active={effectiveMode === 'uniform'}
                    onClick={() => setApplyMode('uniform')}
                    label="All selected"
                    sub="Uniform"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-rippling-muted leading-snug">
                  {effectiveMode === 'unique'
                    ? `Per-row override for the ${effectiveInScope} in-scope ${
                        effectiveInScope === 1 ? 'employee' : 'employees'
                      }. Out-of-scope rows keep their current value.`
                    : `One value applied to all ${totalCount} selected ${
                        totalCount === 1 ? 'employee' : 'employees'
                      } (Uniform mode).`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Unhandled */}
        {parsed.unhandled.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
            <Info size={12} strokeWidth={1.75} className="text-amber-600 mt-0.5 shrink-0" />
            <ul className="text-[11.5px] text-amber-900 leading-snug space-y-1">
              {parsed.unhandled.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply row */}
        <div className="flex items-center justify-between gap-2 mt-3 text-[11px] text-rippling-muted">
          <span className="hidden sm:inline-flex items-center gap-1">
            <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10px] text-rippling-ink-2">
              ⌘
            </kbd>
            <span>+</span>
            <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10px] text-rippling-ink-2">
              ↵
            </kbd>
            <span>apply</span>
          </span>
          <button
            type="button"
            onClick={applySuggestion}
            disabled={!canApply}
            className={classNames(
              'ml-auto h-7 px-3 rounded-md text-[12px] font-medium transition-colors',
              canApply
                ? 'bg-rippling-plum text-white hover:bg-rippling-plum-hover'
                : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed',
            )}
          >
            {canApply
              ? `Apply ${visibleChanges.length} ${
                  visibleChanges.length === 1 ? 'change' : 'changes'
                }`
              : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={classNames(
          'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[12.5px] font-medium transition-colors',
          open
            ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-plum'
            : 'border-purple-300 bg-purple-50 text-rippling-plum hover:bg-purple-100 hover:border-rippling-plum/50',
        )}
      >
        <Sparkles size={13} strokeWidth={1.9} className="text-rippling-primary" />
        <span>Ask AI</span>
      </button>

      {sharedAnchorEl ? createPortal(popover, sharedAnchorEl) : popover}
    </div>
  )
}

function ModeButton({ active, onClick, label, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'flex items-baseline gap-1.5 h-7 px-2.5 rounded text-[12px] font-medium transition-colors',
        active
          ? 'bg-white text-rippling-ink shadow-sm border border-rippling-line'
          : 'text-rippling-muted hover:text-rippling-ink-2',
      )}
    >
      <span>{label}</span>
      <span className="text-[10px] uppercase tracking-wide text-rippling-muted">{sub}</span>
    </button>
  )
}
