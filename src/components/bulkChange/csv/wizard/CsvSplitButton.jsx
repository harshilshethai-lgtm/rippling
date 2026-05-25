import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Download, FileUp, Info } from 'lucide-react'
import { classNames } from '../../../../lib/utils'
import CsvWizardModal from './CsvWizardModal'
import { selectAdapter } from './adapters/selectAdapter.jsx'
import { defineAdapter } from './adapters/defineAdapter.jsx'
import { makeAdapter } from './adapters/makeAdapter.jsx'
import { downloadCsv } from '../csvDraft'

const ADAPTERS = {
  select: selectAdapter,
  define: defineAdapter,
  make: makeAdapter,
}

/**
 * Single CSV entry point for all three wizard steps.
 *
 * Variants:
 *   chip    — dashed-border chip in the filter bar (Select People)
 *   body    — centered bordered button (Define Change Set)
 *   toolbar — standard small toolbar button (Make Changes)
 *
 * Mode-specific props:
 *   select: { employees, selectedIds, onExportCsv, onConfirm }
 *   define: { selectedEmployees, selectedFieldKeys, onConfirm }
 *   make:   { employees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField,
 *             stagedCsvDraft, onClearStagedCsvDraft, onConfirm }
 */
export default function CsvSplitButton({
  mode,
  variant = 'toolbar',
  // select mode
  employees,
  selectedIds,
  onExportCsv,
  // define mode
  selectedEmployees,
  selectedFieldKeys,
  // make mode
  bulkValues,
  cellOverrides,
  uniformByField,
  stagedCsvDraft,
  onClearStagedCsvDraft,
  // shared
  onConfirm,
}) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [initialPayload, setInitialPayload] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const caretRef = useRef(null)
  const dropdownRef = useRef(null)

  const adapter = ADAPTERS[mode]

  // Context passed to every adapter method
  const context = buildContext(mode, {
    employees,
    selectedEmployees,
    selectedFieldKeys,
    bulkValues,
    cellOverrides,
    uniformByField,
  })

  // Position the dropdown below the caret
  function openDropdown() {
    if (caretRef.current) {
      const rect = caretRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 4, left: rect.left })
    }
    setDropdownOpen(true)
  }

  // Close on click outside
  useEffect(() => {
    if (!dropdownOpen) return undefined
    function onMouseDown(e) {
      if (caretRef.current?.contains(e.target)) return
      if (dropdownRef.current?.contains(e.target)) return
      setDropdownOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [dropdownOpen])

  function openWizard(payload = null) {
    setInitialPayload(payload)
    setDropdownOpen(false)
    setWizardOpen(true)
  }

  function handleConfirm(payload) {
    setWizardOpen(false)
    setInitialPayload(null)
    if (mode === 'make' && initialPayload) {
      onClearStagedCsvDraft?.()
    }
    onConfirm?.(payload)
  }

  function handleDownloadTemplate() {
    const rows = adapter.buildTemplateRows(context)
    downloadCsv(adapter.templateFilename ?? 'rippling_template.csv', rows)
    setDropdownOpen(false)
  }

  function handleDownloadCurrentData() {
    if (mode === 'select') {
      onExportCsv?.()
    } else {
      // For define/make the adapter.buildTemplateRows already returns current-data rows
      const rows = adapter.buildTemplateRows(context)
      downloadCsv(adapter.templateFilename ?? 'rippling_data.csv', rows)
    }
    setDropdownOpen(false)
  }

  function handleStagedDraft() {
    openWizard(stagedCsvDraft)
  }

  const hasCurrentData =
    (mode === 'select' && selectedIds?.size > 0) ||
    (mode === 'define' && selectedFieldKeys?.length > 0) ||
    (mode === 'make' && selectedFieldKeys?.length > 0 && employees?.length > 0)

  const dropdownItems = buildDropdownItems({
    mode,
    hasCurrentData,
    hasStagedDraft: Boolean(stagedCsvDraft),
    onDownloadTemplate: handleDownloadTemplate,
    onDownloadCurrentData: hasCurrentData ? handleDownloadCurrentData : null,
    onOpenWizard: () => openWizard(),
    onStagedDraft: handleStagedDraft,
  })

  return (
    <>
      {/* Trigger */}
      <SplitTrigger
        variant={variant}
        caretRef={caretRef}
        onMainClick={() => openWizard()}
        onCaretClick={openDropdown}
        dropdownOpen={dropdownOpen}
      />

      {/* Dropdown portal */}
      {dropdownOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 1000 }}
          className="bg-white border border-rippling-line rounded-lg shadow-rippling-dropdown min-w-[220px] overflow-hidden py-1"
        >
          {dropdownItems.map((item, i) => {
            if (item.type === 'divider') {
              return <div key={i} className="my-1 border-t border-rippling-line-2" />
            }
            return (
              <button
                key={i}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                className={classNames(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-left transition-colors',
                  item.disabled
                    ? 'text-rippling-muted cursor-not-allowed'
                    : item.highlight
                    ? 'text-rippling-plum hover:bg-rippling-chip'
                    : 'text-rippling-ink hover:bg-rippling-surface',
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  {item.description && (
                    <p className="text-[11px] text-rippling-muted mt-0.5">{item.description}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>,
        document.body,
      )}

      {/* Wizard modal */}
      {wizardOpen && (
        <CsvWizardModal
          adapter={adapter}
          context={context}
          initialPayload={initialPayload}
          onClose={() => { setWizardOpen(false); setInitialPayload(null) }}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}

// ── Trigger button ────────────────────────────────────────────────────────────

function SplitTrigger({ variant, caretRef, onMainClick, onCaretClick, dropdownOpen }) {
  const BASE_LABEL = 'CSV'

  if (variant === 'chip') {
    return (
      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={onMainClick}
          className={classNames(
            'inline-flex items-center gap-1 h-7 pl-2 rounded-l-full border border-dashed text-[12px] font-medium transition-colors',
            'border-rippling-line text-rippling-muted hover:text-rippling-ink-2 hover:border-rippling-ink-2/30',
          )}
        >
          <FileUp size={12} strokeWidth={2} />
          <span>{BASE_LABEL}</span>
        </button>
        <button
          ref={caretRef}
          type="button"
          onClick={onCaretClick}
          aria-label="CSV options"
          className={classNames(
            'h-7 px-1.5 rounded-r-full border border-l-0 border-dashed text-[12px] font-medium transition-colors flex items-center',
            dropdownOpen
              ? 'border-rippling-ink-2/30 bg-rippling-surface text-rippling-ink-2'
              : 'border-rippling-line text-rippling-muted hover:text-rippling-ink-2 hover:border-rippling-ink-2/30',
          )}
        >
          <ChevronDown size={11} strokeWidth={2} />
        </button>
      </div>
    )
  }

  if (variant === 'body') {
    return (
      <div className="inline-flex items-center rounded-md border border-rippling-line bg-white shadow-sm">
        <button
          type="button"
          onClick={onMainClick}
          className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 text-[12.5px] text-rippling-ink-2 hover:bg-rippling-surface transition-colors rounded-l-md"
        >
          <FileUp size={13} strokeWidth={2} />
          <span>CSV</span>
        </button>
        <div className="w-px h-5 bg-rippling-line" />
        <button
          ref={caretRef}
          type="button"
          onClick={onCaretClick}
          aria-label="CSV options"
          className={classNames(
            'h-8 px-1.5 rounded-r-md flex items-center text-rippling-muted hover:text-rippling-ink-2 hover:bg-rippling-surface transition-colors',
            dropdownOpen ? 'bg-rippling-surface text-rippling-ink-2' : '',
          )}
        >
          <ChevronDown size={13} strokeWidth={2} />
        </button>
      </div>
    )
  }

  // variant === 'toolbar'
  return (
    <div className="inline-flex items-center rounded-md border border-rippling-line bg-white">
      <button
        type="button"
        onClick={onMainClick}
        className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-2 text-[12.5px] text-rippling-ink-2 hover:bg-rippling-surface transition-colors rounded-l-md"
      >
        <FileUp size={13} strokeWidth={2} />
        <span>CSV</span>
      </button>
      <div className="w-px h-5 bg-rippling-line" />
      <button
        ref={caretRef}
        type="button"
        onClick={onCaretClick}
        aria-label="CSV options"
        className={classNames(
          'h-8 px-1.5 rounded-r-md flex items-center text-rippling-muted hover:text-rippling-ink-2 hover:bg-rippling-surface transition-colors',
          dropdownOpen ? 'bg-rippling-surface text-rippling-ink-2' : '',
        )}
      >
        <ChevronDown size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildContext(mode, props) {
  const { employees, selectedEmployees, selectedFieldKeys, bulkValues, cellOverrides, uniformByField } = props
  if (mode === 'select') return { employees: employees ?? [] }
  if (mode === 'define') {
    return {
      employees: employees ?? [],
      selectedEmployees: selectedEmployees ?? [],
      selectedFieldKeys: selectedFieldKeys ?? [],
    }
  }
  // make
  return {
    employees: employees ?? [],
    selectedFieldKeys: selectedFieldKeys ?? [],
    bulkValues: bulkValues ?? {},
    cellOverrides: cellOverrides ?? {},
    uniformByField: uniformByField ?? {},
    currentState: { bulkValues: bulkValues ?? {}, cellOverrides: cellOverrides ?? {}, uniformByField: uniformByField ?? {} },
  }
}

function buildDropdownItems({
  mode,
  hasCurrentData,
  hasStagedDraft,
  onDownloadTemplate,
  onDownloadCurrentData,
  onOpenWizard,
  onStagedDraft,
}) {
  const items = []

  if (mode === 'select') {
    items.push({
      label: 'Download employee template',
      description: 'Blank CSV to fill with profile numbers, names or emails',
      icon: <Download size={13} strokeWidth={2} className="text-rippling-muted" />,
      onClick: onDownloadTemplate,
    })
    if (onDownloadCurrentData) {
      items.push({
        label: 'Download current selection',
        description: 'Export selected employees as CSV',
        icon: <Download size={13} strokeWidth={2} className="text-rippling-muted" />,
        onClick: onDownloadCurrentData,
        disabled: !hasCurrentData,
      })
    }
  }

  if (mode === 'define') {
    items.push({
      label: 'Download blank changes worksheet',
      description: 'Identity columns only',
      icon: <Download size={13} strokeWidth={2} className="text-rippling-muted" />,
      onClick: onDownloadTemplate,
    })
    if (hasCurrentData) {
      items.push({
        label: 'Download worksheet with selected fields',
        description: 'Includes columns for your current change set',
        icon: <Download size={13} strokeWidth={2} className="text-rippling-muted" />,
        onClick: onDownloadCurrentData,
      })
    }
  }

  if (mode === 'make') {
    items.push({
      label: hasCurrentData ? 'Download current draft CSV' : 'Download blank values template',
      description: hasCurrentData
        ? 'Export the grid with all current draft values'
        : 'Blank template — add values and upload back',
      icon: <Download size={13} strokeWidth={2} className="text-rippling-muted" />,
      onClick: hasCurrentData ? onDownloadCurrentData : onDownloadTemplate,
    })
  }

  // Upload option (always available, same as main click)
  items.push({ type: 'divider' })
  items.push({
    label: 'Upload & import…',
    icon: <FileUp size={13} strokeWidth={2} className="text-rippling-muted" />,
    onClick: onOpenWizard,
  })

  // Staged draft shortcut (make mode only)
  if (mode === 'make' && hasStagedDraft) {
    items.push({
      label: 'Use staged CSV from Define step',
      description: 'Continue with the CSV you uploaded earlier',
      icon: <Info size={13} strokeWidth={2} className="text-rippling-plum" />,
      onClick: onStagedDraft,
      highlight: true,
    })
  }

  return items
}
