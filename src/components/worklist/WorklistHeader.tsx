import { ArrowLeft } from 'lucide-react'

type Props = {
  name: string
  selectedCount: number
  onNameChange: (value: string) => void
  onBack: () => void
  onSaveDraft: () => void
}

export default function WorklistHeader({ name, selectedCount, onNameChange, onBack, onSaveDraft }: Props) {
  return (
    <header className="border-b border-rippling-line bg-white px-5 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="h-8 px-2 rounded-md text-[12.5px] text-rippling-muted ui-interactive-chip hover:text-rippling-ink flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="h-8 rounded-md border border-transparent px-2 text-[15px] font-semibold text-rippling-ink focus:border-rippling-line focus:bg-rippling-surface focus:outline-none w-[220px]"
          aria-label="Worklist name"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          className="h-8 px-3 rounded-md border border-rippling-line text-[13px] text-rippling-ink-2 ui-interactive font-medium"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={selectedCount === 0}
          className="h-8 px-3 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors bg-rippling-plum text-white hover:bg-rippling-plum-hover disabled:bg-rippling-surface-2 disabled:text-rippling-muted disabled:cursor-not-allowed"
        >
          Continue to Step 2
          <span className="text-[11px] text-white/90">
            {selectedCount > 0 ? `Pick attributes to edit (${selectedCount} employees)` : ''}
          </span>
        </button>
      </div>
    </header>
  )
}
