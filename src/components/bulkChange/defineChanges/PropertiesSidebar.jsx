import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Info } from 'lucide-react'
import PropertiesPanel from './PropertiesPanel'
import ProcessFlow from './ProcessFlow'
import { classNames } from '../../../lib/utils'

/**
 * Collapsible right rail for the Define and Make changes steps.
 *
 * When open (w-[300px]) it shows two collapsible sections:
 *   • Stakeholders — Lead / Observers / Approvers / Collaborators
 *   • Process      — Hierarchical step flow
 *
 * When collapsed (w-9) it renders a vertical toggle strip.
 *
 * Top-level rail header is "Details" (renamed from "Properties" so it no
 * longer clashes with the "properties" = fields terminology on the main page).
 * The inner section is "Stakeholders" (renamed from "Details").
 */
export default function PropertiesSidebar({
  lead,
  observers,
  approvers,
  collaborators,
  steps,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [stakeholdersOpen, setStakeholdersOpen] = useState(true)
  const [processOpen, setProcessOpen] = useState(true)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  if (collapsed) {
    return (
      <aside className="w-9 shrink-0 border-l border-rippling-line bg-white flex flex-col items-center py-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="h-7 w-7 rounded-md hover:bg-rippling-surface flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors"
          aria-label="Expand details panel"
          title="Expand details panel"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </button>

        <span
          className="mt-4 text-[10px] font-medium text-rippling-muted tracking-wide uppercase whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Details
        </span>
      </aside>
    )
  }

  return (
    <aside className="w-[300px] shrink-0 border-l border-rippling-line bg-white flex flex-col overflow-hidden">
      {/* Rail header */}
      <div className="h-10 px-4 border-b border-rippling-line flex items-center justify-between shrink-0">
        <span className="text-[12.5px] font-semibold text-rippling-ink-2">Details</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="h-6 w-6 rounded-md hover:bg-rippling-surface flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors"
          aria-label="Collapse details panel"
          title="Collapse"
        >
          <ChevronRight size={13} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Stakeholders section ── */}
        <section>
          <button
            type="button"
            className="w-full h-8 px-4 flex items-center justify-between hover:bg-rippling-surface group transition-colors"
            onClick={() => setStakeholdersOpen((v) => !v)}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5px] font-semibold text-rippling-muted">
                Stakeholders
              </span>
              {/* Info tooltip */}
              <span className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setTooltipVisible(true)}
                  onMouseLeave={() => setTooltipVisible(false)}
                  onFocus={() => setTooltipVisible(true)}
                  onBlur={() => setTooltipVisible(false)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 flex items-center justify-center rounded text-rippling-muted hover:text-rippling-ink-2 transition-colors"
                  aria-label="About stakeholders"
                >
                  <Info size={11} strokeWidth={1.9} />
                </button>
                {tooltipVisible && (
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-[240px] rounded-lg border border-rippling-line bg-white shadow-rippling-dropdown px-3 py-2.5 text-[11.5px] text-rippling-ink-2 leading-relaxed pointer-events-none">
                    Observers and approvers are added automatically based on the
                    properties you select. Hover a{' '}
                    <span className="text-rippling-plum font-medium">via …</span> chip to
                    see which property triggered their addition.
                  </div>
                )}
              </span>
            </div>
            {stakeholdersOpen ? (
              <ChevronUp
                size={12}
                strokeWidth={2}
                className="text-rippling-muted group-hover:text-rippling-ink"
              />
            ) : (
              <ChevronDown
                size={12}
                strokeWidth={2}
                className="text-rippling-muted group-hover:text-rippling-ink"
              />
            )}
          </button>

          {stakeholdersOpen && (
            <PropertiesPanel
              lead={lead}
              observers={observers}
              approvers={approvers}
              collaborators={collaborators}
              onAddObserver={onAddObserver}
              onRemoveObserver={onRemoveObserver}
              onAddApprover={onAddApprover}
              onRemoveApprover={onRemoveApprover}
              onAddCollaborator={onAddCollaborator}
              onRemoveCollaborator={onRemoveCollaborator}
            />
          )}
        </section>

        <div className="h-px bg-rippling-line mx-4" />

        {/* ── Process section ── */}
        <section>
          <button
            type="button"
            className="w-full h-8 px-4 flex items-center justify-between hover:bg-rippling-surface group transition-colors"
            onClick={() => setProcessOpen((v) => !v)}
          >
            <span className="text-[11.5px] font-semibold text-rippling-muted">Process</span>
            {processOpen ? (
              <ChevronUp
                size={12}
                strokeWidth={2}
                className="text-rippling-muted group-hover:text-rippling-ink"
              />
            ) : (
              <ChevronDown
                size={12}
                strokeWidth={2}
                className="text-rippling-muted group-hover:text-rippling-ink"
              />
            )}
          </button>

          {processOpen && <ProcessFlow steps={steps} />}
        </section>
      </div>
    </aside>
  )
}
