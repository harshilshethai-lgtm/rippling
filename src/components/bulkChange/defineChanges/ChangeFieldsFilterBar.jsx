import { useRef, useState } from 'react'
import { AtSign, BookOpen, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { classNames } from '../../../lib/utils'
import { FIELDS_BY_KEY } from './fieldSchema'
import AddFieldButton from './AddFieldButton'
import AskAiButton from './AskAiButton'
import BrowseTemplatesButton from './BrowseTemplatesButton'
import PropertyInput from './PropertyInput'
import TrimFieldsPanel from './TrimFieldsPanel'

/**
 * Selected-properties surface for the Define and Make changes pages.
 *
 * variant="expanded" (Define page)
 *   • Empty: full-width hero with @-mention input, onboarding hints, and
 *     action buttons — a single unified card, no nested boxes.
 *   • Populated: chips row + action bar beneath. The action bar uses the
 *     same stable anchor ref in both states so popovers don't jump.
 *
 * variant="compact" (Make changes page)
 *   • Chips + inline @-input + compact action row left-aligned.
 *
 * Button order: + Add property | Browse templates | Ask AI
 */
export default function ChangeFieldsFilterBar({
  selectedFieldKeys,
  bulkValues,
  onAddFields,
  onApplyTemplate,
  onRemoveField,
  onRemoveFields,
  onClearAll,
  variant = 'expanded',
}) {
  const [trimOpen, setTrimOpen] = useState(false)
  const trimAnchorRef = useRef(null)
  const actionsAnchorRef = useRef(null)

  const isExpanded = variant === 'expanded'
  const hasFields = selectedFieldKeys.length > 0
  const showManage = selectedFieldKeys.length >= 8

  function handleTrimApply(keysToRemove) {
    if (keysToRemove.length > 0) onRemoveFields?.(keysToRemove)
    setTrimOpen(false)
  }

  function handleClearAll() {
    if (!hasFields) return
    onClearAll?.()
  }

  // ── Action buttons — order: Add Property | Browse Templates | Ask AI ──
  // Always rendered with anchorMode="center" and the shared actionsAnchorRef
  // so the popover anchor is stable regardless of page state.
  const actionButtons = (
    <>
      <AddFieldButton
        alreadySelectedKeys={selectedFieldKeys}
        onAddFields={onAddFields}
        size={!hasFields && isExpanded ? 'large' : 'default'}
      />
      <BrowseTemplatesButton
        onApplyTemplate={onApplyTemplate}
        anchorMode="center"
        popoverAnchorRef={actionsAnchorRef}
        size={!hasFields && isExpanded ? 'hero' : 'default'}
      />
      <AskAiButton
        alreadySelectedKeys={selectedFieldKeys}
        onApplyTemplate={onApplyTemplate}
        onAddFields={onAddFields}
        anchorMode="center"
        popoverAnchorRef={actionsAnchorRef}
      />
    </>
  )

  // ── Empty state hero (expanded only) ─────────────────────────────────────
  if (isExpanded && !hasFields) {
    return (
      <div className="rounded-2xl border border-rippling-line bg-white px-8 py-10 flex flex-col items-center">
        {/* Headline */}
        <h2 className="text-[18px] font-semibold text-rippling-ink tracking-tight text-center">
          Define what changes for everyone
        </h2>
        <p className="text-[13px] text-rippling-muted mt-1.5 max-w-[420px] text-center leading-relaxed">
          Pick properties to edit, start from a template, or describe the change
          in plain English. You&apos;ll set values on the next page.
        </p>

        {/* @-mention input */}
        <div className="mt-6 w-full max-w-[480px]">
          <PropertyInput
            variant="hero"
            alreadySelectedKeys={selectedFieldKeys}
            onAddFields={onAddFields}
          />
        </div>

        {/* Onboarding hints */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <HintChip icon={AtSign} label="Type @ to add a property, e.g. @manager" />
          <HintChip icon={BookOpen} label="Or browse templates below" />
          <HintChip icon={Sparkles} label="Or let AI suggest properties" />
        </div>

        {/* Stable action row — same element in populated state too */}
        <div
          ref={actionsAnchorRef}
          className="relative mt-6 flex items-center justify-center gap-3 flex-wrap"
        >
          {actionButtons}
        </div>
      </div>
    )
  }

  // ── Compact variant (Make changes page) ──────────────────────────────────
  if (!isExpanded) {
    return (
      <div className="space-y-2">
        {hasFields && (
          <div className="flex items-start gap-1.5 flex-wrap min-h-[28px]">
            {selectedFieldKeys.map((fieldKey) => {
              const meta = FIELDS_BY_KEY.get(fieldKey)
              if (!meta) return null
              return (
                <FieldChip
                  key={fieldKey}
                  meta={meta}
                  onRemove={() => onRemoveField?.(fieldKey)}
                />
              )
            })}

            <PropertyInput
              variant="inline"
              alreadySelectedKeys={selectedFieldKeys}
              onAddFields={onAddFields}
            />

            {showManage && (
              <div ref={trimAnchorRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTrimOpen((v) => !v)}
                  className={classNames(
                    'inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[12px] font-medium transition-colors',
                    trimOpen
                      ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-plum'
                      : 'border-rippling-line text-rippling-ink-2 hover:bg-rippling-surface-2',
                  )}
                  aria-expanded={trimOpen}
                >
                  <SlidersHorizontal size={11} strokeWidth={1.9} />
                  <span>Manage</span>
                </button>

                <TrimFieldsPanel
                  open={trimOpen}
                  selectedFieldKeys={selectedFieldKeys}
                  bulkValues={bulkValues}
                  onClose={() => setTrimOpen(false)}
                  onApply={handleTrimApply}
                />
              </div>
            )}
          </div>
        )}

        <div
          ref={actionsAnchorRef}
          className="relative flex items-center gap-2 flex-wrap"
        >
          {actionButtons}
        </div>
      </div>
    )
  }

  // ── Populated expanded state ──────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-rippling-line bg-white px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12.5px] font-medium text-rippling-ink-2">
            Selected properties
          </span>
          <span className="text-[12px] text-rippling-muted tabular-nums">
            {selectedFieldKeys.length}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 h-6 px-1.5 rounded text-[11.5px] text-rippling-muted hover:text-rippling-ink ui-interactive"
              title="Remove all selected properties"
            >
              <X size={11} strokeWidth={2} />
              <span>Clear all</span>
            </button>
          </div>
        </div>

        <div className="flex items-start gap-1.5 flex-wrap min-h-[28px]">
          {selectedFieldKeys.map((fieldKey) => {
            const meta = FIELDS_BY_KEY.get(fieldKey)
            if (!meta) return null
            return (
              <FieldChip
                key={fieldKey}
                meta={meta}
                onRemove={() => onRemoveField?.(fieldKey)}
              />
            )
          })}

          <PropertyInput
            variant="inline"
            alreadySelectedKeys={selectedFieldKeys}
            onAddFields={onAddFields}
          />

          {showManage && (
            <div ref={trimAnchorRef} className="relative">
              <button
                type="button"
                onClick={() => setTrimOpen((v) => !v)}
                className={classNames(
                  'inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[12px] font-medium transition-colors',
                  trimOpen
                    ? 'border-rippling-plum/40 bg-rippling-chip text-rippling-plum'
                    : 'border-rippling-line text-rippling-ink-2 hover:bg-rippling-surface-2',
                )}
                aria-expanded={trimOpen}
              >
                <SlidersHorizontal size={11} strokeWidth={1.9} />
                <span>Manage</span>
              </button>

              <TrimFieldsPanel
                open={trimOpen}
                selectedFieldKeys={selectedFieldKeys}
                bulkValues={bulkValues}
                onClose={() => setTrimOpen(false)}
                onApply={handleTrimApply}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stable action row — always centered */}
      <div className="flex items-center justify-center">
        <div
          ref={actionsAnchorRef}
          className="relative flex items-center justify-center gap-3 flex-wrap"
        >
          {actionButtons}
        </div>
      </div>
    </div>
  )
}

function FieldChip({ meta, onRemove }) {
  const Icon = meta.sectionIcon
  return (
    <span className="group inline-flex items-stretch h-7 rounded-full border border-rippling-line bg-white text-[12px] overflow-hidden">
      <span className="flex items-center gap-1.5 px-2.5 h-full">
        {Icon && (
          <Icon size={11} strokeWidth={1.75} className="text-rippling-muted shrink-0" />
        )}
        <span className="text-rippling-ink-2 truncate max-w-[180px]">{meta.label}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="h-full px-1.5 ui-interactive flex items-center justify-center border-l border-rippling-line-2 text-rippling-muted hover:text-rippling-ink"
        aria-label={`Remove ${meta.label} property`}
        title={`Remove ${meta.label}`}
      >
        <X size={11} strokeWidth={2} />
      </button>
    </span>
  )
}

function HintChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rippling-line bg-rippling-surface px-3 py-1 text-[11.5px] text-rippling-muted">
      <Icon size={11} strokeWidth={1.9} className="text-rippling-plum/60 shrink-0" />
      {label}
    </span>
  )
}
