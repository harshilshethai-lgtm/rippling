import { ArrowLeft } from 'lucide-react'
import type { RefObject } from 'react'
import { cn } from './filterStepUtils'

type Props = {
  worklistName: string
  nameEditing: boolean
  canContinue: boolean
  selectedCount: number
  onNameChange: (name: string) => void
  onEditName: (editing: boolean) => void
  onSaveDraft: () => void
  onBack?: () => void
  nameInputRef: RefObject<HTMLInputElement>
}

export default function WorklistStepTopBar({
  worklistName,
  nameEditing,
  canContinue,
  selectedCount,
  onNameChange,
  onEditName,
  onSaveDraft,
  onBack,
  nameInputRef,
}: Props) {
  return (
    <header className="h-14 px-5 border-b border-rippling-line bg-white flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-8 px-2 rounded-md text-rippling-muted ui-interactive flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span className="text-[12.5px] font-medium">Back</span>
        </button>
        {nameEditing ? (
          <input
            ref={nameInputRef}
            value={worklistName}
            onChange={(event) => onNameChange(event.target.value)}
            onBlur={() => onEditName(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onEditName(false)
            }}
            placeholder="Untitled worklist"
            className="h-8 min-w-[230px] rounded-md border border-rippling-line px-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-rippling-primary/25"
          />
        ) : (
          <button
            type="button"
            onClick={() => onEditName(true)}
            className={cn(
              'h-8 px-2 rounded-md text-left ui-interactive',
              worklistName.trim() ? 'text-rippling-ink' : 'text-rippling-muted italic',
            )}
          >
            {worklistName.trim() || 'Untitled worklist'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          className="h-8 px-3 rounded-md border border-rippling-line bg-white text-[12.5px] font-medium text-rippling-ink-2 ui-interactive"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={!canContinue}
          className={cn(
            'h-8 px-3 rounded-md text-[12.5px] font-medium',
            canContinue
              ? 'bg-rippling-primary text-white hover:bg-rippling-primary-hover'
              : 'bg-rippling-surface-2 text-rippling-muted cursor-not-allowed',
          )}
        >
          {canContinue ? `Continue to Step 2 (${selectedCount})` : 'Continue to Step 2'}
        </button>
      </div>
    </header>
  )
}
