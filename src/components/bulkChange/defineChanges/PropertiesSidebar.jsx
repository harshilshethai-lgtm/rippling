import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import PropertiesPanel from './PropertiesPanel'
import ProcessFlow from './ProcessFlow'
import { classNames } from '../../../lib/utils'

/**
 * Linear-style collapsible right rail.
 *
 * When open (w-[320px]) it shows two collapsible sections:
 *   • Properties  — Lead / Observers / Approvers / Collaborators
 *   • Process     — Hierarchical step flow
 *
 * When collapsed (w-9) it renders a vertical toggle strip.
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
  const [propertiesOpen, setPropertiesOpen] = useState(true)
  const [processOpen, setProcessOpen] = useState(true)

  if (collapsed) {
    return (
      <aside className="w-9 shrink-0 border-l border-rippling-line bg-white flex flex-col items-center py-3">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="h-7 w-7 rounded-md hover:bg-rippling-surface flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors"
          aria-label="Expand properties panel"
          title="Expand properties panel"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </button>

        {/* Rotated label */}
        <span
          className="mt-4 text-[10px] font-medium text-rippling-muted tracking-wide uppercase whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Properties
        </span>
      </aside>
    )
  }

  return (
    <aside className="w-[300px] shrink-0 border-l border-rippling-line bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-10 px-4 border-b border-rippling-line flex items-center justify-between shrink-0">
        <span className="text-[12px] font-semibold text-rippling-ink-2 uppercase tracking-wide">
          Properties
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="h-6 w-6 rounded-md hover:bg-rippling-surface flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors"
          aria-label="Collapse properties panel"
          title="Collapse"
        >
          <ChevronRight size={13} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Properties section ── */}
        <section>
          <button
            type="button"
            className="w-full h-8 px-4 flex items-center justify-between hover:bg-rippling-surface group transition-colors"
            onClick={() => setPropertiesOpen((v) => !v)}
          >
            <span className="text-[11px] font-semibold text-rippling-muted uppercase tracking-wide">
              Details
            </span>
            {propertiesOpen ? (
              <ChevronUp size={12} strokeWidth={2} className="text-rippling-muted group-hover:text-rippling-ink" />
            ) : (
              <ChevronDown size={12} strokeWidth={2} className="text-rippling-muted group-hover:text-rippling-ink" />
            )}
          </button>

          {propertiesOpen && (
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
            <span className="text-[11px] font-semibold text-rippling-muted uppercase tracking-wide">
              Process
            </span>
            {processOpen ? (
              <ChevronUp size={12} strokeWidth={2} className="text-rippling-muted group-hover:text-rippling-ink" />
            ) : (
              <ChevronDown size={12} strokeWidth={2} className="text-rippling-muted group-hover:text-rippling-ink" />
            )}
          </button>

          {processOpen && <ProcessFlow steps={steps} />}
        </section>
      </div>
    </aside>
  )
}
