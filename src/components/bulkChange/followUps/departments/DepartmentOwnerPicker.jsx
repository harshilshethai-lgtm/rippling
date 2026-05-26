import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import MemberPickerPopover from '../../defineChanges/MemberPickerPopover'
import { avatarClass, classNames, initials } from '../../../../lib/utils'

/**
 * Single-owner picker for a department. Per the design contract, this owner
 * is applied to every task in the department — there is no per-task owner
 * picker. Picking an owner ALSO adds them as a wizard Collaborator via the
 * useDepartmentTasks hook (one-way sync).
 *
 * Empty state: dashed "+ Assign owner" pill.
 * Filled state: avatar + name + clear ✕.
 */
export default function DepartmentOwnerPicker({ owner, onSelect, onClear }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const triggerRef = useRef(null)

  if (owner) {
    return (
      <div className="inline-flex items-center h-7 pl-1 pr-1 rounded-full border border-rippling-line bg-white gap-1.5">
        <span
          className={classNames(
            'h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0',
            avatarClass(owner.name),
          )}
        >
          {initials(owner.name)}
        </span>
        <span className="text-[12px] text-rippling-ink leading-none">{owner.name}</span>
        <button
          type="button"
          onClick={onClear}
          className="h-5 w-5 rounded-full flex items-center justify-center text-rippling-muted hover:text-rippling-ink hover:bg-rippling-surface transition-colors"
          aria-label={`Clear owner ${owner.name}`}
          title="Clear owner"
        >
          <X size={10} strokeWidth={2.25} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className={classNames(
          'inline-flex items-center h-7 pl-2 pr-2.5 rounded-full border border-dashed text-[12px] gap-1.5 transition-colors',
          pickerOpen
            ? 'bg-white border-rippling-plum/50 text-rippling-plum'
            : 'bg-white border-rippling-line text-rippling-muted hover:border-rippling-plum/50 hover:text-rippling-plum',
        )}
      >
        <Plus size={11} strokeWidth={2} />
        <span>Assign owner</span>
      </button>

      {pickerOpen && (
        <MemberPickerPopover
          anchorRef={triggerRef}
          excludeIds={new Set()}
          onSelect={(person) => {
            onSelect(person)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
