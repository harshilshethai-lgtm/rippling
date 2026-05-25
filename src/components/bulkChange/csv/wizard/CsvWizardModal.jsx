import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { classNames } from '../../../../lib/utils'
import UploadStep from './UploadStep'

const WIZARD_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'map', label: 'Map columns' },
  { id: 'review', label: 'Review & confirm' },
]

function StepDots({ currentStep }) {
  const currentIdx = WIZARD_STEPS.findIndex((s) => s.id === currentStep)
  return (
    <div className="flex items-center gap-2">
      {WIZARD_STEPS.map((step, i) => {
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
            {i < WIZARD_STEPS.length - 1 && (
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

/**
 * Generic 3-step CSV wizard modal.
 *
 * Props:
 *   adapter          — plain object exposing title, subtitle, buildTemplateRows,
 *                      initMapping, MapBody, runResolve, ReviewBody,
 *                      canContinue, confirmLabel, buildConfirmPayload
 *   context          — mode-specific data passed to every adapter method
 *   initialPayload   — optional { parsed, inferredMapping } to seed from a staged draft
 *   onClose
 *   onConfirm(payload)
 */
export default function CsvWizardModal({
  adapter,
  context,
  initialPayload,
  onClose,
  onConfirm,
}) {
  const [step, setStep] = useState(initialPayload?.parsed ? 'map' : 'upload')
  const [parsed, setParsed] = useState(initialPayload?.parsed ?? null)
  const [mapping, setMapping] = useState(() =>
    initialPayload?.parsed
      ? adapter.initMapping(initialPayload.parsed.headers, context, initialPayload)
      : {},
  )
  const [resolution, setResolution] = useState(null)
  const [overrides, setOverrides] = useState({})
  const backdropRef = useRef(null)

  // Esc to close
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

  const handleParsed = useCallback(
    (nextParsed) => {
      setParsed(nextParsed)
      if (nextParsed) {
        setMapping(adapter.initMapping(nextParsed.headers, context, null))
      } else {
        setMapping({})
      }
    },
    [adapter, context],
  )

  function handleContinue() {
    if (step === 'upload') {
      setStep('map')
      return
    }
    if (step === 'map') {
      const res = adapter.runResolve({ parsed, mapping, context })
      setResolution(res)
      setOverrides({})
      setStep('review')
      return
    }
    if (step === 'review') {
      const payload = adapter.buildConfirmPayload({ parsed, mapping, resolution, overrides, context })
      onConfirm(payload)
    }
  }

  function handleBack() {
    if (step === 'map') setStep('upload')
    if (step === 'review') setStep('map')
  }

  const state = { parsed, mapping, resolution, overrides }
  const canContinue = adapter.canContinue(step, state, context)
  const continueLabel = step === 'review' ? adapter.confirmLabel(state, context) : 'Continue'

  const stepIdx = WIZARD_STEPS.findIndex((s) => s.id === step)

  // Destructure component references so JSX can reference them (React needs
  // component names to start with uppercase or be a direct variable reference)
  const MapBody = adapter.MapBody
  const ReviewBody = adapter.ReviewBody

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
            <h2 className="text-[15px] font-semibold text-rippling-ink">{adapter.title}</h2>
            {adapter.subtitle && (
              <p className="text-[12px] text-rippling-muted mt-0.5">{adapter.subtitle}</p>
            )}
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
            <UploadStep
              onParsed={handleParsed}
              buildTemplateRows={() => adapter.buildTemplateRows(context)}
              templateFilename={adapter.templateFilename ?? 'rippling_template.csv'}
              extras={adapter.uploadExtras ? adapter.uploadExtras(context) : null}
            />
          )}
          {step === 'map' && parsed && (
            <MapBody
              parsed={parsed}
              headers={parsed.headers}
              mapping={mapping}
              onMappingChange={setMapping}
              context={context}
            />
          )}
          {step === 'review' && resolution && (
            <ReviewBody
              parsed={parsed}
              mapping={mapping}
              resolution={resolution}
              overrides={overrides}
              onChangeOverrides={setOverrides}
              context={context}
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
              disabled={!canContinue}
              className={classNames(
                'inline-flex items-center gap-1.5 h-8 pl-3 pr-2.5 rounded-md text-[13px] font-medium transition-colors',
                canContinue
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
