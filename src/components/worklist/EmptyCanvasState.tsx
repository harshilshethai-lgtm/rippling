import { SlidersHorizontal, Sparkles, Upload, UserRoundSearch } from 'lucide-react'
import type { EntryMethod } from './EntryMethodTabs'

type Props = {
  onPickMethod: (method: EntryMethod) => void
}

const methods: Array<{ id: EntryMethod; title: string; body: string; icon: typeof SlidersHorizontal }> = [
  { id: 'filter', title: 'Filter', body: 'Build a precise audience with stackable filters.', icon: SlidersHorizontal },
  { id: 'ai', title: 'Ask AI', body: 'Describe the group in natural language.', icon: Sparkles },
  { id: 'paste', title: 'Paste / Upload', body: 'Paste emails, names, or employee IDs from Excel/CSV.', icon: Upload },
  { id: 'manual', title: 'Manual search', body: 'Find specific people by name or email.', icon: UserRoundSearch },
]

export default function EmptyCanvasState({ onPickMethod }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full rounded-xl border border-dashed border-rippling-line bg-white p-8">
        <div className="text-center mb-6">
          <h2 className="text-[22px] font-semibold text-rippling-ink">Start your worklist canvas</h2>
          <p className="text-[13px] text-rippling-muted mt-1">
            Choose how you want to select users. Selection persists across every method.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {methods.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onPickMethod(method.id)}
                className="rounded-lg border border-rippling-line bg-rippling-surface px-4 py-3 text-left hover:border-rippling-plum/40 hover:bg-rippling-chip transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className="text-rippling-plum" />
                  <p className="text-[13px] font-semibold text-rippling-ink">{method.title}</p>
                </div>
                <p className="text-[12.5px] text-rippling-muted">{method.body}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
