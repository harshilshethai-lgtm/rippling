import { useCallback, useRef, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import MemberPickerPopover from '../../defineChanges/MemberPickerPopover'
import { avatarClass, classNames, initials } from '../../../../lib/utils'

/**
 * Inline approver assignment chip inside an EventCard.
 * When no approver is set: shows "Assign approver" button.
 * When set: shows avatar + name + remove ×.
 *
 * Props:
 *   approver   — { id, name, role } | null
 *   onAssign   — (person) => void
 *   onRemove   — () => void
 *   required   — bool (whether this event's gate requires an approver)
 */
export default function EventApproverChip({ approver, onAssign, onRemove, required }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)

  const handleSelect = useCallback((person) => {
    onAssign(person)
    setOpen(false)
  }, [onAssign])

  if (approver) {
    return (
      <span className="inline-flex items-center gap-1.5 h-6 pl-1.5 pr-2 rounded-full bg-rippling-chip border border-rippling-line text-[11.5px] font-medium text-rippling-ink">
        <span
          className={classNames(
            'h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-semibold text-white shrink-0',
            avatarClass(approver.name),
          )}
        >
          {initials(approver.name)}
        </span>
        <span className="max-w-[100px] truncate">{approver.name}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-rippling-muted hover:text-rippling-ink ml-0.5 transition-colors"
          aria-label="Remove approver"
        >
          <X size={10} strokeWidth={2} />
        </button>
      </span>
    )
  }

  return (
    <span className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={classNames(
          'inline-flex items-center gap-1 h-6 px-2.5 rounded-full border text-[11.5px] font-medium transition-colors',
          required
            ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
            : 'border-rippling-line bg-white text-rippling-muted hover:bg-rippling-surface hover:text-rippling-ink',
        )}
      >
        <UserPlus size={11} strokeWidth={1.75} />
        <span>Assign reviewer</span>
        {required && <span className="ml-0.5 text-orange-500">*</span>}
      </button>

      {open && (
        <MemberPickerPopover
          anchorRef={btnRef}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
          excludeIds={new Set()}
        />
      )}
    </span>
  )
}
