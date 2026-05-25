import {
  CheckCircle2,
  Cog,
  FileText,
  Bell,
  Zap,
  ShieldCheck,
  PlugZap,
  GitMerge,
  Play,
} from 'lucide-react'
import { classNames } from '../../../lib/utils'

const KIND_META = {
  system: { Icon: Cog, color: 'text-blue-500', bg: 'bg-blue-50' },
  document: { Icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
  notification: { Icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50' },
  validation: { Icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50' },
  integration: { Icon: PlugZap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  approval: { Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  default: { Icon: Zap, color: 'text-rippling-muted', bg: 'bg-rippling-surface-2' },
}

function kindMeta(kind) {
  return KIND_META[kind] ?? KIND_META.default
}

function StepNode({ step, index, isChild, isLast, parentIsLast }) {
  const { Icon, color, bg } = kindMeta(step.kind)
  const hasChildren = step.children && step.children.length > 0

  return (
    <li className="relative">
      {/* Vertical connector line from parent */}
      {isChild && !isLast && (
        <span
          aria-hidden
          className="absolute left-[11px] top-6 bottom-0 w-px bg-rippling-line"
        />
      )}

      <div className="flex items-start gap-2.5 py-1.5">
        {/* Step icon */}
        <span
          className={classNames(
            'shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5',
            bg,
          )}
        >
          <Icon size={10} strokeWidth={2} className={color} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12.5px] text-rippling-ink leading-snug">{step.label}</span>
            <span className="text-[10px] font-medium text-rippling-plum/70 bg-rippling-chip px-1.5 py-0.5 rounded-full">
              Auto
            </span>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && (
        <ul className="ml-6 relative before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-px before:bg-rippling-line">
          {step.children.map((child, ci) => (
            <StepNode
              key={child.id}
              step={child}
              index={ci}
              isChild
              isLast={ci === step.children.length - 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Fixed tail steps that are always present regardless of field selection */
const FIXED_TAIL = [
  {
    id: 'fixed-review',
    label: 'Review & approve',
    kind: 'approval',
    children: [],
    fixed: true,
  },
  {
    id: 'fixed-apply',
    label: 'Apply changes',
    kind: 'system',
    children: [],
    fixed: true,
  },
]

function FixedStepNode({ step, isLast }) {
  const { Icon, color, bg } = kindMeta(step.kind)

  return (
    <li className="relative">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[11px] top-6 bottom-0 w-px bg-rippling-line"
        />
      )}
      <div className="flex items-start gap-2.5 py-1.5">
        <span
          className={classNames(
            'shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5',
            bg,
          )}
        >
          <Icon size={10} strokeWidth={2} className={color} />
        </span>
        <span className="text-[12.5px] text-rippling-ink-2 leading-snug">{step.label}</span>
      </div>
    </li>
  )
}

/**
 * Hierarchical process flow shown in the bottom half of the right sidebar.
 * Auto-derived steps are rendered first, then a fixed "Review & approve" /
 * "Apply changes" tail that's always present.
 */
export default function ProcessFlow({ steps }) {
  const hasDerived = steps.length > 0

  return (
    <div className="px-4 pb-4">
      {!hasDerived && (
        <p className="text-[12px] text-rippling-muted italic py-2">
          Process steps will appear here based on the fields you add.
        </p>
      )}

      <ul className="relative">
        {/* Continuous vertical line running through all steps */}
        {hasDerived && (
          <span
            aria-hidden
            className="absolute left-[11px] top-3 bottom-3 w-px bg-rippling-line pointer-events-none"
          />
        )}

        {steps.map((step, i) => (
          <StepNode
            key={step.id}
            step={step}
            index={i}
            isLast={i === steps.length - 1}
          />
        ))}

        {/* Separator between derived and fixed */}
        {hasDerived && (
          <li aria-hidden>
            <div className="flex items-center gap-2 py-1">
              <span className="h-5 w-5 shrink-0 flex items-center justify-center">
                <GitMerge size={11} strokeWidth={1.75} className="text-rippling-muted" />
              </span>
              <span className="flex-1 h-px bg-rippling-line" />
            </div>
          </li>
        )}

        {FIXED_TAIL.map((step, i) => (
          <FixedStepNode
            key={step.id}
            step={step}
            isLast={i === FIXED_TAIL.length - 1}
          />
        ))}
      </ul>
    </div>
  )
}
