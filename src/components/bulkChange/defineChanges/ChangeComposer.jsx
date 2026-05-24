import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AtSign, Slash, Sparkles, X } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELD_SECTIONS, FIELDS_BY_KEY } from './fieldSchema'
import { TEMPLATES } from './templates'
import { parseScenarioPrompt, SCENARIO_SUGGESTIONS } from './scenarioParser'
import TemplateCard from './TemplateCard'

/**
 * Unified, AI-first composer for the Define Changes step.
 *
 * One input handles three lanes:
 *   • Free text  → debounced scenario parser produces a "suggested template
 *                  + fields" preview card. Each field has its own × so the
 *                  user can trim before applying ("22 fields → 5" flow).
 *   • "/"        → slash menu of the ~10 playbooks, filterable.
 *   • "@"        → flat searchable field index grouped by section. Picking
 *                  a field inserts a chip and removes the "@…" token from
 *                  the textarea so the prompt stays clean.
 *
 * Two visual variants:
 *   • variant="empty"   — large hero used when no chips exist. Renders the
 *                         template gallery underneath the textarea.
 *   • variant="compact" — single-row mode used once chips are on screen.
 *                         Still accepts /, @, and natural language.
 *
 * The composer never mutates parent state on its own; it calls:
 *   • onApplyTemplate(template)        — / picked, or preview Apply pressed
 *                                         with a template suggestion.
 *   • onAddFields(fieldKeys, defaults) — @ picked, or preview Apply with
 *                                         just extra fields (no template).
 */
