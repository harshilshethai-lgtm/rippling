import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { EMPLOYEES } from '../../../data/employees'
import { classNames } from '../../../lib/utils'
import UploadStep from './UploadStep'
import MapStep from './MapStep'
import ReviewStep, { computeConfirmed } from './ReviewStep'
import { detectMapping, resolveAllRows } from './csvImportUtils'

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'map', label: 'Map columns' },
  { id: 'review', label: 'Review & confirm' },
]

function StepDots({ currentStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep)
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={classNames(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors',
                  done
                    ? 'bg-rippling-plum text-white'
                    : active
                    ? 'bg-rippling-plum text-white ring-2 ring-rippling-plum/30'
                    : 'bg-rippling-surface-2 text-rippling-muted border border-rippling-line',
                )}
              >
                {done ? <Check size={11} strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className={classNames(
                  'text-[12.5px] font-medium',
                  active ? 'text-rippling-ink' : done ? 'text-rippling-ink-2' : 'text-rippling-muted',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={classNames(
                  'w-8 h-px',
                  i < currentIdx ? 'bg-rippling-plum' : 'bg-rippling-line',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CsvImportModal({ onClose, onConfirm }) {
  const [step, setStep] = useState('upload')
  const [parsed, setParsed] = useState(null)       // { headers, rows, sourceName }
  const [mapping, setMapping] = useState({})        // { Name?: colIdx, Email?: colIdx }
  const [resolvedRows, setResolvedRows] = useState([])
  const [overrides, setOverrides] = useState({})
  const backdropRef = useRef(null)

  // Auto-detect mapping when parsed data becomes available
  useEffect(() => {
    if (parsed?.headers) {
      setMapping(detectMapping(parsed.headers))
    }
  }, [parsed])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose()
  }

  /* ── Step navigation ── */

  function canContinue() {
    if (step === 'upload') return parsed && parsed.rows.length > 0
    if (step === 'map') return mapping.Name !== undefined || mapping.Email !== undefined
    if (step === 'review') {
      const { resolvedIds } = computeConfirmed(resolvedRows, overrides)
      // Must resolve all ambiguous rows before confirming; at least 1 match needed.
      const stillAmbiguous = resolvedRows.some((r, i) => r.status === 'ambiguous' && !overrides[i])
      return !stillAmbiguous && resolvedIds.length > 0
    }
    return false
  }

  function handleContinue() {
    if (step === 'upload') {
      setStep('map')
      return
    }
    if (step === 'map') {
      const rows = resolveAllRows(parsed.rows, mapping, EMPLOYEES)
      setResolvedRows(rows)
      setOverrides({})
      setStep('review')
      return
    }
    if (step === 'review') {
      const { resolvedIds, missedRows } = computeConfirmed(resolvedRows, overrides)
      onConfirm({ resolvedIds, missedRows })
    }
  }

  function handleBack() {
    if (step === 'map') setStep('upload')
    if (step === 'review') setStep('map')
  }

  const continueLabel =
    step === 'review'
      ? `Confirm import (${computeConfirmed(resolvedRows, overrides).resolvedIds.length})`
      : 'Continue'

  const stepIdx = STEPS.findIndex((s) => s.id === step)

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rippling-line shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-rippling-ink">Import from CSV</h2>
            <p className="text-[12px] text-rippling-muted mt-0.5">
              Add employees to your worklist using a CSV file
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors"
            aria-label="Close"
          >
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-rippling-line-2 bg-rippling-surface shrink-0">
          <StepDots currentStep={step} />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {step === 'upload' && (
            <UploadStep onParsed={setParsed} />
          )}
          {step === 'map' && parsed && (
            <MapStep
              headers={parsed.headers}
              mapping={mapping}
              onMappingChange={setMapping}
            />
          )}
          {step === 'review' && (
            <ReviewStep
              resolvedRows={resolvedRows}
              employees={EMPLOYEES}
              onResolutionChange={setOverrides}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-rippling-line shrink-0 bg-white">
          <div>
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] text-rippling-ink-2 hover:bg-rippling-surface border border-rippling-line transition-colors"
              >
                <ArrowLeft size={13} strokeWidth={1.75} />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-md text-[13px] text-rippling-muted hover:text-rippling-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue()}
              className={classNames(
                'inline-flex items-center gap-1.5 h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium transition-colors',
                canContinue()
                  ? 'bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm'
                  : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed',
              )}
            >
              <span>{continueLabel}</span>
              {step !== 'review' && <ArrowRight size={13} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
