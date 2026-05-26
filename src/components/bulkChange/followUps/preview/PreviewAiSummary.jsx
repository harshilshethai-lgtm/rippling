import { Sparkles } from 'lucide-react'
import { classNames } from '../../../../lib/utils'

/**
 * AI pre-flight summary card at the top of the Preview panel.
 * Canned copy generated from aggregate counts — no LLM call.
 * Matches existing Rippling design (white card, shadow-rippling-card) rather
 * than the mockup's gradient background.
 */
export default function PreviewAiSummary({ headline, body, chips, isLoading }) {
  if (isLoading) return null

  return (
    <div className="bg-white rounded-xl border border-rippling-line shadow-rippling-card px-5 py-4 mb-4">
      {/* Header row */}
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={13} strokeWidth={1.75} className="text-rippling-plum shrink-0" />
        <span className="text-[10.5px] font-semibold text-rippling-muted uppercase tracking-wider">
          AI Pre-flight Summary
        </span>
      </div>

      {/* Headline */}
      <p className="text-[15px] font-semibold text-rippling-ink leading-snug mb-1.5">
        {headline}
      </p>

      {/* Body */}
      {body && (
        <p className="text-[12.5px] text-rippling-ink-2 leading-relaxed mb-3">
          {body}
        </p>
      )}

      {/* Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center h-6 px-2.5 rounded-full bg-rippling-chip border border-rippling-line text-[11.5px] font-medium text-rippling-ink-2"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
