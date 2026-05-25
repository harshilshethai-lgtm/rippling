import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELDS_BY_KEY } from './fieldSchema'
import { TEMPLATES } from './templates'
import { parseScenarioPrompt } from './scenarioParser'

/**
 * Clickable example prompts shown in the Ask AI panel. Each has a short
 * display label and the full prompt text that gets parsed on click.
 * These are chosen to produce non-empty suggestions from parseScenarioPrompt.
 */
const EXAMPLE_PROMPTS = [
  { label: 'Run a reorg', prompt: 'Run a reorg — rewire managers, departments, and levels' },
  { label: 'Relocate people', prompt: 'Relocate our CA remote workers to Austin, TX' },
  { label: 'Promotion cycle', prompt: 'Promotion cycle — update title, level, and base comp' },
  { label: 'Merit cycle raises', prompt: 'Annual merit cycle raises with per-person amounts' },
  { label: 'Onboard new hires', prompt: 'Onboard 40 new hires starting next Monday' },
  { label: 'Offboard / RIF', prompt: 'Lock devices and revoke access for offboarded employees' },
  { label: 'Open enrollment', prompt: 'Open enrollment — update medical plan and dependents' },
  { label: 'Acquisition close', prompt: 'Acquisition close — move 200 employees to a new legal entity' },
]

/**
 * "Ask AI" affordance for the Define change set page.
 *
 * Opens a popover that leads with clickable example prompts so the user
 * sees real suggestions before having to type anything. Clicking an example
 * pre-fills the textarea and immediately shows a parsed "Suggested" preview.
 * Typing a custom description works the same way.
 */
export default function AskAiButton({
  alreadySelectedKeys = [],
  onApplyTemplate,
  onAddFields,
  anchorMode = 'left',
  popoverAnchorRef,
}) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
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
  const [focused, setFocused] = useState(false)
  const containerRef = useRef(null)
  const popoverRef = useRef(null)
  const textareaRef = useRef(null)

  // Parse prompt with debounce
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setParsed(parseScenarioPrompt(prompt, { excludeKeys: alreadySelectedKeys }))
      setDroppedKeys(new Set())
    }, 180)
    return () => window.clearTimeout(handle)
  }, [prompt, alreadySelectedKeys])

  // Close on outside click / ESC
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

  // Reset prompt on close
  useEffect(() => {
    if (!open) {
      setPrompt('')
      setDroppedKeys(new Set())
      setFocused(false)
    }
  }, [open])

  const visibleSuggestionKeys = useMemo(
    () => parsed.fieldKeys.filter((k) => !droppedKeys.has(k)),
    [parsed.fieldKeys, droppedKeys],
  )

  const hasSuggestion = !!prompt.trim() && visibleSuggestionKeys.length > 0
  const showNoMatch =
    !!prompt.trim() && visibleSuggestionKeys.length === 0 && parsed.unhandled.length > 0

  function pickExample(examplePrompt) {
    setPrompt(examplePrompt)
    // Focus textarea so user can refine
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function dropSuggestion(fieldKey) {
    setDroppedKeys((prev) => {
      const next = new Set(prev)
      next.add(fieldKey)
      return next
    })
  }

  function applySuggestion() {
    if (visibleSuggestionKeys.length === 0) return
    const template = parsed.templateId
      ? TEMPLATES.find((t) => t.id === parsed.templateId) ?? null
      : null

    if (template) {
      const survivingTemplateKeys = template.fieldKeys.filter((k) =>
        visibleSuggestionKeys.includes(k),
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
      const extras = visibleSuggestionKeys.filter((k) => !template.fieldKeys.includes(k))
      if (extras.length > 0) onAddFields?.(extras)
    } else {
      onAddFields?.(visibleSuggestionKeys)
    }

    setPrompt('')
    setDroppedKeys(new Set())
    setOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      applySuggestion()
    }
  }

  const sharedAnchorEl =
    anchorMode === 'center' && popoverAnchorRef?.current ? popoverAnchorRef.current : null
  const positionClass = sharedAnchorEl
    ? 'left-1/2 -translate-x-1/2'
    : anchorMode === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'right-0'

  const popover = open ? (
    <div
      ref={popoverRef}
      className={classNames(
        'absolute z-30 top-full mt-1.5 w-[520px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom overflow-hidden',
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
        </div>
        <p className="text-[12px] text-rippling-muted">
          Describe what you want to change, or pick an example below.
        </p>
      </div>

      {/* Example prompts grid */}
      <div className="px-4 py-3 border-b border-rippling-line-2">
        <p className="text-[11px] font-medium text-rippling-muted uppercase tracking-wide mb-2">
          Examples
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => pickExample(ex.prompt)}
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
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={3}
            placeholder="Or describe in your own words…"
            aria-label="Describe the bulk change you want to make"
            className="w-full resize-none bg-transparent rounded-lg focus:outline-none text-rippling-ink min-h-[72px] px-3 py-2.5 text-[13px] placeholder:text-rippling-muted"
          />
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-rippling-muted">
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
          {hasSuggestion && (
            <button
              type="button"
              onClick={applySuggestion}
              className="ml-auto h-7 px-3 rounded-md text-[12px] font-medium bg-rippling-plum text-white hover:bg-rippling-plum-hover transition-colors"
            >
              Apply {visibleSuggestionKeys.length}{' '}
              {visibleSuggestionKeys.length === 1 ? 'property' : 'properties'}
            </button>
          )}
        </div>

        {/* Suggestion preview */}
        {hasSuggestion && (
          <div className="mt-3 rounded-lg border border-rippling-plum/20 bg-rippling-chip/40 px-3 py-2.5 anim-slide-in-bottom">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} strokeWidth={1.9} className="text-rippling-primary" />
              <span className="text-[12px] font-medium text-rippling-ink">Suggested</span>
              {parsed.templateLabel && (
                <>
                  <span className="text-rippling-muted">·</span>
                  <span className="text-[12px] text-rippling-ink-2">{parsed.templateLabel}</span>
                </>
              )}
              <span className="ml-auto text-[10.5px] text-rippling-muted">Tap × to remove</span>
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
                      aria-label={`Remove ${meta.label}`}
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
          <div className="mt-3 rounded-md border border-dashed border-rippling-line px-3 py-2 text-[12px] text-rippling-muted">
            {parsed.unhandled[0]}
          </div>
        )}
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
            : 'border-rippling-line text-rippling-ink-2 hover:bg-rippling-surface-2',
        )}
      >
        <Sparkles size={13} strokeWidth={1.9} className="text-rippling-primary" />
        <span>Ask AI</span>
      </button>

      {sharedAnchorEl ? createPortal(popover, sharedAnchorEl) : popover}
    </div>
  )
}