export default function ChangeComposer({
  variant = 'compact',
  alreadySelectedKeys = [],
  onApplyTemplate,
  onAddFields,
}) {
  const [prompt, setPrompt] = useState('')
  const [focused, setFocused] = useState(false)
  const [parsed, setParsed] = useState({
    templateId: null,
    templateLabel: null,
    fieldKeys: [],
    extraFieldKeys: [],
    droppedKeys: [],
    summary: '',
    unhandled: [],
  })
  const [droppedKeys, setDroppedKeys] = useState(() => new Set())
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  // / and @ mention state — at most one popover open at a time
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashStart, setSlashStart] = useState(-1)
  const [slashHighlight, setSlashHighlight] = useState(0)

  const [atOpen, setAtOpen] = useState(false)
  const [atQuery, setAtQuery] = useState('')
  const [atStart, setAtStart] = useState(-1)
  const [atHighlight, setAtHighlight] = useState(0)

  const textareaRef = useRef(null)
  const containerRef = useRef(null)

  const isExpanded = variant === 'empty'
  const showAnimatedPlaceholder = !prompt.trim() && !focused
  const currentSuggestion = SCENARIO_SUGGESTIONS[suggestionIndex]
  const alreadySelectedSet = useMemo(
    () => new Set(alreadySelectedKeys),
    [alreadySelectedKeys],
  )

  // Rotate placeholder when idle (animation reused from AskAiPopover).
  useEffect(() => {
    if (!showAnimatedPlaceholder) return
    const id = window.setInterval(() => {
      setSuggestionIndex((i) => (i + 1) % SCENARIO_SUGGESTIONS.length)
    }, 4000)
    return () => window.clearInterval(id)
  }, [showAnimatedPlaceholder])

  // Reset highlight when query changes.
  useEffect(() => {
    setSlashHighlight(0)
  }, [slashQuery])
  useEffect(() => {
    setAtHighlight(0)
  }, [atQuery])

  // Debounced re-parse so typing feels live without lagging.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setParsed(parseScenarioPrompt(prompt, { excludeKeys: alreadySelectedKeys }))
      setDroppedKeys(new Set())
    }, 180)
    return () => window.clearTimeout(handle)
  }, [prompt, alreadySelectedKeys])

  // Close popovers when clicking outside the whole composer.
  useEffect(() => {
    if (!slashOpen && !atOpen) return
    function onMouseDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setSlashOpen(false)
        setAtOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [slashOpen, atOpen])

  // Filtered / sorted lists for the popovers
  const filteredTemplates = useMemo(() => {
    const q = slashQuery.trim().toLowerCase()
    if (!q) return TEMPLATES
    return TEMPLATES.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    )
  }, [slashQuery])

  const flatFields = useMemo(() => {
    const list = []
    for (const section of FIELD_SECTIONS) {
      for (const field of section.fields) {
        list.push({
          key: field.key,
          label: field.label,
          sectionLabel: section.label,
          sectionIcon: section.icon,
        })
      }
    }
    return list
  }, [])

  const filteredFields = useMemo(() => {
    const q = atQuery.trim().toLowerCase()
    const base = q
      ? flatFields.filter(
          (f) =>
            f.label.toLowerCase().includes(q) ||
            f.sectionLabel.toLowerCase().includes(q),
        )
      : flatFields
    // Drop fields already on screen.
    return base.filter((f) => !alreadySelectedSet.has(f.key))
  }, [atQuery, flatFields, alreadySelectedSet])

  const visibleSuggestionKeys = useMemo(
    () => parsed.fieldKeys.filter((k) => !droppedKeys.has(k)),
    [parsed.fieldKeys, droppedKeys],
  )

  // ── Caret sync helpers ───────────────────────────────────────────────────

  const syncTriggers = useCallback((next, caret) => {
    const before = next.slice(0, caret)

    // "/" trigger — must be at start of input or after whitespace
    const slashIdx = before.lastIndexOf('/')
    if (slashIdx !== -1) {
      const charBefore = slashIdx === 0 ? '' : before[slashIdx - 1]
      const valid = slashIdx === 0 || /\s/.test(charBefore)
      const fragment = before.slice(slashIdx + 1)
      if (valid && !/\s/.test(fragment)) {
        setSlashOpen(true)
        setSlashStart(slashIdx)
        setSlashQuery(fragment)
        setAtOpen(false)
        return
      }
    }

    // "@" trigger
    const atIdx = before.lastIndexOf('@')
    if (atIdx !== -1) {
      const charBefore = atIdx === 0 ? '' : before[atIdx - 1]
      const valid = atIdx === 0 || /\s/.test(charBefore)
      const fragment = before.slice(atIdx + 1)
      if (valid && !/\s/.test(fragment)) {
        setAtOpen(true)
        setAtStart(atIdx)
        setAtQuery(fragment)
        setSlashOpen(false)
        return
      }
    }

    setSlashOpen(false)
    setSlashStart(-1)
    setSlashQuery('')
    setAtOpen(false)
    setAtStart(-1)
    setAtQuery('')
  }, [])

  const handleChange = (event) => {
    const next = event.target.value
    const caret = event.target.selectionStart ?? next.length
    setPrompt(next)
    syncTriggers(next, caret)
  }

  const handleSelectionChange = (event) => {
    const target = event.target
    syncTriggers(target.value, target.selectionStart ?? target.value.length)
  }

  // ── Application handlers ─────────────────────────────────────────────────

  const clearPrompt = () => {
    setPrompt('')
    setDroppedKeys(new Set())
    setSlashOpen(false)
    setAtOpen(false)
  }

  const applyTemplate = (template) => {
    if (!template) return
    onApplyTemplate?.(template)
    clearPrompt()
    textareaRef.current?.focus()
  }

  const applyFieldFromAt = (fieldKey) => {
    if (!fieldKey) return
    onAddFields?.([fieldKey])
    // Remove the @... token from the textarea so the prompt stays clean.
    if (atStart >= 0) {
      const before = prompt.slice(0, atStart)
      const after = prompt.slice(atStart + 1 + atQuery.length)
      const next = `${before}${after}`.replace(/\s{2,}/g, ' ')
      setPrompt(next)
    }
    setAtOpen(false)
    setAtStart(-1)
    setAtQuery('')
    textareaRef.current?.focus()
  }

  const applySuggestion = () => {
    if (visibleSuggestionKeys.length === 0) return
    const template = parsed.templateId
      ? TEMPLATES.find((t) => t.id === parsed.templateId) ?? null
      : null

    if (template) {
      // Apply the template but only with the *surviving* keys, and only
      // template defaults that are still present after trimming.
      const survivingTemplateKeys = template.fieldKeys.filter(
        (k) => visibleSuggestionKeys.includes(k),
      )
      const trimmedDefaults = {}
      for (const [k, v] of Object.entries(template.defaults ?? {})) {
        if (survivingTemplateKeys.includes(k)) trimmedDefaults[k] = v
      }
      onApplyTemplate?.({
        ...template,
        fieldKeys: survivingTemplateKeys,
        defaults: trimmedDefaults,
      })

      // Apply any extras the user mentioned beyond the template separately.
      const extras = visibleSuggestionKeys.filter(
        (k) => !template.fieldKeys.includes(k),
      )
      if (extras.length > 0) onAddFields?.(extras)
    } else {
      onAddFields?.(visibleSuggestionKeys)
    }
    clearPrompt()
  }

  const dropSuggestion = (fieldKey) => {
    setDroppedKeys((prev) => {
      const next = new Set(prev)
      next.add(fieldKey)
      return next
    })
  }

  // ── Keyboard handling ────────────────────────────────────────────────────

  const handleKeyDown = (event) => {
    if (slashOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSlashHighlight((i) => Math.min(filteredTemplates.length - 1, i + 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSlashHighlight((i) => Math.max(0, i - 1))
        return
      }
      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        const chosen = filteredTemplates[slashHighlight]
        if (chosen) applyTemplate(chosen)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setSlashOpen(false)
        setSlashStart(-1)
        return
      }
    }

    if (atOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setAtHighlight((i) => Math.min(filteredFields.length - 1, i + 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setAtHighlight((i) => Math.max(0, i - 1))
        return
      }
      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        const chosen = filteredFields[atHighlight]
        if (chosen) applyFieldFromAt(chosen.key)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setAtOpen(false)
        setAtStart(-1)
        return
      }
    }

    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      applySuggestion()
    }
  }

  const hasSuggestion = !!prompt.trim() && visibleSuggestionKeys.length > 0
  const showNoMatch =
    !!prompt.trim() &&
    visibleSuggestionKeys.length === 0 &&
    !slashOpen &&
    !atOpen &&
    parsed.unhandled.length > 0

  return (
    <div ref={containerRef} className="relative">
      {/* ── Textarea ───────────────────────────────────────────────────── */}
      <div
        className={classNames(
          'relative rounded-xl border bg-white transition-colors',
          focused
            ? 'border-rippling-primary/60 shadow-rippling-card'
            : 'border-rippling-line',
        )}
      >
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelectionChange}
          onClick={handleSelectionChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={isExpanded ? 3 : 2}
          aria-label="Describe the change, press / for templates, @ for fields"
          className={classNames(
            'w-full resize-none bg-transparent rounded-xl focus:outline-none text-rippling-ink',
            isExpanded
              ? 'min-h-[88px] px-4 py-3 text-[14px]'
              : 'min-h-[44px] px-3 py-2.5 text-[13px]',
          )}
        />

        {showAnimatedPlaceholder && (
          <div
            aria-hidden
            className={classNames(
              'absolute inset-0 pointer-events-none overflow-hidden flex items-start',
              isExpanded ? 'px-4 py-3 text-[14px]' : 'px-3 py-2.5 text-[13px]',
            )}
          >
            <Sparkles
              size={isExpanded ? 14 : 13}
              strokeWidth={1.9}
              className="text-rippling-primary mr-2 mt-[3px] shrink-0"
            />
            <span className="text-rippling-muted shrink-0">Try:&nbsp;</span>
            <span
              key={suggestionIndex}
              className="text-rippling-muted truncate anim-search-word"
            >
              {currentSuggestion}
            </span>
          </div>
        )}

        {/* Footer hints inside the textarea container */}
        <div
          className={classNames(
            'flex items-center justify-between gap-2 px-3 pb-2 pt-1 text-[11px] text-rippling-muted',
            isExpanded ? '' : 'border-t border-rippling-line-2',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10px] text-rippling-ink-2">
                /
              </kbd>
              <span>templates</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10px] text-rippling-ink-2">
                @
              </kbd>
              <span>fields</span>
            </span>
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
          </div>
          {hasSuggestion && (
            <button
              type="button"
              onClick={applySuggestion}
              className="h-6 px-2 rounded-md text-[11.5px] font-medium bg-rippling-plum text-white hover:bg-rippling-plum-hover transition-colors"
            >
              Apply {visibleSuggestionKeys.length}{' '}
              {visibleSuggestionKeys.length === 1 ? 'field' : 'fields'}
            </button>
          )}
        </div>
      </div>

      {/* ── Suggestion preview ───────────────────────────────────────── */}
      {hasSuggestion && !slashOpen && !atOpen && (
        <div className="mt-2 rounded-xl border border-rippling-plum/20 bg-rippling-chip/40 px-3 py-2.5 anim-slide-in-bottom">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles
              size={12}
              strokeWidth={1.9}
              className="text-rippling-primary"
            />
            <span className="text-[11.5px] uppercase tracking-wide text-rippling-muted font-semibold">
              Suggested
            </span>
            {parsed.templateLabel && (
              <>
                <span className="text-rippling-muted">·</span>
                <span className="text-[12px] font-medium text-rippling-ink">
                  {parsed.templateLabel}
                </span>
              </>
            )}
            <span className="ml-auto text-[11px] text-rippling-muted">
              Tap × on a field to drop it
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {visibleSuggestionKeys.map((key) => {
              const meta = FIELDS_BY_KEY.get(key)
              if (!meta) return null
              const Icon = meta.sectionIcon
              return (
                <span
                  key={key}
                  className="inline-flex items-center h-7 rounded-full bg-white border border-rippling-line text-[12px] overflow-hidden"
                >
                  <span className="flex items-center gap-1.5 px-2 h-full">
                    {Icon && (
                      <Icon
                        size={11}
                        strokeWidth={1.75}
                        className="text-rippling-muted"
                      />
                    )}
                    <span className="text-rippling-ink-2 truncate max-w-[160px]">
                      {meta.label}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => dropSuggestion(key)}
                    className="h-full px-1.5 ui-interactive flex items-center justify-center border-l border-rippling-line-2 text-rippling-muted hover:text-rippling-ink"
                    aria-label={`Drop ${meta.label}`}
                  >
                    <X size={11} strokeWidth={2} />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {showNoMatch && (
        <div className="mt-2 rounded-md border border-dashed border-rippling-line px-3 py-2 text-[12px] text-rippling-muted">
          {parsed.unhandled[0]}
        </div>
      )}

      {/* ── Slash menu ────────────────────────────────────────────────── */}
      {slashOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom overflow-hidden">
          <div className="px-3 py-1.5 border-b border-rippling-line-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-rippling-muted font-semibold">
            <Slash size={11} strokeWidth={2} /> Templates
            {slashQuery && (
              <span className="ml-auto normal-case tracking-normal text-rippling-muted/80">
                matching "{slashQuery}"
              </span>
            )}
          </div>
          <div className="py-1 max-h-[340px] overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-rippling-muted">
                No templates match.
              </div>
            ) : (
              filteredTemplates.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  size="sm"
                  highlighted={index === slashHighlight}
                  onSelect={applyTemplate}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── @ field picker ────────────────────────────────────────────── */}
      {atOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom overflow-hidden">
          <div className="px-3 py-1.5 border-b border-rippling-line-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-rippling-muted font-semibold">
            <AtSign size={11} strokeWidth={2} /> Add a field
            {atQuery && (
              <span className="ml-auto normal-case tracking-normal text-rippling-muted/80">
                matching "{atQuery}"
              </span>
            )}
          </div>
          <div className="py-1 max-h-[340px] overflow-y-auto">
            {filteredFields.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-rippling-muted">
                No fields match.
              </div>
            ) : (
              filteredFields.map((field, index) => {
                const Icon = field.sectionIcon
                const highlighted = index === atHighlight
                return (
                  <button
                    key={field.key}
                    type="button"
                    onMouseEnter={() => setAtHighlight(index)}
                    onClick={() => applyFieldFromAt(field.key)}
                    className={classNames(
                      'w-full px-2.5 py-1.5 flex items-center gap-2.5 text-left rounded-md transition-colors',
                      highlighted
                        ? 'bg-rippling-surface-2'
                        : 'bg-transparent hover:bg-rippling-surface-2',
                    )}
                  >
                    <span className="h-6 w-6 rounded-md bg-rippling-chip text-rippling-plum flex items-center justify-center shrink-0">
                      {Icon && <Icon size={12} strokeWidth={1.85} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-rippling-ink truncate">
                        {field.label}
                      </span>
                      <span className="block text-[10.5px] text-rippling-muted truncate">
                        {field.sectionLabel}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── Empty-state template gallery ──────────────────────────────── */}
      {isExpanded && !slashOpen && !atOpen && !hasSuggestion && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="text-[11px] uppercase tracking-wide text-rippling-muted font-semibold">
              Start from a playbook
            </span>
            <span className="text-[11px] text-rippling-muted">
              · pick one, then trim or add fields freely
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                size="lg"
                onSelect={applyTemplate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
