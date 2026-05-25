import { AtSign, Layers, Plus, Sparkles } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="h-full min-h-[360px] border border-dashed border-rippling-line rounded-xl bg-white flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="h-12 w-12 rounded-full bg-rippling-chip text-rippling-plum flex items-center justify-center mb-4">
        <Layers size={20} strokeWidth={1.75} />
      </div>
      <h2 className="text-[18px] font-semibold text-rippling-ink tracking-tight">
        Let's find the right people
      </h2>
      <p className="mt-1.5 text-[13px] text-rippling-muted max-w-[460px] leading-relaxed">
        Narrow the company down to the people this bulk change should affect. The matching
        employees will populate below as you add filters.
      </p>

      <div className="mt-5 flex flex-col sm:flex-row items-center gap-2 text-[12px] text-rippling-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rippling-line bg-white px-2.5 py-1">
          <Plus size={11} strokeWidth={2} className="text-rippling-plum" />
          <span>
            Press <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10.5px] text-rippling-ink-2">/</kbd> to add a filter
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rippling-line bg-white px-2.5 py-1">
          <Sparkles size={11} strokeWidth={2} className="text-rippling-plum" />
          <span>
            Press <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10.5px] text-rippling-ink-2">?</kbd> to filter with AI
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rippling-line bg-white px-2.5 py-1">
          <AtSign size={11} strokeWidth={2} className="text-rippling-plum" />
          <span>
            Type <kbd className="px-1 py-px rounded border border-rippling-line bg-rippling-surface text-[10.5px] text-rippling-ink-2">@</kbd> to select specific employees
          </span>
        </span>
      </div>
    </div>
  )
}
