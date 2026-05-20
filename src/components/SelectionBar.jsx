import { X, Layers, ArrowRight } from 'lucide-react'

export default function SelectionBar({ selectedCount, onClear, onStartBulkChange }) {
  if (selectedCount === 0) return null

  return (
    <div className="border-t border-rippling-line bg-white px-5 py-3 flex items-center gap-3 anim-slide-in-bottom">
      <button
        onClick={onClear}
        className="w-7 h-7 rounded-md ui-interactive flex items-center justify-center text-rippling-muted hover:text-rippling-ink transition-colors"
      >
        <X size={15} strokeWidth={1.75} />
      </button>

      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-semibold text-rippling-ink">{selectedCount}</span>
        <span className="text-[13px] text-rippling-ink-2">
          {selectedCount === 1 ? 'person' : 'people'} selected
        </span>
      </div>

      <div className="flex-1" />

      <button className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive font-medium transition-colors">
        Add to group
      </button>

      <button className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive font-medium transition-colors">
        Send message
      </button>

      <button
        onClick={onStartBulkChange}
        className="h-8 pl-3 pr-3.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 bg-rippling-plum text-white hover:bg-rippling-plum-hover shadow-sm transition-colors"
      >
        <Layers size={14} strokeWidth={2} />
        <span>Start bulk change</span>
        <ArrowRight size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
