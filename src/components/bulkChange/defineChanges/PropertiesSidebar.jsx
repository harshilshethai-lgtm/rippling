import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, Info, PanelRightClose, PanelRightOpen } from 'lucide-react'
import PropertiesPanel from './PropertiesPanel'
import ProcessFlow from './ProcessFlow'
import EffectiveDatePicker, { getTzAbbrev } from './EffectiveDatePicker'
import { classNames } from '../../../lib/utils'

/** Formats the dynamic tooltip text for the effective date info icon */
function formatEffectiveTooltip(dt) {
  if (!dt) return ''
  const { date, hour, minute, ampm, timezone } = dt
  const [y, m, d] = date.split('-').map(Number)
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const minStr = String(minute).padStart(2, '0')
  const tzAbbr = getTzAbbrev(timezone)
  return `These changes will be effective on ${dateLabel} at ${hour}:${minStr}:00 ${ampm} ${tzAbbr} for each profile affected by this change. The local time will differ based on individual location.`
}

/**
 * Info icon that renders its tooltip via a portal anchored to the
 * viewport, so it's never clipped by overflow-hidden parents.
 */
function InfoTooltip({ content }) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  function show() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.top + rect.height / 2, left: rect.left })
    }
    setVisible(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        onFocus={show}
        onBlur={() => setVisible(false)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 flex items-center justify-center rounded text-rippling-muted hover:text-rippling-ink-2 transition-colors"
        aria-label="More information"
      >
        <Info size={11} strokeWidth={1.9} />
      </button>

      {visible &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: coords.top,
              right: `calc(100vw - ${coords.left}px + 8px)`,
              transform: 'translateY(-50%)',
            }}
            className="z-[9999] w-[240px] rounded-lg border border-rippling-line bg-white shadow-rippling-dropdown px-3 py-2.5 text-[11.5px] text-rippling-ink-2 leading-relaxed pointer-events-none"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

/**
 * Collapsible right rail for the Define and Make changes steps.
 *
 * Sections (top to bottom):
 *   1. Effective Date      — always visible, date/time/timezone picker
 *   2. Stakeholders        — collapsible: Lead / Observers / Approvers / Collaborators
 *   3. Follow up steps     — collapsible: hierarchical step flow
 */
export default function PropertiesSidebar({
  lead,
  observers,
  approvers,
  collaborators,
  steps,
  effectiveDateTime,
  onEffectiveDateTimeChange,
  onAddObserver,
  onRemoveObserver,
  onAddApprover,
  onRemoveApprover,
  onAddCollaborator,
  onRemoveCollaborator,
  hideProcessSection = false,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [stakeholdersOpen, setStakeholdersOpen] = useState(true)
  const [processOpen, setProcessOpen] = useState(true)

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
          <PanelRightOpen size={15} strokeWidth={1.75} />
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
    <aside className="w-[300px] shrink-0 border-l border-rippling-line bg-white flex flex-col">
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
          <PanelRightClose size={15} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Effective Date section (always visible, at top) ── */}
        {effectiveDateTime && (
          <section className="px-4 pt-3 pb-3 border-b border-rippling-line">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11.5px] font-semibold text-rippling-muted">
                Effective Date
              </span>
              <InfoTooltip content={formatEffectiveTooltip(effectiveDateTime)} />
            </div>
            <EffectiveDatePicker
              value={effectiveDateTime}
              onChange={onEffectiveDateTimeChange}
            />
          </section>
        )}

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
              <InfoTooltip content="Observers and approvers are added automatically based on the properties you select." />
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

        {!hideProcessSection && (
          <>
            <div className="h-px bg-rippling-line mx-4" />

            {/* ── Follow up steps section ── */}
            <section>
              <button
                type="button"
                className="w-full h-8 px-4 flex items-center justify-between hover:bg-rippling-surface group transition-colors"
                onClick={() => setProcessOpen((v) => !v)}
              >
                <span className="text-[11.5px] font-semibold text-rippling-muted">
                  Follow up steps
                </span>
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
          </>
        )}
      </div>
    </aside>
  )
}
