import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, Plus, Search } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import TemplateCard from './TemplateCard'
import { TEMPLATES } from './templates'

/**
 * "Browse templates" affordance for the Define change set page.
 *
 * Accepts a `size` prop:
 *   "hero"    — larger button with shadow used in the empty-state hero
 *   "default" — standard compact button used in the populated action row
 *
 * The popover renders a two-column grid of TemplateCard (size="lg") cards so
 * the catalogue feels like a proper template browser rather than a dropdown
 * list. A search box filters across labels and descriptions.
 */
export default function BrowseTemplatesButton({
  onApplyTemplate,
  anchorMode = 'left',
  popoverAnchorRef,
  size = 'default',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef(null)
  const popoverRef = useRef(null)
  const searchRef = useRef(null)

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TEMPLATES
    return TEMPLATES.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    )
  }, [query])

  useEffect(() => {
    setHighlight(0)
  }, [query, filteredTemplates.length])

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

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

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  function pick(template) {
    if (!template) return
    onApplyTemplate?.(template)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((i) => Math.min(filteredTemplates.length - 1, i + 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((i) => Math.max(0, i - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      pick(filteredTemplates[highlight])
    }
  }

  const sharedAnchorEl =
    anchorMode === 'center' && popoverAnchorRef?.current ? popoverAnchorRef.current : null
  const positionClass = sharedAnchorEl
    ? 'left-1/2 -translate-x-1/2'
    : anchorMode === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0'

  const isHero = size === 'hero'

  const popover = open ? (
    <div
      ref={popoverRef}
      className={classNames(
        'absolute z-30 top-full mt-1.5 w-[640px] rounded-xl border border-rippling-line bg-white shadow-rippling-dropdown anim-slide-in-bottom overflow-hidden',
        positionClass,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-rippling-line-2 flex items-center gap-2">
        <BookOpen size={13} strokeWidth={1.85} className="text-rippling-muted" />
        <span className="text-[13px] font-semibold text-rippling-ink">Templates</span>
        <span className="text-[12px] text-rippling-muted ml-0.5">
          {TEMPLATES.length} playbooks
        </span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-[12px] text-rippling-ink-2 hover:text-rippling-plum hover:bg-rippling-chip/40 transition-colors font-medium"
          title="Create a new template (coming soon)"
        >
          <Plus size={12} strokeWidth={2} />
          <span>New template</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-rippling-line-2">
        <div className="relative">
          <Search
            size={13}
            strokeWidth={1.75}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rippling-muted"
          />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${TEMPLATES.length} templates…`}
            className="w-full h-8 pl-7 pr-2 text-[12.5px] rounded-md bg-rippling-surface border border-transparent placeholder:text-rippling-muted focus:outline-none focus:bg-white focus:border-rippling-line transition-colors"
          />
        </div>
      </div>

      {/* Two-column template grid */}
      <div className="p-3 max-h-[420px] overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="px-3 py-8 text-center text-[12px] text-rippling-muted">
            No templates match.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                size="lg"
                highlighted={index === highlight}
                onSelect={pick}
              />
            ))}
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
          'inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors',
          isHero
            ? open
              ? 'h-10 px-5 text-[13.5px] border-rippling-plum/40 bg-rippling-chip text-rippling-plum shadow-sm'
              : 'h-10 px-5 text-[13.5px] border-rippling-line text-rippling-ink-2 hover:border-rippling-plum/30 hover:bg-rippling-chip/30 shadow-sm bg-white'
            : open
              ? 'h-8 px-2.5 text-[12.5px] border-rippling-plum/40 bg-rippling-chip text-rippling-plum'
              : 'h-8 px-2.5 text-[12.5px] border-rippling-line text-rippling-ink-2 hover:bg-rippling-surface-2',
        )}
      >
        <BookOpen size={isHero ? 14 : 13} strokeWidth={1.85} />
        <span>Browse templates</span>
      </button>

      {sharedAnchorEl ? createPortal(popover, sharedAnchorEl) : popover}
    </div>
  )
}
